#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ArtistFinder } from "./artist-finder.js";
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
  "Obtiene el perfil completo de un usuario de TikTok usando la API de SociaVault: nombre, bio, seguidores, verificacion, avatar, bioLink, e intenta extraer su Instagram de la bio.",
  {
    username: z
      .string()
      .describe("Handle/username de TikTok sin @. Ejemplo: 'badbunnypr'"),
  },
  async ({ username }) => {
    const clean = username.replace(/^@/, "");
    const client = new SociaVaultClient(getEnvOrThrow("SOCIAVAULT_API_KEY"));
    const profile = await client.getProfile(clean);

    if (!profile.success || !profile.user) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No se encontro el perfil @${clean} en TikTok.`,
          },
        ],
      };
    }

    const { user, stats } = profile;
    const bioLink = user.bioLink?.link || null;

    const { extractInstagramFromProfile } = await import("./instagram-parser.js");
    const ig = extractInstagramFromProfile(user.signature || "", bioLink);

    const lines = [
      `**@${user.uniqueId}** — ${user.nickname}`,
      `Verificado: ${user.verified ? "Si" : "No"}`,
      `Seguidores: ${stats.followerCount?.toLocaleString() || "N/A"}`,
      `Videos: ${stats.videoCount || "N/A"}`,
      `Likes totales: ${stats.heartCount?.toLocaleString() || "N/A"}`,
      user.signature ? `Bio: ${user.signature}` : null,
      bioLink ? `Bio Link: ${bioLink}` : null,
      user.avatarMedium ? `Avatar: ${user.avatarMedium}` : null,
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
  "Busca sonidos/canciones en TikTok por keyword usando la API de SociaVault. " +
    "Equivalente a la pestaña 'Sonidos' de TikTok. " +
    "Devuelve titulo, artista, album, duracion, cantidad de videos, links de streaming y artistas verificados.",
  {
    query: z.string().describe("Keyword para buscar sonidos. Ejemplo: 'Monaco Bad Bunny'"),
    max_results: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe("Numero maximo de sonidos a devolver (1-10, default 5)"),
    region: z
      .string()
      .optional()
      .describe("Codigo de pais Alpha-2 (default: US). Ejemplo: 'ES', 'MX', 'GB'"),
    sort_type: z
      .enum(["0", "1", "2", "3", "4"])
      .optional()
      .describe("Ordenar: 0=Relevancia, 1=Mas usadas, 2=Mas recientes, 3=Mas cortas, 4=Mas largas"),
  },
  async ({ query, max_results, region, sort_type }) => {
    const client = new SociaVaultClient(getEnvOrThrow("SOCIAVAULT_API_KEY"));
    const data = await client.searchMusic(query, {
      region,
      sortType: sort_type,
    });

    if (!data.music || data.music.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No se encontraron sonidos para "${query}".`,
          },
        ],
      };
    }

    const results = data.music.slice(0, max_results);

    const summary = results
      .map((r, i) => {
        const dspLinks: string[] = [];
        if (r.tt_to_dsp_song_infos) {
          for (const info of r.tt_to_dsp_song_infos) {
            if (info.platform === 3) dspLinks.push(`Spotify: https://open.spotify.com/track/${info.song_id}`);
            if (info.platform === 1) dspLinks.push(`Apple Music: https://music.apple.com/song/${info.song_id}`);
            if (info.platform === 8) dspLinks.push(`Amazon Music: https://music.amazon.com/albums/${info.song_id}`);
          }
        }

        const artists = r.artists?.length
          ? r.artists.map((a) => `@${a.handle} (${a.nick_name}${a.is_verified ? ", verificado" : ""})`).join(", ")
          : null;

        return [
          `${i + 1}. **${r.title}** — ${r.author}`,
          r.album ? `   Album: ${r.album}` : null,
          `   Duracion: ${r.duration}s | Usado en: ${r.user_count.toLocaleString()} videos`,
          `   ClipId: ${r.id_str || r.id}`,
          `   Original: ${r.is_original_sound ? "Si" : "No"}`,
          artists ? `   Artistas: ${artists}` : null,
          dspLinks.length > 0 ? `   ${dspLinks.join(" | ")}` : null,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    const footer = data.has_more
      ? `\n\n_${data.total} resultados totales. Hay mas paginas disponibles._`
      : "";

    return {
      content: [{ type: "text" as const, text: summary + footer }],
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
