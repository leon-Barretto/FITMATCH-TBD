import { NextResponse } from "next/server";
import { searchVideos } from "@/lib/clients/youtube";

export async function POST(request: Request) {
  let body: { query?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ videos: [] });
  }

  const query = String(body?.query ?? "").trim().slice(0, 200);
  const videos = query ? await searchVideos(query, 5) : [];
  return NextResponse.json({ videos });
}
