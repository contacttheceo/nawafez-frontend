'use client';

import { useRef, useState } from 'react';
import { Upload, X, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  images:     File[];
  previews:   string[];
  onAdd:      (files: File[]) => void;
  onRemove:   (index: number) => void;
  onReorder:  (from: number, to: number) => void;
  isRTL:      boolean;
  maxImages?: number;
}

export default function ImageUploader({
  images, previews, onAdd, onRemove, onReorder, isRTL, maxImages = 8,
}: Props) {
  const inputRef         = useRef<HTMLInputElement>(null);
  const [draggingOver, setDraggingOver]   = useState(false);
  const [draggingIdx,  setDraggingIdx]    = useState<number | null>(null);
  const [dragOverIdx,  setDragOverIdx]    = useState<number | null>(null);

  const remaining = maxImages - images.length;

  /* ── File validation & add ─────────────────────────────────────── */
  const processFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const valid = arr.filter((f) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        toast.error(isRTL ? `${f.name}: صيغة غير مدعومة` : `${f.name}: unsupported format`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(isRTL ? `${f.name}: يتجاوز 5MB` : `${f.name}: exceeds 5MB`);
        return false;
      }
      return true;
    });

    if (images.length + valid.length > maxImages) {
      toast.error(isRTL ? `الحد الأقصى ${maxImages} صور` : `Max ${maxImages} images`);
      return;
    }
    onAdd(valid);
  };

  /* ── Drop zone ─────────────────────────────────────────────────── */
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(false);
    processFiles(e.dataTransfer.files);
  };

  /* ── Image reorder via drag ────────────────────────────────────── */
  const onImageDragStart = (idx: number) => setDraggingIdx(idx);
  const onImageDragEnter = (idx: number) => setDragOverIdx(idx);
  const onImageDrop      = (e: React.DragEvent, idx: number) => {
    e.stopPropagation();
    if (draggingIdx !== null && draggingIdx !== idx) onReorder(draggingIdx, idx);
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-4">
      {/* Previews grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {previews.map((src, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => onImageDragStart(i)}
              onDragEnter={() => onImageDragEnter(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onImageDrop(e, i)}
              onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null); }}
              className={`relative aspect-square rounded-xl overflow-hidden bg-gray-100
                          border-2 transition-all cursor-grab active:cursor-grabbing
                          ${dragOverIdx === i && draggingIdx !== i ? 'border-emerald scale-105' : 'border-transparent'}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />

              {/* Main badge */}
              {i === 0 && (
                <span className="absolute top-1 start-1 bg-emerald text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                  {isRTL ? 'رئيسية' : 'Main'}
                </span>
              )}

              {/* Drag handle */}
              <div className="absolute bottom-1 start-1 text-white/70">
                <GripVertical size={14} />
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 end-1 bg-red-500 text-white rounded-full
                           w-5 h-5 flex items-center justify-center hover:bg-red-600 transition"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {remaining > 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
          onDragLeave={() => setDraggingOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center gap-3 border-2 border-dashed rounded-xl p-8
                      cursor-pointer transition-all
                      ${draggingOver
                        ? 'border-emerald bg-emerald/5 scale-[1.01]'
                        : 'border-gray-300 hover:border-emerald/60 hover:bg-gray-50'}`}
        >
          <Upload className={`w-10 h-10 transition-colors ${draggingOver ? 'text-emerald' : 'text-gray-300'}`} />
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600">
              {isRTL ? 'اسحب الصور هنا أو انقر للاختيار' : 'Drag images here or click to select'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isRTL
                ? `JPG, PNG, WebP — 5MB كحد أقصى — متبقٍ ${remaining} من ${maxImages}`
                : `JPG, PNG, WebP — 5MB max — ${remaining} of ${maxImages} remaining`}
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => { processFiles(e.target.files); e.target.value = ''; }}
            className="hidden"
          />
        </div>
      )}

      {remaining === 0 && (
        <p className="text-xs text-center text-gray-400">
          {isRTL ? `وصلت للحد الأقصى (${maxImages} صور)` : `Maximum reached (${maxImages} images)`}
        </p>
      )}
    </div>
  );
}
