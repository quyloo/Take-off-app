import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Take-off App",
  description: "Residential renovation project management — floor plans, renderings, estimates, proposals",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
