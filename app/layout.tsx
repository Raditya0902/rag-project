import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DocQuiz",
  description: "Upload a PDF and generate quizzes instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
