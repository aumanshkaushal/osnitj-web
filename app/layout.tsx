import type { Metadata } from "next";
import {
  Instrument_Serif,
  JetBrains_Mono,
  Lora,
  Inter,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import Script from "next/script";
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://opensourcenitj.com"),

  title: {
    default: "OpenSource @ NITJ",
    template: "%s | OpenSource @ NITJ",
  },

  description:
    "Student-led open-source developer community at NIT Jalandhar building impactful projects, organizing events, mentoring contributors, and promoting collaborative software development.",

  keywords: [
    "OpenSource NITJ",
    "NIT Jalandhar",
    "Open Source Club",
    "Student Developer Community",
    "Hackathons",
    "Open Source Projects",
    "NIT Jalandhar open source",
    "NITJ developer community",
    "student open source India",
    "college coding community",
    "Programming Club",
    "Developer Community India",
    "NITJ coding club",
  ],

  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/icon-light-32x32.svg",
        href: "/icon-light-32x32.svg",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/icon-dark-32x32.svg",
        href: "/icon-dark-32x32.svg",
      },
    ],
  },

  authors: [{ name: "OpenSource @ NITJ" }],

  creator: "OpenSource @ NITJ",

  openGraph: {
    title: "OpenSource @ NITJ",
    description:
      "Building impactful open-source projects and empowering student developers at NIT Jalandhar.",
    url: "https://opensourcenitj.com",
    siteName: "OpenSource @ NITJ",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OpenSource @ NITJ",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "OpenSource @ NITJ",
    description: "Student-led open-source community at NIT Jalandhar.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: "https://opensourcenitj.com",
  },

  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSerif.variable} ${jetbrainsMono.variable} ${lora.variable} ${inter.variable} bg-[#F7F7F2] dark:bg-[#121212]`}
    >
      <body className="font-mono antialiased bg-[#F7F7F2] dark:bg-[#121212] text-[#111] dark:text-[#F4F4F0] transition-colors">
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "OpenSource @ NITJ",
              url: "https://opensourcenitj.com",
              logo: "https://opensourcenitj.com/og-image.png",
              sameAs: ["https://github.com/Opensource-NITJ"],
            }),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
