"use client";

import { useState } from "react";
import { APILoader, AutoComplete } from "@uiw/react-amap";

export type VenueResult = {
  id: string;
  name: string;
  address: string;
  location: string;
};

type VenueSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (venue: VenueResult) => void;
  onClear?: () => void;
  selectedVenue: VenueResult | null;
  placeholder?: string;
  disabled?: boolean;
};

export function VenueSearchInput({
  value,
  onChange,
  onSelect,
  onClear,
  selectedVenue,
  placeholder = "搜索场地（如：卢湾体育馆）",
  disabled = false,
}: VenueSearchInputProps) {
  const [inputEl, setInputEl] = useState<HTMLInputElement | null>(null);

  const amapKey = process.env.NEXT_PUBLIC_AMAP_KEY;

  const handleSelect = (e: { poi: { id: string; name: string; address: string; location?: { lng: number; lat: number } } }) => {
    const p = e.poi;
    onSelect({
      id: p.id,
      name: p.name,
      address: p.address || "",
      location: p.location ? `${p.location.lng},${p.location.lat}` : "121.47,31.23",
    });
  };

  if (!amapKey) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">场地 *</label>
        <input
          ref={(el) => el && setInputEl(el)}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="输入场地名称（需配置 NEXT_PUBLIC_AMAP_KEY 启用搜索）"
          disabled={disabled}
          autoComplete="off"
          className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50"
        />
      </div>
    );
  }

  return (
    <APILoader version="2.0" akey={amapKey}>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700">场地 *</label>
          <input
            ref={setInputEl}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50"
          />
          {inputEl && (
            <AutoComplete
              input={inputEl}
              city="上海"
              onSelect={handleSelect}
            />
          )}
        </div>
        {selectedVenue && onClear && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              清除
            </button>
          </div>
        )}
      </div>
    </APILoader>
  );
}
