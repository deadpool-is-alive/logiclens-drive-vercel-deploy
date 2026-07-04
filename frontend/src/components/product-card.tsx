'use client';

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Product } from "@/lib/types";
import { Card } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  index: number;
  loggedIn: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

interface ThumbnailData {
  id: string;
  driveFileId: string;
}

export function ProductCard({ product, index, loggedIn, onEdit, onDelete }: ProductCardProps) {
  // State machine: 'loading' -> 'google' -> 'fallback' -> 'error'
  const [imageState, setImageState] = useState<'loading' | 'google' | 'fallback' | 'error'>('loading');

  const { data: thumbnail } = useQuery({
    queryKey: ['product-thumbnail', product.id],
    queryFn: async () => (await api.get<ThumbnailData>(`/products/${product.id}/thumbnail`)).data,
    staleTime: 5 * 60 * 1000,
    enabled: !!product.id,
  });

  // Set state to 'google' the moment the thumbnail data arrives from your API
  if (thumbnail && imageState === 'loading') {
    setImageState('google');
  }

  const googleCdnUrl = thumbnail?.driveFileId 
    ? `https://drive.google.com/thumbnail?id=${thumbnail.driveFileId}&sz=w600` 
    : null;
    
  const backendProxyUrl = thumbnail?.id 
    ? `${process.env.NEXT_PUBLIC_API_URL}/files/${thumbnail.id}/preview` 
    : null;

  // Determine which source to show based on current state
  let activeSrc: string | null = null;
  if (imageState === 'google' && googleCdnUrl) activeSrc = googleCdnUrl;
  if (imageState === 'fallback' && backendProxyUrl) activeSrc = backendProxyUrl;

  const handleImageError = () => {
    if (imageState === 'google' && backendProxyUrl) {
      // Google failed, try backend
      setImageState('fallback');
    } else {
      // Everything failed, show placeholder
      setImageState('error');
    }
  };

  return (
    <Card 
      className="overflow-hidden border-[var(--line)] bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
    >
      {/* Image Container - Added w-full to prevent CSS collapse */}
      <div className="relative w-full aspect-video bg-[var(--line)] overflow-hidden">
        
        {activeSrc && imageState !== 'error' ? (
          <img 
            src={activeSrc} 
            alt={product.name} 
            onError={handleImageError}
            draggable={false} 
            // CRITICAL FIX: 'block' prevents inline element spacing bugs. 'w-full h-full' forces it to fill the container.
            className="block w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--line)] to-white">
             <ImageIcon className="h-10 w-10 text-[var(--muted)]/30" />
          </div>
        )}

        {/* Hover Overlay */}
        {loggedIn && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-9 w-9 rounded-full shadow-lg"
              onClick={(e) => { e.preventDefault(); onEdit(product); }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-9 w-9 rounded-full shadow-lg hover:bg-red-100 hover:text-red-600"
              onClick={(e) => { e.preventDefault(); onDelete(product); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <Link href={`/products/${product.id}`} className="block p-5">
        <h3 className="font-display font-semibold text-lg text-[var(--ink)] group-hover:text-[var(--teal)] transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2 font-body">
          {product.description || 'No description provided'}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs font-mono text-[var(--muted)]">
          <span className="px-2 py-0.5 bg-[var(--paper)] rounded-md border border-[var(--line)]">
            PRODUCT
          </span>
        </div>
      </Link>
    </Card>
  );
}