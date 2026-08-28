import QRCode from "qrcode";
import {
  PHOTO_BORDER_RATIO,
  PHOTO_BOTTOM_BAR_RATIO,
  PHOTO_URL,
} from "@/constants/scene";

const EPFL_LOGO_URL = "/epfl-logo.svg";
const EPFL_LOGO_ASPECT = 182.4 / 53;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

// Neither the QR target nor the logo ever change, so both are loaded once
// and reused for every photo instead of redoing the work on each capture.
let qrImagePromise: Promise<HTMLImageElement> | null = null;
let logoImagePromise: Promise<HTMLImageElement> | null = null;

function loadQrImage(): Promise<HTMLImageElement> {
  if (!qrImagePromise) {
    qrImagePromise = QRCode.toDataURL(PHOTO_URL, {
      margin: 0,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(loadImage);
  }
  return qrImagePromise;
}

function loadLogoImage(): Promise<HTMLImageElement> {
  if (!logoImagePromise) logoImagePromise = loadImage(EPFL_LOGO_URL);
  return logoImagePromise;
}

/**
 * Adds a white Polaroid-style border around a captured photo, with the EPFL
 * wordmark and a QR code linking to it in a bottom bar. Returns a PNG data
 * URL sized larger than the source to fit the frame.
 */
export async function addPhotoFrame(
  source: HTMLCanvasElement,
): Promise<string> {
  const [qrImage, logoImage] = await Promise.all([
    loadQrImage(),
    loadLogoImage(),
  ]);

  const { width, height } = source;
  const border = Math.round(width * PHOTO_BORDER_RATIO);
  const bottomBar = Math.round(width * PHOTO_BOTTOM_BAR_RATIO);

  const framed = document.createElement("canvas");
  framed.width = width;
  framed.height = height + bottomBar;
  const ctx = framed.getContext("2d");
  if (!ctx) return source.toDataURL("image/png");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, framed.width, framed.height);
  ctx.drawImage(source, 0, 0, width, height);

  const barCenterY = height + bottomBar / 2;

  // Logo and QR share one height, each padded a bit inward from its side of
  // the bar (border for the logo, border + separator for the QR).
  const iconHeight = bottomBar * 0.7;
  const logoHeight = iconHeight * 0.8;

  // QR code, padded in from the right border.
  const qrSize = iconHeight;
  const qrX = framed.width - border - qrSize;
  ctx.drawImage(qrImage, qrX, barCenterY - qrSize / 2, qrSize, qrSize);

  // EPFL wordmark, left-padded from the border.
  const logoWidth = iconHeight * EPFL_LOGO_ASPECT;
  const logoX = border - logoHeight / 1.5;
  ctx.drawImage(
    logoImage,
    logoX,
    barCenterY - logoHeight / 2,
    logoWidth,
    logoHeight,
  );

  // Event name, to the right of the logo, vertically centered with it.
  ctx.fillStyle = "#1a1a1a";
  ctx.font = `${Math.round(iconHeight * 0.32)}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "Swiss Coding Club Meet Up",
    logoX + logoWidth + logoHeight * 0.4,
    barCenterY,
  );

  // Photo URL, right-aligned before the QR code, vertically centered with it.
  ctx.textAlign = "right";
  ctx.fillText(PHOTO_URL, qrX - logoHeight * 0.4, barCenterY);

  return framed.toDataURL("image/png");
}
