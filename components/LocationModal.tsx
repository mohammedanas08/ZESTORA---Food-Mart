'use client';

import React, { useState } from 'react';
import { MapPin, Check, Search, AlertCircle, X } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { SEED_SERVICE_AREAS } from '@/server/seedData';
import { Address } from '@/types';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const { selectedAddress, setSelectedAddress } = useCart();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredAreas = SEED_SERVICE_AREAS.filter((a) =>
    a.zoneName.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase()) ||
    a.postalCode.includes(search)
  );

  const handleSelectArea = (zone: typeof SEED_SERVICE_AREAS[0]) => {
    const newAddr: Address = {
      ...selectedAddress,
      area: zone.zoneName,
      city: zone.city,
      postalCode: zone.postalCode,
      addressLine1: `${zone.zoneName} Main Road`,
    };
    setSelectedAddress(newAddr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Select Delivery Location</h3>
              <p className="text-xs text-slate-500">Check serviceability across Bhatkal zones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search area, landmark or pincode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              Active Delivery Zones
            </div>
            {filteredAreas.map((zone) => {
              const isSelected = selectedAddress.area === zone.zoneName;
              return (
                <div
                  key={zone.id}
                  onClick={() => handleSelectArea(zone)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${
                        isSelected ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                        {zone.zoneName}
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Serviceable
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {zone.city}, Karnataka • PIN {zone.postalCode}
                      </div>
                      <div className="text-[11px] text-brand-600 font-medium mt-1">
                        Base Delivery: ₹{zone.baseDelivery} • Min order: ₹{zone.minOrder}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {filteredAreas.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-sm">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                Zestora is not available at this location yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
