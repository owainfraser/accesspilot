import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "AccessPilot — JIT Privileged Access Management",
    template: "%s | AccessPilot",
  },
  description:
    "Just-in-Time Privileged Access Management for Microsoft 365 and Entra ID. Automate access requests, approvals, and time-limited grants with full audit trails.",
  keywords: [
    "JIT PAM",
    "privileged access management",
    "Microsoft 365",
    "Entra ID",
    "access control",
    "zero trust",
    "AutoElevate alternative",
  ],
  openGraph: {
    title: "AccessPilot — JIT Privileged Access Management",
    description:
      "Automate JIT access requests for Microsoft 365 and Entra ID with full audit trails.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorBackground: "#0f172a",
          colorInputBackground: "#1e293b",
          colorInputText: "#f1f5f9",
          colorText: "#f1f5f9",
          colorTextSecondary: "#94a3b8",
          colorPrimary: "#3b82f6",
          colorDanger: "#ef4444",
          borderRadius: "0.5rem",
        },
        elements: {
          card: "bg-gray-900 border border-gray-700 shadow-2xl",
          headerTitle: "text-gray-100",
          headerSubtitle: "text-gray-400",
          socialButtonsBlockButton:
            "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700",
          formFieldInput:
            "bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500",
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
          footerActionLink: "text-blue-400 hover:text-blue-300",
          dividerLine: "bg-gray-700",
          dividerText: "text-gray-500",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className={`${inter.className} min-h-screen bg-gray-950`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
