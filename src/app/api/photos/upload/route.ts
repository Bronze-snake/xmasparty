import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { currentGuest, isAdmin } from "@/lib/auth";
import { getConfig } from "@/lib/data";

export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  const [g, admin] = await Promise.all([currentGuest(), isAdmin()]);
  const cfg = await getConfig();
  if (!admin && (!g || !cfg.flags.photos)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
        maximumSizeInBytes: 8 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ guestId: g?.id || null, admin }),
      }),
      onUploadCompleted: async () => {
        // The client records the photo via POST /api/photos after upload.
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
