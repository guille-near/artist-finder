import { TikTokApifyClient, type ApifyMusicResult } from "./apify-client";
import { SociaVaultClient } from "./sociavault-client";
import { extractInstagramFromProfile } from "./instagram-parser";
import type {
  ArtistResult,
  InstagramData,
  StreamingLinks,
} from "./types";

export class ArtistFinder {
  private apify: TikTokApifyClient;
  private sociavault: SociaVaultClient;

  constructor(apifyToken: string, sociavaultKey: string) {
    this.apify = new TikTokApifyClient(apifyToken);
    this.sociavault = new SociaVaultClient(sociavaultKey);
  }

  async findArtistBySong(query: string): Promise<ArtistResult | null> {
    const results = await this.findMultipleArtistsBySong(query, 5);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Flujo hibrido:
   * 1a. Apify music search → buscar sonidos directamente (pestaña Sonidos de TikTok)
   * 1b. Fallback: SociaVault keyword search → buscar canciones via videos
   * 2. SociaVault music/details → handles reales de artistas + streaming links
   * 3. Apify profile-scraper → perfil completo con followers, bio, etc.
   * 4. Parsear bio para Instagram
   */
  async findMultipleArtistsBySong(query: string, maxResults = 5): Promise<ArtistResult[]> {
    console.log(`\n--- Buscando: "${query}" ---`);

    const queryWords = this.normalize(query).split(/\s+/).filter(w => w.length > 1);

    // ─── Paso 1a: Buscar sonidos directamente (Apify) ──────────
    console.log("\n[Paso 1a] Buscando sonidos en TikTok (Apify music search)...");
    let clipId: string | null = null;
    let songTitle = "";
    let songAuthor = "";
    let songAlbum = "";
    let songCoverUrl: string | null = null;

    try {
      const musicResults = await this.apify.searchMusic(query, 10);
      if (musicResults.length > 0) {
        console.log(`  ${musicResults.length} sonidos encontrados`);
        const bestMusic = this.findBestMatchingMusic(musicResults, queryWords);
        if (bestMusic) {
          clipId = bestMusic.id_str || String(bestMusic.id);
          songTitle = bestMusic.title;
          songAuthor = bestMusic.author;
          songAlbum = bestMusic.album || "";
          if (bestMusic.cover_medium?.url_list?.[0]) {
            songCoverUrl = bestMusic.cover_medium.url_list[0];
          }
          console.log(`  Sonido: "${songTitle}" de ${songAuthor} (clipId: ${clipId})`);
        }
      }
    } catch (error) {
      console.log(`  Error en music search: ${error instanceof Error ? error.message : "Error"}`);
    }

    // ─── Paso 1b: Fallback a SociaVault keyword search ─────────
    if (!clipId) {
      console.log("\n[Paso 1b] Fallback: buscando via videos (SociaVault)...");
      try {
        const searchResult = await this.sociavault.searchByKeyword(query);
        if (searchResult.success && searchResult.search_item_list) {
          const items = Object.values(searchResult.search_item_list);
          console.log(`  ${items.length} videos encontrados`);
          const bestSong = this.findBestMatchingSong(items, queryWords);
          if (bestSong) {
            clipId = bestSong.id_str || bestSong.mid;
            songTitle = bestSong.title;
            songAuthor = bestSong.author;
            songAlbum = bestSong.album || "";
            console.log(`  Cancion: "${songTitle}" de ${songAuthor} (clipId: ${clipId})`);
          }
        }
      } catch (error) {
        console.log(`  Error en keyword search: ${error instanceof Error ? error.message : "Error"}`);
      }
    }

    if (!clipId) {
      console.log("  No se encontro ninguna cancion relevante.");
      return [];
    }

    // ─── Paso 2: Detalles + handles de artistas (SociaVault) ─
    console.log("\n[Paso 2] Obteniendo artistas de la cancion (SociaVault)...");
    let artistHandles: string[] = [];
    let streamingLinks: StreamingLinks = { spotify: null, appleMusic: null, amazonMusic: null };
    let songUsageCount = 0;

    try {
      const details = await this.sociavault.getMusicDetails(clipId);

      if (details.success && details.music_info) {
        const info = details.music_info;
        songUsageCount = info.user_count || 0;
        songTitle = info.title || songTitle;
        songAuthor = info.author || songAuthor;
        songAlbum = info.album || songAlbum;

        // Artistas oficiales con handles de TikTok
        if (info.artists) {
          for (const artist of Object.values(info.artists)) {
            if (artist.handle) {
              artistHandles.push(artist.handle);
              console.log(`  Artista: @${artist.handle} (${artist.nick_name})`);
            }
          }
        }

        // Fallback: owner del sonido original
        if (artistHandles.length === 0 && info.owner_handle && info.is_original_sound) {
          artistHandles.push(info.owner_handle);
          console.log(`  Owner: @${info.owner_handle} (${info.owner_nickname})`);
        }

        // Streaming links
        streamingLinks = this.extractStreamingLinks(info.tt_to_dsp_song_infos);
        if (streamingLinks.spotify) console.log(`  Spotify: ${streamingLinks.spotify}`);
        if (streamingLinks.appleMusic) console.log(`  Apple Music: ${streamingLinks.appleMusic}`);

        // Cover
        if (info.cover_medium?.url_list) {
          const urls = Object.values(info.cover_medium.url_list);
          if (urls.length > 0) songCoverUrl = urls[0];
        }
      }
    } catch (error) {
      console.log(`  Error: ${error instanceof Error ? error.message : "Error"}`);
    }

    // Fallback: intentar con el autor como handle
    if (artistHandles.length === 0 && songAuthor) {
      const guessHandle = songAuthor.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9._]/g, "");
      if (guessHandle.length >= 2) {
        artistHandles.push(guessHandle);
        console.log(`  Fallback: probando @${guessHandle} (derivado de "${songAuthor}")`);
      }
    }

