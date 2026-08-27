import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
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
    </html>
  );
}
