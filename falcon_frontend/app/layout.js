import './globals.css';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import { CartProvider } from '../src/contexts/CartContext';
import { WishlistProvider } from '../src/contexts/WishlistContext';
import { SocketProvider } from '../src/contexts/SocketContext';
import Navbar from '../src/components/Navbar';

import Footer from '../src/components/Footer';

export const metadata = {
  title: 'Single Vendor E-Commerce Platform',
  description: 'Premium single-vendor e-commerce web platform with real-time GPS tracking and ZATCA e-invoicing.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <body className="antialiased min-h-screen flex flex-col justify-between">
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
              <CartProvider>
                <WishlistProvider>
                  <SocketProvider>
                    <Navbar />
                    <main className="flex-grow w-full">
                      {children}
                    </main>
                    <Footer />
                  </SocketProvider>
                </WishlistProvider>
              </CartProvider>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

