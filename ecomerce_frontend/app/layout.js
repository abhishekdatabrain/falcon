import './globals.css';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { CartProvider } from '../src/contexts/CartContext';
import { WishlistProvider } from '../src/contexts/WishlistContext';
import { SocketProvider } from '../src/contexts/SocketContext';
import Navbar from '../src/components/Navbar';

import Footer from '../src/components/Footer';

export const metadata = {
  title: 'Aura Commerce - Single Vendor E-Commerce Platform',
  description: 'Premium single-vendor e-commerce web platform with real-time GPS tracking and ZATCA e-invoicing.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <body className="antialiased min-h-screen flex flex-col justify-between">
        <LanguageProvider>
          <AuthProvider>
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
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
