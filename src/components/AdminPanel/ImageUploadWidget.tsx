import React, { useRef, useState } from 'react';
import { uploadImage, deleteMediaFile } from '../../api.ts';
import { Upload, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw, Link as LinkIcon, Trash2, FileText } from 'lucide-react';

interface ImageUploadWidgetProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectHint?: string;
  defaultUrl?: string;
  className?: string;
  allowPdf?: boolean;
}

export const ImageUploadWidget: React.FC<ImageUploadWidgetProps> = ({
  label,
  value,
  onChange,
  aspectHint = 'PNG, JPG, WEBP up to 25MB',
  defaultUrl,
  className = '',
  allowPdf = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(format, 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

  const handleFileChange = async (file: File) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (!isImage && (!allowPdf || !isPdf)) {
      setErrorMsg(allowPdf ? 'Please select an image or PDF file.' : 'Please select an image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg('');
      const compressedDataUrl = await compressImage(file);
      onChange(compressedDataUrl);

      try {
        await uploadImage(file);
      } catch (err) {
        console.warn('Backend upload notice:', err);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process image from device');
    } finally {
      setIsUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  return (
    <div className={`space-y-2 text-left ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-white/90">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-[#A5B0AA] hover:text-[#00D084] flex items-center gap-1 cursor-pointer font-mono"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Hide URL' : 'Edit URL directly'}</span>
        </button>
      </div>

      {/* Upload Drop Zone / Picker */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-3 rounded-2xl border transition-all ${
          isDragging
            ? 'border-[#00D084] bg-[#00D084]/10'
            : 'border-white/10 bg-[#080B0A] hover:border-white/20'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          
          {/* Thumbnail Preview */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0 flex items-center justify-center group shadow-md">
            {value ? (
              value.toLowerCase().endsWith('.pdf') ? (
                <FileText className="w-7 h-7 text-[#00D084]" />
              ) : (
                <img
                  src={value}
                  alt={label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              )
            ) : (
              <ImageIcon className="w-7 h-7 text-neutral-600" />
            )}

            {isUploading && (
              <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-[#00D084] animate-spin" />
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="flex-1 space-y-1.5 text-center sm:text-left w-full">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 text-xs font-semibold text-black bg-[#00D084] hover:bg-[#00e692] disabled:opacity-50 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Upload from Device'}</span>
              </button>

              {value && (
                <>
                  <span className="text-[11px] font-mono text-[#00D084] bg-[#00D084]/10 px-2 py-1 rounded border border-[#00D084]/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active</span>
                  </span>

                  {defaultUrl && value !== defaultUrl && (
                    <button
                      type="button"
                      onClick={() => onChange(defaultUrl)}
                      className="px-2.5 py-1.5 text-xs font-medium text-[#D4AF37] hover:text-[#f0c850] hover:bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      title="Reset to default brand asset"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset Default</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      const prev = value;
                      onChange('');
                      if (prev && prev.startsWith('/uploads/')) {
                        const fileName = prev.replace('/uploads/', '').split('?')[0];
                        try {
                          await deleteMediaFile(fileName);
                        } catch {}
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-red-400 hover:text-white hover:bg-red-600 border border-red-500/30 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                    title="Remove and delete this picture"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete / Clear</span>
                  </button>
                </>
              )}
            </div>

            <p className="text-[11px] text-[#A5B0AA]">
              Drag & drop photo or tap to pick from phone storage / PC. {aspectHint}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onInputChange}
              className="hidden"
            />
          </div>

        </div>

        {/* Optional Manual URL Input */}
        {showUrlInput && (
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <input
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="Paste image path or URL..."
              className="w-full px-3 py-2 bg-[#0c1210] border border-white/10 rounded-xl text-xs text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-[#00D084]"
            />
          </div>
        )}

        {/* Error notice */}
        {errorMsg && (
          <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

      </div>
    </div>
  );
};
