import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#060a20",
};

export const metadata: Metadata = {
  title: "BNET54 - Prediction",
  description: "BNET54 - Plateforme de prediction de jeux avancee avec intelligence artificielle",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased" style={{ touchAction: "pan-x pan-y", overscrollBehavior: "none" }}>
        {children}
      </body>
    </html>
  );
}
