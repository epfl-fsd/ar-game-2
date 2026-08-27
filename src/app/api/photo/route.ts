import { NextResponse } from "next/server";
import { sendPhotoEmail } from "@/services/mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = body?.email;
  const photo = body?.photo;

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (typeof photo !== "string" || !photo.startsWith("data:image/")) {
    return NextResponse.json({ error: "Invalid photo" }, { status: 400 });
  }

  try {
    await sendPhotoEmail(email, photo);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send photo email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
