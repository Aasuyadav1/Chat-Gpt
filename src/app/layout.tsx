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
  title: "ChatGPT Clone - AI-Powered Conversational Assistant",
  description: "A powerful ChatGPT clone featuring advanced AI capabilities including image generation, web search, vision models, code generation, and thread management. Experience the future of AI conversation.",
  keywords: ["ChatGPT", "AI", "artificial intelligence", "chat bot", "conversation", "image generation", "web search", "code generation"],
  authors: [{ name: "Aasu Yadav" }],
  creator: "Aasu Yadav",
  publisher: "Aasu Yadav",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://chat-gpt-clones-phi.vercel.app/",
    title: "ChatGPT Clone - AI-Powered Conversational Assistant",
    description: "A powerful ChatGPT clone featuring advanced AI capabilities including image generation, web search, vision models, code generation, and thread management.",
    siteName: "ChatGPT Clone",
    images: [
      {
        url: "/chat-gpt-bg.png",
        width: 1200,
        height: 630,
        alt: "ChatGPT Clone - AI-Powered Conversational Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatGPT Clone - AI-Powered Conversational Assistant",
    description: "A powerful ChatGPT clone featuring advanced AI capabilities including image generation, web search, vision models, code generation, and thread management.",
    images: ["/chat-gpt-bg.png"],
    creator: "@aasuyadavv",
  },
  metadataBase: new URL("https://chat-gpt-clones-phi.vercel.app/"),
  alternates: {
    canonical: "/",
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
