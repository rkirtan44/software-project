import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/lib/language-context";

export const metadata: Metadata = {
  title: "Scholarship Portal",
  description: "Apply for scholarships and find funding opportunities",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
