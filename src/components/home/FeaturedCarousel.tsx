"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, BookOpen } from "lucide-react";

type FeaturedItem = {
  id: string; slug: string; title: string; coverUrl: string | null;
  synopsis: string | null; contentType: string;
};

export function FeaturedCarousel({ items }: { items: FeaturedItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const visible = items.slice(0, 7);
  const count = visible.length;
  const go = useCallback((delta: number) => {
    if (count) setActiveIndex((current) => (current + delta + count) % count);
  }, [count]);

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => go(1), 5500);
    return () => window.clearInterval(timer);
  }, [count, paused, go]);

  if (!count) return null;
  const active = visible[activeIndex] ?? visible[0];
  const half = Math.floor((count - 1) / 2);
  const slots = Array.from({ length: count }, (_, i) => {
    const offset = i - half;
    const index = (activeIndex + offset + count) % count;
    return { item: visible[index], offset, index };
  });

  return (
    <section aria-label="Featured stories" aria-roledescription="carousel"
      className="cv-feature relative -mx-3 overflow-hidden rounded-2xl py-6 sm:mx-0 md:py-8"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => { if (touchX.current === null) return; const dx=e.changedTouches[0].clientX-touchX.current; touchX.current=null; if(Math.abs(dx)>40) go(dx<0?1:-1); }}>
      {active.coverUrl && <img src={active.coverUrl} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-3xl" />}
      <div className="absolute inset-0 bg-gradient-to-b from-[#100e16]/60 via-[#100e16]/75 to-[#100e16]" />
      <div className="relative z-10 mb-5 flex items-center justify-between px-4 sm:px-6">
        <div><span className="home-kicker">YOUR NEXT OBSESSION</span><h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">Featured Stories</h2></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => go(-1)} aria-label="Previous featured story" className="cv-iconbtn"><ChevronLeft size={18}/></button>
          <button type="button" onClick={() => go(1)} aria-label="Next featured story" className="cv-iconbtn"><ChevronRight size={18}/></button>
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-center gap-2 px-2 sm:gap-3 md:gap-4">
        {slots.map(({item,offset,index}) => {
          const distance=Math.abs(offset), center=offset===0;
          const visibility=distance===0?"block":distance===1?"block":distance===2?"hidden md:block":"hidden xl:block";
          return center ? (
            <Link key={item.id} href={`/comics/${item.slug}`} aria-label={`Open ${item.title}`}
              className="group relative block w-40 shrink-0 overflow-hidden rounded-xl border border-white/15 shadow-2xl sm:w-48 md:w-56 lg:w-60">
              <div className="relative aspect-[2/3] bg-[#211b2d]">
                {item.coverUrl ? <img src={item.coverUrl} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/> : <div className="grid h-full place-items-center text-[#c084fc]"><BookOpen size={36}/></div>}
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-1 text-xs font-bold text-white"><Star size={11} className="fill-amber-400 text-amber-400"/>Featured</span>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent px-3 pb-3 pt-12"><h3 className="truncate text-sm font-extrabold text-white sm:text-base">{item.title}</h3><p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-purple-200">{item.contentType}</p></div>
              </div>
            </Link>
          ) : (
            <button key={item.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`Feature ${item.title}`}
              className={`${visibility} w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 opacity-55 transition duration-300 hover:opacity-90 sm:w-36 md:w-40 ${distance>1?"scale-90":"scale-95"}`}>
              <div className="aspect-[2/3] bg-[#211b2d]">{item.coverUrl ? <img src={item.coverUrl} alt="" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center"><BookOpen/></div>}</div>
            </button>
          );
        })}
      </div>
      <div className="relative z-10 mt-5 flex justify-center gap-1.5">{visible.map((item,index)=><button key={item.id} type="button" onClick={()=>setActiveIndex(index)} aria-label={`Show ${item.title}`} className={`h-1.5 rounded-full transition-all ${index===activeIndex?"w-7 bg-purple-400":"w-1.5 bg-white/30"}`}/>)}</div>
    </section>
  );
}
