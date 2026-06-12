import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/app/context/store";
import NavigationHeader from "./components/NavigationHeader";
import ToastNotification from "./components/ToastNotification";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Printec Admin Portal",
  description: "Management portal for orders, enquiries, and operations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={hankenGrotesk.variable}>
      <body>
        <AppProvider>
          <NavigationHeader />
          <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {children}
          </main>
          <ToastNotification />
        </AppProvider>
      </body>
    </html>
  );
}
