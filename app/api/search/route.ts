import { NextRequest, NextResponse } from "next/server";
import { ArtistFinder } from "@/src/artist-finder";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const apifyToken = process.env.APIFY_API_TOKEN;
    const sociavaultKey = process.env.SOCIAVAULT_API_KEY;

    if (!apifyToken) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN no configurado en .env" },
        { status: 500 }
      );
    }

    if (!sociavaultKey) {
      return NextResponse.json(
        { error: "SOCIAVAULT_API_KEY no configurado en .env" },
        { status: 500 }
      );
    }

    const finder = new ArtistFinder(apifyToken, sociavaultKey);
    const results = await finder.findMultipleArtistsBySong(query, limit);

    if (results.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron resultados" },
        { status: 404 }
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error en búsqueda:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
