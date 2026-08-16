import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/context/AppContext";
import PwaRegistration from "@/components/pwa-registration";



export const metadata: Metadata = {
  title: "Hirevix Careers",
  applicationName: "Hirevix Careers",
  description: "Find your next career opportunity with Hirevix.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/hirevix-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/hirevix-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/hirevix-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Hirevix",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>

        <PwaRegistration />

        <AppProvider>
           <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NavBar />
            {children}
          </ThemeProvider>








          
        </AppProvider>
        
      </body>
    </html>
  );
}
