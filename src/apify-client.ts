const APIFY_API_BASE = "https://api.apify.com/v2";

export interface ApifyMusicResult {
  id: number;
  id_str: string;
  title: string;
  author: string;
  album: string;
  duration: number;
  user_count: number;
  owner_handle: string;
  owner_nickname: string;
  is_original: boolean;
  cover_large?: { url_list: string[] };
  cover_medium?: { url_list: string[] };
  avatar_thumb?: { url_list: string[] };
}

export interface ApifyVideoResult {
  id: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  hashtags: string[];
  channel: {
    name: string;
    username: string;
    bio?: string;
    id: string;
    url: string;
    avatar: string;
    verified: boolean;
    followers?: number;
    following?: number;
    videos?: number;
  };
  uploadedAt: number;
  uploadedAtFormatted: string;
  video: {
    width: number;
    height: number;
    ratio: string;
    duration: number;
    url: string;
    cover: string;
    thumbnail: string;
  };
  song: {
    id: number;
    title: string;
    artist: string;
    album: string | null;
    duration: number;
    cover: string;
  };
  postPage: string;
}

export class TikTokApifyClient {
  private token: string;

  constructor(token: string) {
    if (!token || !token.startsWith("apify_api_")) {
      throw new Error(
        "Token de Apify invalido. Debe empezar con 'apify_api_'. Obtenlo en https://console.apify.com/account#/integrations"
      );
    }
    this.token = token;
  }

  /**
   * Ejecuta un Actor de Apify y devuelve los items del dataset.
   * Usa el endpoint sincronico que espera a que termine y devuelve los resultados.
   */
  private async runActor<T>(actorId: string, input: Record<string, unknown>): Promise<T[]> {
    const url = `${APIFY_API_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${this.token}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Error ${response.status} ejecutando ${actorId}: ${errorBody}`);
    }

    return (await response.json()) as T[];
  }

  /**
   * Busca videos en TikTok por keyword usando apidojo/tiktok-scraper.
   */
  async searchByKeyword(query: string, maxItems = 20): Promise<ApifyVideoResult[]> {
    console.log(`  [Apify] Ejecutando tiktok-scraper con keyword: "${query}"`);

    return this.runActor<ApifyVideoResult>("apidojo~tiktok-scraper", {
      keywords: [query],
      maxItems,
    });
  }

  /**
   * Obtiene videos asociados a una URL de musica usando apidojo/tiktok-music-scraper.
   */
  async getMusicVideos(musicUrl: string, maxItems = 20): Promise<ApifyVideoResult[]> {
    console.log(`  [Apify] Ejecutando tiktok-music-scraper: "${musicUrl}"`);

    return this.runActor<ApifyVideoResult>("apidojo~tiktok-music-scraper", {
      startUrls: [musicUrl],
      maxItems,
    });
  }

  /**
   * Busca musica/sonidos en TikTok por keyword usando axlymxp/tiktok-music-scraper.
   * Equivalente a la pestaña "Sonidos" de TikTok.
   */
  async searchMusic(query: string, maxItems = 10): Promise<ApifyMusicResult[]> {
    console.log(`  [Apify] Ejecutando tiktok-music-scraper (sounds): "${query}"`);

    return this.runActor<ApifyMusicResult>("axlymxp~tiktok-music-scraper", {
      keyword: query,
      max_items: maxItems,
    });
  }

  /**
   * Obtiene datos de perfil de TikTok usando apidojo/tiktok-profile-scraper.
   * Devuelve posts del usuario con datos del canal (followers, etc).
   */
  async getProfile(username: string): Promise<ApifyVideoResult[]> {
    console.log(`  [Apify] Ejecutando tiktok-profile-scraper: @${username}`);

    return this.runActor<ApifyVideoResult>("apidojo~tiktok-profile-scraper", {
      usernames: [username],
      maxItems: 1,
    });
  }
}