    if (artistHandles.length === 0) {
      console.log("  No se encontraron handles de artistas.");
      return [];
    }

    // ─── Paso 3: Perfiles completos (Apify) ─────────────────
    console.log("\n[Paso 3] Obteniendo perfiles de TikTok (Apify)...");
    const results: ArtistResult[] = [];

    for (const handle of artistHandles.slice(0, maxResults)) {
      try {
        console.log(`  @${handle}...`);
        const profilePosts = await this.apify.getProfile(handle);

        let bio = "";
        let nickname = handle;
        let verified = false;
        let followers = 0;
        let videoCount = 0;
        let avatarUrl = "";

        if (profilePosts && profilePosts.length > 0 && profilePosts[0].channel) {
          const ch = profilePosts[0].channel;
          bio = ch.bio || "";
          nickname = ch.name || handle;
          verified = ch.verified || false;
          followers = ch.followers ?? 0;
          videoCount = ch.videos ?? 0;
          avatarUrl = ch.avatar || "";
          console.log(`    ${nickname} (${this.formatNumber(followers)} seguidores${verified ? ", verificado" : ""})`);
        }

        const instagramFromBio = extractInstagramFromProfile(bio, null);
        const instagramData: InstagramData = {
          handle: instagramFromBio.handle,
          source: instagramFromBio.source,
          confidence: instagramFromBio.confidence,
          verified: false,
          followers: null,
          biography: null,
          profilePicUrl: null,
          isBusinessAccount: false,
        };

        if (instagramFromBio.handle) {
          console.log(`    Instagram en bio: @${instagramFromBio.handle}`);
        }

        results.push({
          tiktok: { handle, nickname, bio, bioLink: null, verified, followers, likes: 0, videoCount, avatarUrl },
          song: { title: songTitle, author: songAuthor, album: songAlbum, clipId, usageCount: songUsageCount, coverUrl: songCoverUrl },
          instagram: instagramData,
          streaming: streamingLinks,
          creditsUsed: 0,
        });
      } catch (error) {
        console.log(`  Error con @${handle}: ${error instanceof Error ? error.message : "Error"}`);
      }
    }

