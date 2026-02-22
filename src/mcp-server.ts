#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ArtistFinder } from "./artist-finder.js";
import { TikTokApifyClient } from "./apify-client.js";
import { SociaVaultClient } from "./sociavault-client.js";

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable de entorno ${name} no configurada`);
  }
  return value;
}

const server = new McpServer({
  name: "sociavault-artist-finder",
  version: "1.0.0",
  description:
    "Busca artistas de TikTok a partir de canciones. Obtiene perfil, Instagram, y links de streaming (Spotify, Apple Music, Amazon Music).",
});

// ─── Tool 1: Buscar artistas por canción ─────────────────────────

server.tool(
  "search_artist_by_song",
  "Busca artistas en TikTok a partir del nombre de una cancion y/o artista. " +
    "Devuelve perfil de TikTok (handle, seguidores, verificado), Instagram (extraido de la bio), " +
    "datos de la cancion (titulo, album, usos en TikTok), y links de streaming (Spotify, Apple Music, Amazon Music).",
  {
    query: z
      .string()
      .describe(
        "Nombre del artista y/o cancion a buscar. Ejemplos: 'Bad Bunny Monaco', 'Kendrick Lamar luther', 'Rosalia Malamente'"
      ),
    max_results: z
      .number()
      .min(1)
      .max(10)
      .default(3)
      .describe("Numero maximo de artistas a devolver (1-10, default 3)"),
  },
  async ({ query, max_results }) => {
    const finder = new ArtistFinder(
      getEnvOrThrow("APIFY_API_TOKEN"),
      getEnvOrThrow("SOCIAVAULT_API_KEY")
    );

    const results = await finder.findMultipleArtistsBySong(query, max_results);

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No se encontraron artistas para "${query}". Intenta con otra combinacion de artista + cancion.`,
          },
        ],
      };
    }

    const summary = results
      .map((r, i) => {
        const lines = [
          `## Artista ${i + 1}: ${r.tiktok.nickname}`,
          "",
          "**TikTok**",
          `- Handle: @${r.tiktok.handle}`,
          `- Seguidores: ${r.tiktok.followers.toLocaleString()}`,
          `- Verificado: ${r.tiktok.verified ? "Si" : "No"}`,
          `- Videos: ${r.tiktok.videoCount}`,
          r.tiktok.bio ? `- Bio: ${r.tiktok.bio}` : null,
          "",
          "**Cancion**",
          `- Titulo: ${r.song.title}`,
          `- Autor: ${r.song.author}`,
          r.song.album ? `- Album: ${r.song.album}` : null,
          r.song.usageCount > 0
            ? `- Usada en: ${r.song.usageCount.toLocaleString()} videos`
            : null,
          "",
          "**Instagram**",
          r.instagram.handle
            ? `- Handle: @${r.instagram.handle} (confianza: ${r.instagram.confidence})`
            : "- No encontrado en el perfil",
          r.instagram.handle
            ? `- URL: https://instagram.com/${r.instagram.handle}`
            : null,
          "",
          "**Streaming**",
          r.streaming.spotify
            ? `- Spotify: ${r.streaming.spotify}`
            : null,
          r.streaming.appleMusic
            ? `- Apple Music: ${r.streaming.appleMusic}`
            : null,
          r.streaming.amazonMusic
            ? `- Amazon Music: ${r.streaming.amazonMusic}`
            : null,
          !r.streaming.spotify &&
          !r.streaming.appleMusic &&
          !r.streaming.amazonMusic
            ? "- No se encontraron links"
            : null,
        ];
        return lines.filter(Boolean).join("\n");
      })
      .join("\n\n---\n\n");

    return {
      content: [
        { type: "text" as const, text: summary },
        {
          type: "text" as const,
          text: "\n\n<details><summary>JSON completo</summary>\n\n```json\n" +
            JSON.stringify(results, null, 2) +
            "\n```\n</details>",
        },
      ],
    };
  }
);

// ─── Tool 2: Obtener detalles de una canción por clipId ──────────

