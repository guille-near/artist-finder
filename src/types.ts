/** Links a plataformas de streaming extraidos */
export interface StreamingLinks {
  spotify: string | null;
  appleMusic: string | null;
  amazonMusic: string | null;
}

/** Datos de Instagram verificados */
export interface InstagramData {
  handle: string | null;
  source: "bio_text" | "bio_link" | "api_verified" | "not_found";
  confidence: "high" | "medium" | "low";
  verified: boolean;
  followers: number | null;
  biography: string | null;
  profilePicUrl: string | null;
  isBusinessAccount: boolean;
}

/** Resultado final del artista encontrado */
export interface ArtistResult {
  tiktok: {
    handle: string;
    nickname: string;
    bio: string;
    bioLink: string | null;
    verified: boolean;
    followers: number;
    likes: number;
    videoCount: number;
    avatarUrl: string;
  };
  song: {
    title: string;
    author: string;
    album: string;
    clipId: string;
    usageCount: number;
    coverUrl: string | null;
  };
  instagram: InstagramData;
  streaming: StreamingLinks;
  creditsUsed: number;
}
