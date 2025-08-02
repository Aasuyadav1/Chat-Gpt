import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/global/theme-provider";
import QueryProvider from "@/components/global/query-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChatGPT Clone - Advanced AI Chat Interface",
  description:
    "A powerful, feature-rich ChatGPT clone with advanced AI capabilities and seamless tool integration. Access multiple LLM models with dynamic tool system, pixel-perfect UI, and smart prompt engineering.",
  keywords: [
    "chatgpt clone",
    "AI chat",
    "LLM models",
    "chat interface",
    "AI assistant",
    "openrouter",
    "dynamic tools",
    "multi-model chat",
    "chatgpt",
    "artificial intelligence",
  ],
  authors: [{ name: "ChatGPT Clone" }],
  metadataBase: new URL("https://chat-gpt-clones-phi.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ChatGPT Clone - Advanced AI Chat Interface",
    description:
      "A powerful, feature-rich ChatGPT clone with advanced AI capabilities and seamless tool integration. Access multiple LLM models with dynamic tool system, pixel-perfect UI, and smart prompt engineering.",
    url: "https://chat-gpt-clones-phi.vercel.app",
    siteName: "ChatGPT Clone",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/chat-gpt-bg.png",
        width: 1200,
        height: 630,
        alt: "ChatGPT Clone - Advanced AI Chat Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatGPT Clone - Advanced AI Chat Interface",
    description:
      "A powerful, feature-rich ChatGPT clone with advanced AI capabilities and seamless tool integration. Access multiple LLM models with dynamic tool system, pixel-perfect UI, and smart prompt engineering.",
    creator: "@chatgptclone",
    images: {
      url: "/chat-gpt-bg.png",
      alt: "ChatGPT Clone - Advanced AI Chat Interface",
      width: 1200,
      height: 630,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <QueryProvider>
          <Toaster position="bottom-right" />
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
