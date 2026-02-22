# SociaVault Artist Finder

Busca perfiles de artistas en TikTok (e Instagram) a partir de una canción usando la API de [SociaVault](https://sociavault.com).

## 🌟 Versión 2.0 - Aplicación Web

Ahora con interfaz web moderna tipo Google + CLI

## Flujo

```
"artista + cancion" ──> Search Keyword ──> TikTok Profile ──> Instagram (bio parse)
                          (1 credito)       (1 credito)          (0 creditos)
```

1. **Search by Keyword**: busca videos en TikTok que coincidan con "artista + nombre cancion"
2. **TikTok Profile**: extrae el handle del artista de la musica del video y obtiene su perfil completo
3. **Instagram Parse**: analiza la bio y el bioLink del perfil para extraer el handle de Instagram

## Instalación

```bash
cd sociavault-artist-finder
npm install
```

## Configuración

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` y pon tu API key de SociaVault:
   ```
   SOCIAVAULT_API_KEY=sk_live_tu_api_key_real
   ```

   Obtener API key: https://sociavault.com/dashboard

## Uso

### 🌐 Aplicación Web (Recomendado)

```bash
# Modo desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador

**Características:**
- ✨ Interfaz moderna estilo Google
- 🔍 Búsqueda en tiempo real
- 📱 Diseño responsive
- 🌓 Soporte dark mode
- 🎨 UI limpia y profesional

### 💻 CLI (Línea de comandos)

```bash
# Ver ayuda
npm run cli

# Buscar artista por canción
npm run cli -- "Kendrick Lamar luther"
npm run cli -- "Bad Bunny Monaco"
npm run cli -- "Rosalia Malamente"

# Artistas noveles
npm run cli -- "nombre_artista nombre_cancion"
```

## Costo en creditos

- **2 creditos** por busqueda (keyword search + profile)
- **3 creditos** si el perfil directo no se encuentra y se usa busqueda de usuarios como fallback

## Estructura del proyecto

```
sociavault-artist-finder/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Página principal con búsqueda
│   └── globals.css          # Estilos globales
├── components/              # Componentes React
│   ├── SearchBar.tsx        # Barra de búsqueda
│   └── ArtistResult.tsx     # Card de resultado
├── lib/                     # Utilidades
│   └── mockData.ts          # Datos de ejemplo
├── types/                   # Tipos TypeScript
│   └── artist.ts            # Tipos de artista
├── src/                     # CLI (código legacy)
│   ├── index.ts             # Script principal (CLI)
│   ├── artist-finder.ts     # Lógica de búsqueda encadenada
│   ├── sociavault-client.ts # Cliente HTTP de la API
│   ├── instagram-parser.ts  # Extracción de Instagram de bios
│   └── types.ts             # Tipos TypeScript
├── .env                     # API key (no se sube a git)
├── .env.example             # Plantilla del .env
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

## API endpoints usados

| Endpoint | Descripcion | Creditos |
|---|---|---|
| `GET /v1/scrape/tiktok/search/keyword` | Buscar videos por keyword | 1 |
| `GET /v1/scrape/tiktok/profile` | Perfil completo de TikTok | 1 |
| `GET /v1/scrape/tiktok/search/users` | Buscar usuarios (fallback) | 1 |
| `GET /v1/scrape/tiktok/music/details` | Detalles de cancion (opcional) | 1 |

Documentacion completa: https://docs.sociavault.com