server.tool(
  "get_song_details",
  "Obtiene detalles de una cancion de TikTok por su clipId. " +
    "Devuelve titulo, autor, album, artistas oficiales con handles, y links de streaming.",
  {
    clip_id: z
      .string()
      .describe("El clipId de la cancion en TikTok (obtenido de search_artist_by_song)"),
  },
  async ({ clip_id }) => {
    const client = new SociaVaultClient(getEnvOrThrow("SOCIAVAULT_API_KEY"));
    const details = await client.getMusicDetails(clip_id);

    if (!details.success || !details.music_info) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No se encontraron detalles para clipId "${clip_id}".`,
          },
        ],
      };
    }

    const info = details.music_info;
    const artists = info.artists
      ? Object.values(info.artists)
          .map((a) => `@${a.handle} (${a.nick_name})`)
          .join(", ")
      : "No disponible";

    const lines = [
      `**${info.title}** de ${info.author}`,
      info.album ? `Album: ${info.album}` : null,
      `Artistas oficiales: ${artists}`,
      `Usos en TikTok: ${info.user_count?.toLocaleString() || "N/A"}`,
      `Sonido original: ${info.is_original_sound ? "Si" : "No"}`,
    ];

    return {
      content: [
        { type: "text" as const, text: lines.filter(Boolean).join("\n") },
        {
          type: "text" as const,
          text: "\n\n```json\n" + JSON.stringify(details.music_info, null, 2) + "\n```",
        },
      ],
    };
  }
);

// ─── Tool 3: Obtener perfil de TikTok ────────────────────────────

server.tool(
  "get_tiktok_profile",
  "Obtiene el perfil completo de un usuario de TikTok: nombre, bio, seguidores, verificacion, avatar, e intenta extraer su Instagram de la bio.",
  {
    username: z
      .string()
      .describe("Handle/username de TikTok sin @. Ejemplo: 'badbunnypr'"),
  },
  async ({ username }) => {
    const clean = username.replace(/^@/, "");
    const apify = new TikTokApifyClient(getEnvOrThrow("APIFY_API_TOKEN"));
    const posts = await apify.getProfile(clean);

    if (!posts || posts.length === 0 || !posts[0].channel) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No se encontro el perfil @${clean} en TikTok.`,
          },
        ],
      };
    }

    const ch = posts[0].channel;

    const { extractInstagramFromProfile } = await import("./instagram-parser.js");
    const ig = extractInstagramFromProfile(ch.bio || "", null);

    const lines = [
      `**@${ch.username}** — ${ch.name}`,
      `Verificado: ${ch.verified ? "Si" : "No"}`,
      `Seguidores: ${ch.followers?.toLocaleString() || "N/A"}`,
      `Videos: ${ch.videos || "N/A"}`,
      ch.bio ? `Bio: ${ch.bio}` : null,
      ch.avatar ? `Avatar: ${ch.avatar}` : null,
      "",
      "**Instagram**",
      ig.handle
        ? `@${ig.handle} (fuente: ${ig.source}, confianza: ${ig.confidence})`
        : "No encontrado en la bio",
    ];

    return {
      content: [
        { type: "text" as const, text: lines.filter(Boolean).join("\n") },
      ],
    };
  }
);

// ─── Tool 4: Buscar sonidos en TikTok ────────────────────────────

server.tool(
  "search_tiktok_sounds",
  "Busca sonidos/canciones en TikTok por keyword. Equivalente a la pestaña 'Sonidos' de TikTok. " +
    "Devuelve titulo, artista, album, duracion, y cantidad de videos que usan el sonido.",
  {
    query: z.string().describe("Keyword para buscar sonidos. Ejemplo: 'Monaco Bad Bunny'"),
    max_results: z
      .number()
      .min(1)
      .max(20)
      .default(5)
      .describe("Numero maximo de sonidos a devolver (1-20, default 5)"),
  },
  async ({ query, max_results }) => {
    const apify = new TikTokApifyClient(getEnvOrThrow("APIFY_API_TOKEN"));
    const results = await apify.searchMusic(query, max_results);

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No se encontraron sonidos para "${query}".`,
          },
        ],
      };
    }

    const summary = results
      .map((r, i) => {
        return [
          `${i + 1}. **${r.title}** — ${r.author}`,
          r.album ? `   Album: ${r.album}` : null,
          `   Duracion: ${r.duration}s | Usado en: ${r.user_count.toLocaleString()} videos`,
          `   ClipId: ${r.id_str || r.id}`,
          `   Original: ${r.is_original ? "Si" : "No"}`,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    return {
      content: [{ type: "text" as const, text: summary }],
    };
  }
);

// ─── Iniciar servidor ────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Error fatal del MCP server:", error);
  process.exit(1);
});
