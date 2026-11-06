"use client"

import { Card } from "@/components/ui/card"

export function HeroBanner() {
  return (
    <Card 
      className="relative overflow-hidden rounded-[2rem] border-none shadow-lg w-full"
      style={{ backgroundImage: 'linear-gradient(145deg, #002576 0%, #0038a8 60%, #003ec5 100%)' }}
    >
      {/* Subtle Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      />
      
      <div className="relative z-10 p-6 md:p-10 flex flex-col justify-end">
        <div className="inline-flex items-center bg-[#feb71a] text-[#1a1200] px-3 py-1 text-[9px] font-black tracking-[0.15em] uppercase w-fit mb-6 rounded-full shadow-sm font-sans">
          {new Date().toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase()}
        </div>
        <h2 className="font-sans text-3xl md:text-5xl lg:text-5xl font-bold leading-tight tracking-tight text-white mb-4">
          Ligtas ang Barangay, Ligtas ang Lahat.
        </h2>
        <p className="font-sans text-white/75 max-w-2xl text-sm md:text-[15px] leading-relaxed tracking-wide font-medium">
          Nagbibigay-linaw at patas na pananaw sa bawat reklamo na inihaharap sa barangay. Kasalukuyang mataas ang resolusyon ngayong buwan, magpatuloy sa mabilis na pag-aksyon.
        </p>
      </div>
    </Card>
  )
}
