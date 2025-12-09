import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { Toaster } from "sonner"; // <--- IMPORT THIS
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });

export const metadata: Metadata = {
  title: "Spndl",
  description: "Weave your passions into projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${lora.variable} bg-background-dark font-display text-white antialiased`}>
        {children}
        <Toaster position="top-center" richColors /> {/* <--- ADD THIS */}
      </body>
    </html>
  );
}