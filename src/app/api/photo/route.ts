import { NextResponse } from "next/server";
import { sendPhotoEmail } from "@/services/mail";
import { getClientIp, isRateLimited } from "@/services/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Framed photos are PNG data URLs a few MB at most; this caps well above
// that while still blocking oversized payloads sent to exhaust memory.
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json(
      { error: "Unsupported content type" },
      { status: 415 },
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  const email = body?.email;
  const photo = body?.photo;

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (typeof photo !== "string" || !photo.startsWith("data:image/")) {
    return NextResponse.json({ error: "Invalid photo" }, { status: 400 });
  }
  if (photo.length > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    await sendPhotoEmail(email, photo);
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to send photo email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
