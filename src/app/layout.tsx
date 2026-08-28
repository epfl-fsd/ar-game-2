import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AR EPFL",
  description: "Lance le logo de l'EPFL",
  icons: {
    icon: [{ url: "/epfl-logo.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#c8002a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${poppins.variable} h-full`}>
      <body className="h-dvh w-dvw overflow-hidden antialiased">
        {children}
      </body>
      <Script
        src="https://umami.fsd.epfl.ch/script.js"
        data-website-id="2acf40b7-8b27-4426-bae5-16ece05b6dab"
        strategy="afterInteractive"
      />
    </html>
  );
}
