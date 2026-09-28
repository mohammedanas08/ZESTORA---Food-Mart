import React from 'react';
import Link from 'next/link';
import { Sparkles, Heart, ShieldCheck, Clock, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-slate-800 text-slate-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Superfast 10–30m Delivery</div>
              <div className="text-xs text-slate-400">Hot meals & groceries straight to your door</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">100% Quality & Hygiene</div>
              <div className="text-xs text-slate-400">FSSAI verified kitchens & tamper-proof bags</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Real-Time GPS Tracking</div>
              <div className="text-xs text-slate-400">Live rider movement and accurate ETAs</div>
            </div>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Zestora<span className="text-brand-500">.</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zestora is an original unified food delivery and quick-commerce platform serving authentic culinary flavors and daily essentials in minutes.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Food & Cuisines
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/restaurants?q=Biryani" className="hover:text-white transition">Authentic Bhatkali Biryani</Link></li>
              <li><Link href="/restaurants?q=Coastal" className="hover:text-white transition">Coastal Seafood & Tawa Fry</Link></li>
              <li><Link href="/restaurants?q=Pizza" className="hover:text-white transition">Artisan Wood-Fired Pizza</Link></li>
              <li><Link href="/restaurants?q=Burgers" className="hover:text-white transition">Smash Burgers & Shakes</Link></li>
              <li><Link href="/restaurants?q=Chinese" className="hover:text-white transition">Indo-Chinese Sizzlers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Quick Commerce
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/grocery?category=dairy" className="hover:text-white transition">Dairy, Bread & Eggs</Link></li>
              <li><Link href="/grocery?category=fruits" className="hover:text-white transition">Fresh Vegetables & Fruits</Link></li>
              <li><Link href="/grocery?category=snacks" className="hover:text-white transition">Munchies & Potato Chips</Link></li>
              <li><Link href="/grocery?category=beverages" className="hover:text-white transition">Cold Drinks & Juices</Link></li>
              <li><Link href="/grocery?category=staples" className="hover:text-white transition">Cooking Oil & Staples</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Partner Ecosystem
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/restaurant-dashboard" className="text-amber-400 hover:text-amber-300 transition font-semibold">Restaurant Partner Hub</Link></li>
              <li><Link href="/delivery-dashboard" className="text-emerald-400 hover:text-emerald-300 transition font-semibold">Delivery Partner App</Link></li>
              <li><Link href="/admin" className="hover:text-white transition">Platform Admin Center</Link></li>
              <li><Link href="/support" className="hover:text-white transition">24x7 Customer Support</Link></li>
              <li><Link href="/offers" className="hover:text-white transition">Discounts & Promo Coupons</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} Zestora Technologies Inc. All rights reserved. Original architecture & design.
          </div>
          <div className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 mx-1" /> for foodies and fast commerce in Bhatkal & beyond.
          </div>
        </div>
      </div>
    </footer>
  );
}
