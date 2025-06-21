// frontend/src/app/layout.tsx
// ==============================================================================
// This is the root layout for the entire application.
// ==============================================================================
import type { Metadata } from "next";
import ThemeRegistry from "@/components/ThemeRegistry";

export const metadata: Metadata = {
  title: "SPIEGEL RAG System",
  description: "Analyse und Durchsuchung des Spiegel-Archivs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
