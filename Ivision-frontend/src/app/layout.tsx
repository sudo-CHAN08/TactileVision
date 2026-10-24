import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "TactileVision",
  description: "Audio-first camera assistance for blind and low-vision users.",
  manifest: "/manifest.webmanifest",
  applicationName: "TactileVision",
  appleWebApp: { capable: true, title: "TactileVision", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" }
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f5f5f7" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}