    results.sort((a, b) => {
      if (a.tiktok.verified !== b.tiktok.verified) return a.tiktok.verified ? -1 : 1;
      return b.tiktok.followers - a.tiktok.followers;
    });

    console.log(`\n--- ${results.length} artistas encontrados ---\n`);
    return results;
  }

  private findBestMatchingMusic(
    items: ApifyMusicResult[],
    queryWords: string[]
  ): ApifyMusicResult | null {
    let bestScore = -Infinity;
    let bestItem: ApifyMusicResult | null = null;

    for (const item of items) {
      let score = 0;
      const title = this.normalize(item.title || "");
      const artist = this.normalize(item.author || "");
      const album = this.normalize(item.album || "");

      let titleMatches = 0;
      let artistMatches = 0;

      for (const word of queryWords) {
        if (title.includes(word)) { score += 3; titleMatches++; }
        if (artist.includes(word)) { score += 3; artistMatches++; }
        if (album.includes(word)) score += 1;
      }

      if (titleMatches > 0 && artistMatches > 0) score += 10;
      if (!item.is_original) score += 3;
      if (item.user_count > 1000) score += 2;
      if (item.user_count > 100000) score += 3;
      if (title.includes("original sound")) score -= 10;

      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    }

    return bestItem;
  }

  private findBestMatchingSong(
    items: { aweme_info: { music: { id_str: string; mid: string; title: string; author: string; album: string; is_original_sound: boolean; is_pgc: boolean; is_author_artist: boolean; user_count: number; artists?: Record<string, { handle: string; nick_name: string }>; owner_handle?: string } } }[],
    queryWords: string[]
  ) {
    let bestScore = -Infinity;
    let bestSong: typeof items[0]["aweme_info"]["music"] | null = null;

    for (const item of items) {
      const music = item.aweme_info?.music;
      if (!music) continue;

      let score = 0;
      const title = this.normalize(music.title || "");
      const artist = this.normalize(music.author || "");
      const album = this.normalize(music.album || "");

      let titleMatches = 0;
      let artistMatches = 0;

      for (const word of queryWords) {
        if (title.includes(word)) { score += 3; titleMatches++; }
        if (artist.includes(word)) { score += 3; artistMatches++; }
        if (album.includes(word)) score += 1;
      }

      // Bonus: query matchea en titulo Y artista → alta probabilidad de ser la cancion correcta
      if (titleMatches > 0 && artistMatches > 0) score += 10;

      // Bonus para canciones oficiales
      if (music.is_pgc) score += 5;
      if (music.is_author_artist) score += 3;
      if (music.artists && Object.keys(music.artists).length > 0) score += 3;
      if (music.user_count > 1000) score += 2;
      if (music.user_count > 100000) score += 3;

      if (title.includes("original sound")) score -= 10;

      if (score > bestScore) {
        bestScore = score;
        bestSong = music;
      }
    }

    return bestSong;
  }

  private extractStreamingLinks(
    dspInfos?: Record<string, { platform: number; song_id: string }> | null
  ): StreamingLinks {
    const links: StreamingLinks = { spotify: null, appleMusic: null, amazonMusic: null };
    if (!dspInfos) return links;

    for (const info of Object.values(dspInfos)) {
      switch (info.platform) {
        case 1: links.appleMusic = `https://music.apple.com/song/${info.song_id}`; break;
        case 2: links.amazonMusic = `https://music.amazon.com/albums/${info.song_id}`; break;
        case 3: links.spotify = `https://open.spotify.com/track/${info.song_id}`; break;
      }
    }

    return links;
  }

  private normalize(str: string): string {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  private formatNumber(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  }
}
