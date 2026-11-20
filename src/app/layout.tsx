import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ClinicFlow", template: "%s | ClinicFlow" },
  description: "Ambiente demonstrativo de gestão administrativa para clínicas.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
