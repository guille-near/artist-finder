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

export interface MusicSearchItem {
  id: number;
  id_str: string;
  title: string;
  author: string;
  album: string;
  duration: number;
  user_count: number;
  is_original_sound: boolean;
  is_pgc: boolean;
  is_commerce_music: boolean;
  is_author_artist: boolean;
  has_human_voice: boolean;
  language: string;
  artists: SociaVaultArtist[];
  tt_to_dsp_song_infos?: DspSongInfo[];
  cover_large?: { url_list: string[] };
  cover_medium?: { url_list: string[] };
  play_url?: { url_list: string[] };
  matched_song?: {
    id: string;
    title: string;
    author: string;
    full_duration: number;
  };
  search_music_name?: string;
  search_music_desc?: string;
  theme_tags?: string[];
}

export interface MusicSearchData {
  status_code: number;
  music: MusicSearchItem[];
  has_more: number;
  cursor: number;
  total: number;
}

export interface TikTokProfileData {
  success: boolean;
  user: {
    id: string;
    uniqueId: string;
    nickname: string;
    signature: string;
    verified: boolean;
    avatarLarger: string;
    avatarMedium: string;
    avatarThumb: string;
    secUid: string;
    privateAccount: boolean;
    bioLink?: { link: string };
  };
  stats: {
    followerCount: number;
    followingCount: number;
    heartCount: number;
    videoCount: number;
    friendCount: number;
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
   * Buscar sonidos/musica en TikTok por keyword.
   * Devuelve hasta 10 resultados por pagina con artistas, streaming links y metadata.
   */
  async searchMusic(
    keyword: string,
    options: { region?: string; sortType?: string; filterBy?: string; offset?: number } = {}
  ): Promise<MusicSearchData> {
    const params: Record<string, string> = { keyword };
    if (options.region) params.region = options.region;
    if (options.sortType) params.sort_type = options.sortType;
    if (options.filterBy) params.filter_by = options.filterBy;
    if (options.offset !== undefined) params.offset = String(options.offset);

    const result = await this.request<{ data: MusicSearchData }>(
      "tiktok/search/music",
      params
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

  /**
   * Obtener perfil publico de TikTok por handle.
   * Devuelve bio (signature), bioLink, seguidores, verificacion, avatar, etc.
   */
  async getProfile(handle: string): Promise<TikTokProfileData> {
    const result = await this.request<{ data: TikTokProfileData }>(
      "tiktok/profile",
      { handle }
    );
    return result.data;
  }
}
