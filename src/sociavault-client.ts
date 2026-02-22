const BASE_URL = "https://api.sociavault.com/v1/scrape";

export interface SociaVaultArtist {
  handle: string;
  nick_name: string;
  uid: string;
  sec_uid: string;
  is_verified: boolean;
}

export interface DspSongInfo {
  platform: number; // 1 = Apple Music, 2 = Amazon Music, 3 = Spotify
  song_id: string;
}

export interface MusicDetailsData {
  success: boolean;
  music_info: {
    title: string;
    author: string;
    album: string;
    owner_handle: string;
    owner_nickname: string;
    is_original_sound: boolean;
    user_count: number;
    artists: Record<string, SociaVaultArtist>;
    uncert_artists: Record<string, { name: string }> | null;
    tt_to_dsp_song_infos?: Record<string, DspSongInfo> | null;
    cover_medium?: { url_list: Record<string, string> };
  };
}

export interface KeywordSearchData {
  success: boolean;
  search_item_list: Record<string, {
    aweme_info: {
      music: {
        id_str: string;
        mid: string;
        title: string;
        author: string;
        album: string;
        is_original_sound: boolean;
        is_pgc: boolean;
        is_author_artist: boolean;
        user_count: number;
        artists?: Record<string, SociaVaultArtist>;
        owner_handle?: string;
      };
    };
  }>;
}

export class SociaVaultClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey || !apiKey.startsWith("sk_live_")) {
      throw new Error(
        "API key invalida. Debe empezar con 'sk_live_'. Obtenerla en https://sociavault.com/dashboard"
      );
    }
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    console.log(`  [SociaVault] GET ${endpoint} | ${JSON.stringify(params)}`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Error ${response.status} en ${endpoint}: ${errorBody}`);
    }

    const data = await response.json();
    return data as T;
  }

  /**
   * Buscar videos por keyword. Devuelve clipId como string (sin perdida de precision).
   */
  async searchByKeyword(query: string): Promise<KeywordSearchData> {
    const result = await this.request<{ data: KeywordSearchData }>(
      "tiktok/search/keyword",
      { query }
    );
    return result.data;
  }

  /**
   * Obtener detalles de una cancion por clipId.
   * Devuelve artistas oficiales con handles de TikTok + links de streaming.
   */
  async getMusicDetails(clipId: string): Promise<MusicDetailsData> {
    const result = await this.request<{ data: MusicDetailsData }>(
      "tiktok/music/details",
      { clipId }
    );
    return result.data;
  }
}
