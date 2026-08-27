import nodemailer from "nodemailer";

const MAIL_HOST = process.env.MAIL_HOST ?? "mail.epfl.ch";
const MAIL_PORT = Number(process.env.MAIL_PORT ?? 25);
const MAIL_FROM = process.env.MAIL_FROM ?? "noreply@epfl.ch";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: MAIL_PORT,
      secure: false,
    });
  }
  return transporter;
}

/** Emails a captured AR photo (data URL) to the given address. */
export async function sendPhotoEmail(to: string, photoDataUrl: string) {
  const base64 = photoDataUrl.split(",")[1] ?? "";
  await getTransporter().sendMail({
    from: MAIL_FROM,
    to,
    subject: "Your AR EPFL photo",
    text: "Here's your photo from AR EPFL!",
    attachments: [
      {
        filename: "ar-epfl.png",
        content: base64,
        encoding: "base64",
      },
    ],
  });
}
