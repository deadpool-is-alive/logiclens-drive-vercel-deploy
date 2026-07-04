'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Navbar } from '@/components/navbar';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Search, Eye, Download, Pencil, FileText, Video, File, Image as ImageIcon, SlidersHorizontal } from 'lucide-react';
import { Footer } from '@/components/footer';

interface Category { id: string; name: string; }
interface Tag { id: string; name: string; }
interface FileResult {
  id: string;
  name: string;
  title: string | null;
  mimeType: string;
  category: Category | null;
  fileTags: { tag: Tag }[];
  product: { id: string; name: string };
}

// Helper to determine icon based on MIME type
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return null; // We'll show the actual image
  if (mimeType.includes('pdf')) return <FileText className="h-12 w-12 text-red-400" />;
  if (mimeType.startsWith('video/')) return <Video className="h-12 w-12 text-blue-400" />;
  return <File className="h-12 w-12 text-[var(--muted)]" />;
};

const isImage = (mimeType: string) => mimeType.startsWith('image/');

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await api.get<Tag[]>('/tags')).data,
  });

  const { data: results, isLoading } = useQuery({
    queryKey: ['file-search', query, category, tag],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (category) params.set('category', category);
      if (tag) params.set('tag', tag);
      return (await api.get<FileResult[]>(`/files/search?${params.toString()}`)).data;
    },
  });

  // Custom styling for native select to match the design system
  const selectClass = "h-11 min-w-[160px] border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] rounded-lg px-4 text-sm font-body appearance-none cursor-pointer hover:border-[var(--ink)] transition-colors focus:ring-2 focus:ring-[var(--teal)] focus:border-[var(--teal)] outline-none";

  return (
    <div className="flex flex-col min-h-screen bg-[var(--paper)]">
      <Navbar />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 space-y-8">
        
        {/* Search Header Section */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-2">
            <SlidersHorizontal className="h-6 w-6 text-[var(--teal)]" />
            <h1 className="font-display text-3xl font-bold text-[var(--ink)] tracking-tight">
              Asset Search
            </h1>
          </div>
          <p className="text-[var(--muted)] font-body">
            Find files across all products by name, category, or tag.
          </p>
        </section>

        {/* Search & Filter Bar */}
        <section className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
              <Input
                placeholder="Search by file name or title..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-11 border-[var(--line)] bg-[var(--paper)] focus-visible:ring-[var(--teal)]"
              />
            </div>

            {/* Category Select */}
            <div className="relative">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                <option value="">All Categories</option>
                {categories?.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            {/* Tag Select */}
            <div className="relative">
              <select value={tag} onChange={(e) => setTag(e.target.value)} className={selectClass}>
                <option value="">All Tags</option>
                {tags?.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
          </div>
        </section>

        {/* Loading State - Visual Grid Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {results && results.length === 0 && !isLoading && (
          <div className="text-center py-20 border border-dashed border-[var(--line)] rounded-2xl bg-white/50 animate-in fade-in duration-300">
            <Search className="h-16 w-16 text-[var(--line)] mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-[var(--ink)]">No assets found</h3>
            <p className="text-sm text-[var(--muted)] mt-2 max-w-md mx-auto">
              Try adjusting your search query or changing the selected filters.
            </p>
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results?.map((file, index) => {
            const previewUrl = `${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}/preview`;
            const Icon = getFileIcon(file.mimeType);
            const showImage = isImage(file.mimeType);

            return (
              <Card 
                key={file.id} 
                className="overflow-hidden border-[var(--line)] bg-white group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-in fade-in zoom-in-95"
                style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
              >
                {/* File Preview Area */}
                <div className="relative aspect-square bg-[var(--line)] overflow-hidden">
                  {showImage ? (
                    <img 
                      src={previewUrl} 
                      alt={file.title || file.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--paper)] to-white">
                      {Icon}
                    </div>
                  )}

                  {/* Hover Overlay Actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-10 w-10 rounded-full shadow-lg"
                      onClick={() => window.open(previewUrl, '_blank')}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-10 w-10 rounded-full shadow-lg"
                      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}/download`, '_blank')}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* File Metadata */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--ink)] truncate font-body" title={file.title || file.name}>
                      {file.title || file.name}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5 truncate font-mono">
                      in {file.product.name}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {file.category && (
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[var(--teal)]/10 text-[var(--teal)] rounded-full border border-[var(--teal)]/20">
                        {file.category.name}
                      </span>
                    )}
                    {file.fileTags.slice(0, 2).map((ft) => (
                      <span key={ft.tag.id} className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[var(--amber)]/10 text-[var(--amber)] rounded-full border border-[var(--amber)]/20">
                        #{ft.tag.name}
                      </span>
                    ))}
                    {file.fileTags.length > 2 && (
                      <span className="text-[10px] font-mono text-[var(--muted)]">
                        +{file.fileTags.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}