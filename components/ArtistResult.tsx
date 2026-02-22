"use client";

import type { ArtistResult } from "@/types/artist";

interface ArtistResultProps {
  result: ArtistResult;
}

export default function ArtistResultCard({ result }: ArtistResultProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const hasStreaming =
    result.streaming.spotify ||
    result.streaming.appleMusic ||
    result.streaming.amazonMusic;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      {/* Header: Cancion */}
      <div className="mb-4">
        <div className="flex items-start gap-3">
          {result.song.coverUrl ? (
            <img
              src={result.song.coverUrl}
              alt={result.song.title}
              className="w-14 h-14 rounded-lg flex-shrink-0 object-cover"
            />
          ) : (
            <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-blue-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 truncate">
              {result.song.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {result.song.author}
              {result.song.album && ` \u2022 ${result.song.album}`}
            </p>
            {result.song.usageCount > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                Usada en {formatNumber(result.song.usageCount)} videos de TikTok
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Streaming Links */}
      {hasStreaming && (
        <div className="flex flex-wrap gap-2 mb-4">
          {result.streaming.spotify && (
            <a
              href={result.streaming.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Spotify
            </a>
          )}
          {result.streaming.appleMusic && (
            <a
              href={result.streaming.appleMusic}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 rounded-full text-xs font-medium hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.297.228.56.053 1.122.07 1.684.077.541.003 1.082 0 1.623 0h7.822c.51 0 1.02-.003 1.53-.015.554-.014 1.107-.04 1.654-.112.468-.063.927-.158 1.37-.332 1.395-.55 2.387-1.507 2.997-2.88.213-.48.336-.987.415-1.506.09-.585.12-1.174.127-1.764.004-.32 0-.64 0-.96V7.076c0-.32.002-.641-.004-.962zM11.05 15.06c-.01 1.44-.01 2.878-.014 4.318 0 .396-.047.786-.177 1.164-.195.563-.59.888-1.17.97-.402.057-.81.026-1.2-.075-.553-.142-.942-.487-1.13-1.03-.1-.29-.143-.595-.148-.903-.004-.286.032-.57.102-.848.256-1.025.934-1.63 1.962-1.83.278-.054.564-.072.848-.086.19-.01.38-.015.57-.032.118-.01.168-.064.17-.183l.005-.084V8.606c0-.202.015-.404.048-.603.084-.511.333-.898.818-1.098.266-.11.552-.136.842-.134h.092c.76.01 1.52.02 2.28.04.27.005.54.046.796.147.426.167.694.474.778.92.022.12.032.242.032.364 0 .226-.004.452-.01.678-.016.62-.044 1.24-.098 1.858-.022.25-.088.494-.21.72-.202.374-.52.58-.93.638-.252.036-.508.03-.762.014-.402-.027-.804-.06-1.206-.12-.27-.04-.535-.1-.757-.26-.21-.154-.305-.37-.325-.62-.01-.13-.006-.263-.006-.395V8.87c0-.09-.032-.13-.124-.14-.086-.01-.172-.02-.258-.024-.2-.012-.4-.028-.599-.02-.298.01-.446.155-.476.45-.005.05-.005.1-.005.148v5.776z" />
              </svg>
              Apple Music
            </a>
          )}
          {result.streaming.amazonMusic && (
            <a
              href={result.streaming.amazonMusic}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.045 18.02c.072-.116.187-.124.348-.022 2.344 1.439 4.867 2.155 7.57 2.155 1.864 0 3.724-.364 5.58-1.093a16.854 16.854 0 003.616-2.082.39.39 0 01.462-.012.296.296 0 01.096.39c-.174.384-.462.61-.864.678a24.448 24.448 0 01-8.904 1.98c-2.836.006-5.52-.66-8.052-1.998-.084-.048-.126-.108-.126-.18l.274-.816zM22.417 16.644c-.048-.096-.168-.156-.36-.18-1.2-.156-2.244-.06-3.132.288a8.26 8.26 0 00-.324.138c-.132.06-.192.144-.18.252.012.096.078.144.198.144h.15c1.02-.216 1.86-.252 2.52-.108.132.024.192.084.18.18l-.012.06a7.032 7.032 0 01-1.08 2.04c-.072.096-.048.18.072.252.048.024.096.036.144.036.072 0 .132-.036.18-.108.576-.828.936-1.728 1.08-2.7.012-.072.012-.12 0-.144l-.012-.06c.072-.072.12-.144.144-.216l.432.024z" />
              </svg>
              Amazon Music
            </a>
          )}
        </div>
      )}

      {/* Perfil TikTok */}
      <div className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-gray-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.12v-3.5a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.4a6.34 6.34 0 006.33 6.33 6.34 6.34 0 006.34-6.33V8.72a8.27 8.27 0 004.85 1.56V6.84a4.87 4.87 0 01-1.08-.15z" />
          </svg>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">TikTok</span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          {result.tiktok.avatarUrl && (
            <img
              src={result.tiktok.avatarUrl}
              alt={result.tiktok.nickname}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <a
                href={`https://tiktok.com/@${result.tiktok.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-gray-900 dark:text-gray-100 hover:underline truncate"
              >
                {result.tiktok.nickname}
              </a>
              {result.tiktok.verified && (
                <svg
                  className="w-5 h-5 text-blue-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{result.tiktok.handle}
            </p>
          </div>
        </div>

        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>
            <strong className="text-gray-900 dark:text-gray-100">
              {formatNumber(result.tiktok.followers)}
            </strong>{" "}
            seguidores
          </span>
          <span>
            <strong className="text-gray-900 dark:text-gray-100">
              {formatNumber(result.tiktok.likes)}
            </strong>{" "}
            likes
          </span>
          <span>
            <strong className="text-gray-900 dark:text-gray-100">
              {result.tiktok.videoCount}
            </strong>{" "}
            videos
          </span>
        </div>

        {result.tiktok.bio && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
            {result.tiktok.bio}
          </p>
        )}

        {result.tiktok.bioLink && (
          <a
            href={result.tiktok.bioLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            {result.tiktok.bioLink.replace(/^https?:\/\//, "").slice(0, 50)}
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>

      {/* Instagram */}
      <div className="border-l-4 border-pink-200 dark:border-pink-900 pl-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
          </svg>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Instagram</span>
        </div>

        {result.instagram.handle ? (
          <div>
            <div className="flex items-center gap-3 mb-1">
              {result.instagram.profilePicUrl && (
                <img
                  src={result.instagram.profilePicUrl}
                  alt={result.instagram.handle}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://instagram.com/${result.instagram.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    @{result.instagram.handle}
                  </a>
                  {result.instagram.verified && (
                    <svg
                      className="w-4 h-4 text-blue-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                  {result.instagram.source === "api_verified" && (
                    <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                      Verificado
                    </span>
                  )}
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  {result.instagram.followers !== null && (
                    <span>
                      <strong className="text-gray-700 dark:text-gray-300">
                        {formatNumber(result.instagram.followers)}
                      </strong>{" "}
                      seguidores
                    </span>
                  )}
                  {result.instagram.isBusinessAccount && (
                    <span className="text-purple-600 dark:text-purple-400">Cuenta profesional</span>
                  )}
                </div>
              </div>
            </div>
            {result.instagram.biography && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 ml-13">
                {result.instagram.biography}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-500">
            No encontrado en el perfil
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-400">
          Powered by Apify
        </p>
      </div>
    </div>
  );
}
