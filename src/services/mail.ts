import nodemailer from "nodemailer";

const MAIL_HOST = process.env.MAIL_HOST ?? "mail.epfl.ch";
const MAIL_PORT = Number(process.env.MAIL_PORT ?? 25);
const MAIL_USERNAME = process.env.MAIL_USERNAME ?? "noreply";
const MAIL_PASSWORD = process.env.MAIL_PASSWORD ?? "";
const MAIL_FROM = process.env.MAIL_FROM ?? `"${MAIL_USERNAME}@epfl.ch"`;
const MAIL_CC = process.env.MAIL_CC ?? "";
const MAIL_BCC = process.env.MAIL_BCC ?? "";
const MAIL_REPLYTO = process.env.MAIL_REPLYTO ?? "";

const APP_URL = process.env.APP_URL ?? "https://ar.fsd.epfl.ch";

const EVENT_URL =
  "https://www.epfl.ch/education/education-and-science-outreach/fr/jeunepublic/coding-club/swiss-coding-club-meet-up/";
const APPRENTISSAGE_URL = "https://apprentissage.epfl.ch";

const SUBJECT = "Photo – Swiss Coding Club Meet Up";

const TEXT_BODY = `Photo – Swiss Coding Club Meet Up

Bonjour,

Merci d'avoir participé à l'activité proposée sur le stand de la Formation Apprenti·e·s de l'EPFL lors du Swiss Coding Club Meet Up (${EVENT_URL}).

Vous trouverez en pièce jointe la photo prise durant l'animation. Si vous souhaitez refaire l'expérience depuis chez vous, vous pouvez y accéder ici : ${APP_URL}.

Cette application a été créée par un apprenti informaticien en développement d'applications.

Pour en savoir plus sur les apprentissages à l'EPFL, les différentes formations proposées et la possibilité de demander un stage, rendez-vous sur le site de la Formation Apprenti·e·s : ${APPRENTISSAGE_URL}.

Nous espérons que cette activité vous a plu et vous souhaitons beaucoup de plaisir dans la suite de vos découvertes numériques.

Meilleures salutations,
L'équipe de la Formation Apprenti·e·s
${APPRENTISSAGE_URL}`;

const HTML_BODY = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:32px 32px 16px 32px;">
                <img src="${APP_URL}/epfl-logo.svg" alt="EPFL" width="130" height="38" style="display:block;" />
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;font-size:15px;line-height:1.6;">
                <h1 style="font-size:20px;margin:0 0 20px 0;color:#1a1a1a;">Photo - Swiss Coding Club Meet Up</h1>
                <p style="margin:0 0 16px 0;">Bonjour,</p>
                <p style="margin:0 0 16px 0;">Merci d’avoir participé à l’activité proposée sur le stand de la Formation Apprenti·e·s de l’EPFL lors du <a href="${EVENT_URL}" style="color:#c8002a;">Swiss Coding Club Meet Up</a>.</p>
                <p style="margin:0 0 16px 0;">Vous trouverez en pièce jointe la photo prise durant l’animation. Si vous souhaitez refaire l’expérience depuis chez vous, vous pouvez y accéder ici&nbsp;: <a href="${APP_URL}" style="color:#c8002a;">${APP_URL}</a>.</p>
                <p style="margin:0 0 16px 0;">Cette application a été créée par un apprenti informaticien en développement d’applications.</p>
                <p style="margin:0 0 16px 0;">Pour en savoir plus sur les apprentissages à l’EPFL, les différentes formations proposées et la possibilité de demander un stage, rendez-vous sur le site de la Formation Apprenti·e·s&nbsp;: <a href="${APPRENTISSAGE_URL}" style="color:#c8002a;">${APPRENTISSAGE_URL}</a>.</p>
                <p style="margin:0 0 16px 0;">Nous espérons que cette activité vous a plu et vous souhaitons beaucoup de plaisir dans la suite de vos découvertes numériques.</p>
                <p style="margin:0;">Meilleures salutations,<br />L’équipe de la Formation Apprenti·e·s<br /><a href="${APPRENTISSAGE_URL}" style="color:#c8002a;">${APPRENTISSAGE_URL}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: MAIL_PORT,
      secure: false,
      auth: { user: MAIL_USERNAME, pass: MAIL_PASSWORD },
      requireTLS: true,
      // logger: true,
      // debug: true,
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
    cc: MAIL_CC,
    bcc: MAIL_BCC,
    replyTo: MAIL_REPLYTO,
    subject: SUBJECT,
    text: TEXT_BODY,
    html: HTML_BODY,
    attachments: [
      {
        filename: "ar-epfl.png",
        content: base64,
        encoding: "base64",
      },
    ],
  });
}
