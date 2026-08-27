import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AR EPFL",
  description: "Throw the EPFL logo",
  icons: {
    icon: [{ url: "https://epfl-si.github.io/elements/svg/epfl-logo.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#c8002a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="h-dvh w-dvw overflow-hidden antialiased">
        {children}
      </body>
    </html>
  );
}
