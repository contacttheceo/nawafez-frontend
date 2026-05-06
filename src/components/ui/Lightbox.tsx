'use client';

import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images:  string[];
  current: number;
  onClose: () => void;
  onChange: (i: number) => void;
}

export default function Lightbox({ images, current, onClose, onChange }: Props) {
  const prev = useCallback(() => onChange((current - 1 + images.length) % images.length), [current, images.length, onChange]);
  const next = useCallback(() => onChange((current + 1) % images.length), [current, images.length, onChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close image viewer"
        className="absolute top-4 end-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
      >
        <X size={22} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 start-1/2 -translate-x-1/2 text-white/60 text-sm">
        {current + 1} / {images.length}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Previous image"
          className="absolute start-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white
                     p-3 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Image */}
      <img
        src={images[current]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl select-none"
        draggable={false}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Next image"
          className="absolute end-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white
                     p-3 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 start-1/2 -translate-x-1/2 flex gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onChange(i); }}
              className={`w-12 h-8 rounded overflow-hidden border-2 transition
                          ${i === current ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
