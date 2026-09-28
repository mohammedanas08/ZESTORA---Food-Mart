import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cartContext';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Zestora — Modern Food Delivery & 10-Minute Quick Commerce',
  description:
    'Discover delicious local dishes, authentic cuisines, and instant grocery delivery in Bhatkal. Hot food, fresh groceries, and fast door delivery with Zestora.',
  keywords: [
    'Zestora',
    'Food Delivery',
    'Quick Commerce',
    'Bhatkal Food',
    'Biryani Delivery',
    'Online Groceries',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased bg-[#FAFAF9] text-slate-900 selection:bg-brand-500 selection:text-white">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <CartDrawer />
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
