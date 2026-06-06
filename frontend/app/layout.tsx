import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/contexts/language-context"
import { AuthProvider } from "@/contexts/auth-context"
import { ChatWidget } from "@/components/chatbot/chat-widget"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "PayPredict - AI-Powered Credit Risk Intelligence",
  description: "Advanced predictive analytics for credit risk assessment, featuring institutional-grade AI models, secure JWT sessions, and real-time portfolio intelligence.",
  generator: "PayPredict",
}
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#06201c" }], width: "device-width", initialScale: 1 }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen font-sans antialiased transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <ChatWidget />
              <Toaster richColors position="top-right" />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
