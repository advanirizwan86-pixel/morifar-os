import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { getSession } from "@/features/auth/session";
import "./phase2.css";
import "./modules.css";
import "./ai-command-center.css";
import "./workflow-engine.css";
import "./workflow-engine-filters.css";
import "./business-operations.css";

export const metadata: Metadata = {
  title: "Morifar One",
  description: "Executive business expansion command center",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();
  return (
    <html lang="en">
      <body style={{ "--font-sans": "Inter, Segoe UI, Arial, sans-serif", "--font-display": "Iowan Old Style, Palatino Linotype, Georgia, serif" } as React.CSSProperties}>
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
