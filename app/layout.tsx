import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ownit2buildit Admin",
  description: "Platform Administration Portal — ownit2buildit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="h-full">
        <ReduxProvider>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </ReduxProvider>
      </body>
    </html>
  );
}
