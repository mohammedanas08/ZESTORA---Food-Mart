'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, Check, Flame } from 'lucide-react';
import { MenuItem, MenuVariant, MenuAddon, CartItem } from '@/types';
import { useCart } from '@/lib/cartContext';

interface FoodCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  restaurantName?: string;
}

export default function FoodCustomizationModal({
  isOpen,
  onClose,
  item,
  restaurantName,
}: FoodCustomizationModalProps) {
  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | null>(
    item?.variants && item.variants.length > 0 ? item.variants[0] : null
  );
  const [selectedAddons, setSelectedAddons] = useState<MenuAddon[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [instructions, setInstructions] = useState<string>('');

  if (!isOpen || !item) return null;

  // Toggle addon
  const handleAddonToggle = (addon: MenuAddon) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Base price calculation
  const basePrice = selectedVariant ? selectedVariant.price : item.price;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalItemPrice = (basePrice + addonsTotal) * quantity;

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      id: `${item.id}-${selectedVariant ? selectedVariant.name : 'standard'}`,
      type: 'FOOD',
      menuItemId: item.id,
      name: item.name,
      restaurantId: item.restaurantId,
      restaurantName: restaurantName || 'Spice Garden',
      unitPrice: basePrice,
      quantity,
      selectedVariant: selectedVariant || undefined,
      selectedAddons: selectedAddons.length > 0 ? selectedAddons : undefined,
      instructions: instructions.trim() || undefined,
      image: item.image,
      isVeg: item.isVeg,
    };

    addItem(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header with image */}
        <div className="relative h-44 w-full bg-slate-100 flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                  item.isVeg ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-white' : 'bg-white'}`}
                />
                {item.isVeg ? 'Pure Veg' : 'Non-Veg'}
              </span>
              {item.spiceLevel && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/80 text-white flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {item.spiceLevel}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold leading-tight">{item.name}</h3>
            <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{item.description}</p>
          </div>
        </div>

        {/* Scrollable Customization Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Variants / Size */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Choose Portion / Size
                </h4>
                <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded-full">
                  Required
                </span>
              </div>
              <div className="space-y-2">
                {item.variants.map((v) => {
                  const isChecked = selectedVariant?.id === v.id;
                  return (
                    <label
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                          : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isChecked ? 'border-brand-500 bg-brand-500' : 'border-slate-300'
                          }`}
                        >
                          {isChecked && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="font-semibold text-sm text-slate-800">{v.name}</span>
                      </div>
                      <span className="font-bold text-sm text-slate-900">₹{v.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.addons && item.addons.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Extra Toppings & Addons
                </h4>
                <span className="text-xs text-slate-400 font-medium">Optional</span>
              </div>
              <div className="space-y-2">
                {item.addons.map((a) => {
                  const isChecked = selectedAddons.some((sel) => sel.id === a.id);
                  return (
                    <label
                      key={a.id}
                      onClick={() => handleAddonToggle(a)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                          : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                            isChecked ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-medium text-sm text-slate-800">{a.name}</span>
                      </div>
                      <span className="font-semibold text-sm text-brand-600">+₹{a.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cooking Instructions */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
              Special Cooking Instructions
            </h4>
            <input
              type="text"
              placeholder="e.g. Less spicy, extra onions, no coriander..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Footer with Quantity & Add to Cart button */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-3 py-1.5 shadow-sm">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-7 h-7 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-sm text-slate-900 w-4 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-7 h-7 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm flex items-center justify-between shadow-elevated transition-transform active:scale-95"
          >
            <span>Add Item</span>
            <span>₹{totalItemPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
