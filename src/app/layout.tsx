import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GADAP Hub | Plataforma Central de Gestão & Emissor Fiscal Multiempresas",
  description: "Sistema Multi-Tenant ERP corporativo de alta performance, cadastros base e emissor fiscal provider-agnostic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
