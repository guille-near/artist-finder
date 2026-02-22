interface InstagramResult {
  handle: string | null;
  source: "bio_text" | "bio_link" | "not_found";
  confidence: "high" | "medium" | "low";
}

/**
 * Extrae el handle de Instagram a partir de la bio y el bioLink de un perfil TikTok.
 *
 * Busca en este orden:
 * 1. bioLink directo a Instagram (alta confianza)
 * 2. Patrones explicitos en la bio: "IG:", "Instagram:", etc. (alta confianza)
 * 3. Links de Linktree u otros agregadores en bioLink (media confianza)
 * 4. @ mentions en la bio que podrian ser Instagram (baja confianza)
 */
export function extractInstagramFromProfile(
  bio: string,
  bioLink: string | null
): InstagramResult {
  // 1. Verificar si el bioLink es un link directo de Instagram
  if (bioLink) {
    const igFromLink = extractFromInstagramUrl(bioLink);
    if (igFromLink) {
      return { handle: igFromLink, source: "bio_link", confidence: "high" };
    }
  }

  // 2. Buscar patrones explicitos en la bio
  const explicitPatterns = [
    // "IG: @usuario" o "IG:@usuario" o "IG: usuario"
    /(?:ig|insta|instagram)\s*[:=@]\s*@?([a-zA-Z0-9._]{1,30})/i,
    // "instagram.com/usuario"
    /instagram\.com\/([a-zA-Z0-9._]{1,30})\/?/i,
    // "mi ig es @usuario" o "sigueme en ig @usuario"
    /(?:mi\s+)?(?:ig|insta)\s+(?:es\s+)?@([a-zA-Z0-9._]{1,30})/i,
    // "IG - @usuario" o "IG | @usuario"
    /(?:ig|insta|instagram)\s*[-|/\\]\s*@?([a-zA-Z0-9._]{1,30})/i,
    // Emoji de camera seguido de @usuario (comun en bios de TikTok)
    /📸\s*@?([a-zA-Z0-9._]{1,30})/,
    // "follow me on ig @usuario"
    /follow\s+(?:me\s+)?(?:on\s+)?(?:ig|insta|instagram)\s*[:@]?\s*@?([a-zA-Z0-9._]{1,30})/i,
    // "sigueme en instagram @usuario"
    /s[ií]gueme\s+en\s+(?:ig|insta|instagram)\s*[:@]?\s*@?([a-zA-Z0-9._]{1,30})/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = bio.match(pattern);
    if (match?.[1]) {
      const handle = cleanHandle(match[1]);
      if (handle && isValidInstagramHandle(handle)) {
        return { handle, source: "bio_text", confidence: "high" };
      }
    }
  }

  // 3. Verificar si el bioLink es un agregador (Linktree, etc.)
  if (bioLink) {
    const aggregatorPatterns = [
      /linktr\.ee/i,
      /linkin\.bio/i,
      /beacons\.ai/i,
      /bio\.link/i,
      /linkbio/i,
      /allmylinks/i,
      /snipfeed/i,
      /stan\.store/i,
    ];

    const isAggregator = aggregatorPatterns.some((p) => p.test(bioLink));
    if (isAggregator) {
      // No podemos extraer el IG del Linktree sin scrapearlo,
      // pero marcamos que probablemente tiene uno
      return {
        handle: null,
        source: "bio_link",
        confidence: "medium",
      };
    }
  }

  // 4. Buscar @ mentions genericos en la bio (baja confianza)
  const atMentions = bio.match(/@([a-zA-Z0-9._]{3,30})/g);
  if (atMentions && atMentions.length > 0) {
    // Filtrar mentions que parecen de TikTok o no relevantes
    const filteredMentions = atMentions
      .map((m) => m.replace("@", ""))
      .filter((m) => isValidInstagramHandle(m))
      .filter((m) => !m.toLowerCase().includes("tiktok"));

    if (filteredMentions.length === 1) {
      return {
        handle: filteredMentions[0],
        source: "bio_text",
        confidence: "low",
      };
    }
  }

  return { handle: null, source: "not_found", confidence: "low" };
}

/** Extrae un handle de Instagram de una URL de instagram.com */
function extractFromInstagramUrl(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]{1,30})\/?(?:\?.*)?$/i,
    /(?:https?:\/\/)?(?:www\.)?instagr\.am\/([a-zA-Z0-9._]{1,30})\/?/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      const handle = cleanHandle(match[1]);
      if (handle && isValidInstagramHandle(handle)) {
        return handle;
      }
    }
  }

  return null;
}

/** Limpia un handle de caracteres no deseados */
function cleanHandle(handle: string): string {
  return handle
    .replace(/^@/, "")
    .replace(/[,;!?)\]}>]+$/, "")
    .trim();
}

/** Valida que un string parece un handle valido de Instagram */
function isValidInstagramHandle(handle: string): boolean {
  if (!handle || handle.length < 1 || handle.length > 30) return false;

  // Instagram handles: letras, numeros, puntos, guiones bajos
  if (!/^[a-zA-Z0-9._]+$/.test(handle)) return false;

  // Excluir palabras comunes que no son handles
  const excluded = [
    "gmail", "email", "com", "net", "org", "www",
    "http", "https", "the", "and", "for", "you",
    "link", "bio", "here", "click",
  ];

  return !excluded.includes(handle.toLowerCase());
}
