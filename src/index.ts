import "dotenv/config";
import { ArtistFinder } from "./artist-finder";

async function main() {
  const sociavaultKey = process.env.SOCIAVAULT_API_KEY;

  if (!sociavaultKey) {
    console.error("Error: Configura SOCIAVAULT_API_KEY en .env");
    console.error("  Obtenla en: https://sociavault.com/dashboard");
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("TikTok Artist Finder");
    console.log("Busca perfiles de artistas por cancion\n");
    console.log("Uso:");
    console.log('  npm run cli -- "artista nombre_cancion"\n');
    console.log("Ejemplos:");
    console.log('  npm run cli -- "Kendrick Lamar luther"');
    console.log('  npm run cli -- "Bad Bunny Monaco"');
    console.log('  npm run cli -- "Rosalia Malamente"\n');
    process.exit(0);
  }

  const query = args.join(" ");
  const finder = new ArtistFinder(sociavaultKey);

  try {
    const result = await finder.findArtistBySong(query);

    if (!result) {
      console.log("\nNo se pudo encontrar informacion del artista.");
      console.log("Intenta con otra combinacion de artista + cancion.");
      process.exit(1);
    }

    console.log("\n" + "=".repeat(50));
    console.log("RESUMEN DEL ARTISTA");
    console.log("=".repeat(50));

    console.log("\n[Cancion]");
    console.log(`  Titulo:   ${result.song.title}`);
    console.log(`  Autor:    ${result.song.author}`);
    if (result.song.album) console.log(`  Album:    ${result.song.album}`);
    if (result.song.usageCount > 0) {
      console.log(`  Usada en: ${result.song.usageCount.toLocaleString()} videos`);
    }

    console.log("\n[TikTok]");
    console.log(`  Handle:     @${result.tiktok.handle}`);
    console.log(`  Nombre:     ${result.tiktok.nickname}`);
    console.log(`  Seguidores: ${result.tiktok.followers.toLocaleString()}`);
    console.log(`  Videos:     ${result.tiktok.videoCount}`);
    console.log(`  Verificado: ${result.tiktok.verified ? "Si" : "No"}`);
    if (result.tiktok.bio) console.log(`  Bio:        ${result.tiktok.bio}`);

    console.log("\n[Instagram]");
    if (result.instagram.handle) {
      console.log(`  Handle:     @${result.instagram.handle}`);
      console.log(`  Fuente:     ${result.instagram.source}`);
      console.log(`  URL:        https://instagram.com/${result.instagram.handle}`);
    } else {
      console.log("  No encontrado en el perfil");
    }

    console.log("\n[Streaming]");
    if (result.streaming.spotify) console.log(`  Spotify:      ${result.streaming.spotify}`);
    if (result.streaming.appleMusic) console.log(`  Apple Music:  ${result.streaming.appleMusic}`);
    if (result.streaming.amazonMusic) console.log(`  Amazon Music: ${result.streaming.amazonMusic}`);
    if (!result.streaming.spotify && !result.streaming.appleMusic && !result.streaming.amazonMusic) {
      console.log("  No se encontraron links de streaming");
    }

    console.log("\n" + "=".repeat(50));

    console.log("\n[JSON]");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\nError: ${error.message}`);
    } else {
      console.error("\nError desconocido:", error);
    }
    process.exit(1);
  }
}

main();
