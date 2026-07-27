import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Later — Tu próxima historia", description: "Guarda películas y series para ver más tarde." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" suppressHydrationWarning><body>{children}</body></html>;
}
