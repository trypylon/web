import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Pylon - Visual AI Workflow Builder",
    template: "%s | Pylon",
  },
  description:
    "Build and orchestrate powerful AI workflows visually. Connect language models, vector stores, and memory systems in a drag-and-drop interface.",
  keywords: [
    "AI workflow",
    "visual programming",
    "AI orchestration",
    "LangChain",
    "GPT-4",
    "gpt-4o-mini",
    "Claude",
    "workflow automation",
    "no-code AI",
    "AI pipeline",
    "machine learning workflow",
  ],
  authors: [{ name: "Pylon Team" }],
  creator: "Pylon",
  publisher: "Pylon",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://usepylon.com",
    title: "Pylon - Visual AI Workflow Builder",
    description:
      "Build and orchestrate powerful AI workflows visually. Connect language models, vector stores, and memory systems in a drag-and-drop interface.",
    siteName: "Pylon",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pylon - Visual AI Workflow Builder",
    description:
      "Build and orchestrate powerful AI workflows visually. Connect language models, vector stores, and memory systems in a drag-and-drop interface.",
    creator: "@usepylon",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
