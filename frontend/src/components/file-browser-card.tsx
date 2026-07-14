'use client';

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FileItem } from "@/lib/types"; // Import shared interface
import { Pencil, Trash2, Folder, FileText, Video, File, ImageIcon } from "lucide-react";
import { useState } from "react";

interface FileBrowserCardProps {
  file: FileItem;
  productId: string;
  loggedIn: boolean;
  onEdit: (file: FileItem) => void;
  onDelete: (id: string) => void;
  onPreview: (file: FileItem) => void; // Parent handles fetching the preview URL
}

interface ThumbnailData { id: string; driveFileId: string; }

export function FileBrowserCard({ file, productId, loggedIn, onEdit, onDelete, onPreview }: FileBrowserCardProps) {
  const [imageState, setImageState] = useState<'loading' | 'google' | 'fallback' | 'error'>('loading');
  
  const { data: thumbnail } = useQuery({
    queryKey: ['file-thumbnail', file.id],
    queryFn: async () => (await api.get<ThumbnailData>(`/files/${file.id}/thumbnail`)).data,
    staleTime: 5 * 60 * 1000,
    enabled: !file.isFolder && file.mimeType.startsWith('image/'), 
  });

  if (thumbnail && imageState === 'loading') setImageState('google');

  const googleCdnUrl = thumbnail?.driveFileId ? `https://drive.google.com/thumbnail?id=${thumbnail.driveFileId}&sz=w400` : null;
  const backendProxyUrl = thumbnail?.id ? `${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}/preview` : null;


  let activeSrc: string | null = null;
  if (imageState === 'google' && googleCdnUrl) activeSrc = googleCdnUrl;
  if (imageState === 'fallback' && backendProxyUrl) activeSrc = backendProxyUrl;

  const handleImageError = () => {
    if (imageState === 'google' && backendProxyUrl) setImageState('fallback');
    else setImageState('error');
  };

  const getIcon = () => {
    if (file.isFolder) return <Folder className="h-16 w-16 text-[#5f6368] dark:text-[#9aa0a6]" />;
    if (file.mimeType.startsWith('image/')) return null;
    if (file.mimeType.includes('pdf')) return <FileText className="h-16 w-16 text-red-400" />;
    if (file.mimeType.startsWith('video/')) return <Video className="h-16 w-16 text-blue-400" />;
    return <File className="h-16 w-16 text-[#5f6368] dark:text-[#9aa0a6]" />;
  };

  const handleClick = () => {
    if (file.isFolder) {
      window.history.pushState({}, '', `/products/${productId}?folder=${file.id}`);
      window.dispatchEvent(new CustomEvent('folder-navigate', { detail: file.id }));
    } else {
      onPreview(file); // Pass the raw FileItem to the parent
    }
  };

  return (
    <div 
      className="group relative rounded-lg p-3 cursor-pointer transition-colors hover:bg-[#e8eaed] dark:hover:bg-[#3c4043]"
      onClick={handleClick}
    >
      {loggedIn && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!file.isFolder && (
            <button onClick={(e) => { e.stopPropagation(); onPreview(file); }} className="p-1.5 bg-white dark:bg-[#2d2e30] rounded-full shadow-sm border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#4a4d51]">
              <ImageIcon className="h-3.5 w-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onEdit(file); }} className="p-1.5 bg-white dark:bg-[#2d2e30] rounded-full shadow-sm border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#4a4d51]">
            <Pencil className="h-3.5 w-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(file.id); }} className="p-1.5 bg-white dark:bg-[#2d2e30] rounded-full shadow-sm border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f28b82]/20 text-[#d93025] dark:text-[#f28b82]">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="aspect-square rounded-md bg-[#f1f3f4] dark:bg-[#3c4043] mb-3 overflow-hidden flex items-center justify-center">
        {activeSrc && imageState !== 'error' ? (
          <img src={activeSrc} alt={file.name} onError={handleImageError} className="w-full h-full object-cover" />
        ) : (
          getIcon()
        )}
      </div>
      
      <p className="text-sm text-[#202124] dark:text-[#e8eaed] truncate leading-tight">{file.title || file.name}</p>
      {!file.isFolder && (
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate mt-0.5">File</p>
      )}
    </div>
  );
}