'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useIsAuthenticated } from '@/lib/use-is-authenticated';
import { Navbar } from '@/components/navbar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Eye, Download, Pencil, Trash2, RefreshCw, Image as ImageIcon, FileText, Video, File } from 'lucide-react';
import { useState } from 'react';
import { EditFileDialog } from '@/components/edit-file-dialog';
import { Footer } from '@/components/footer';

interface FileItem {
    id: string;
    name: string;
    title: string | null;
    description: string | null;
    remarks: string | null;
    visibility: 'PUBLIC' | 'PRIVATE';
    mimeType: string;
    category: { id: string; name: string } | null;
    fileTags: { tag: { id: string; name: string } }[];
}

// Helper to determine icon based on MIME type
const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return null; // We'll show the actual image
    if (mimeType.includes('pdf')) return <FileText className="h-12 w-12 text-red-400" />;
    if (mimeType.startsWith('video/')) return <Video className="h-12 w-12 text-blue-400" />;
    return <File className="h-12 w-12 text-[var(--muted)]" />;
};

const isImage = (mimeType: string) => mimeType.startsWith('image/');

export default function ProductDetailPage() {
    const loggedIn = useIsAuthenticated();
    const params = useParams<{ id: string }>();
    const [editingFile, setEditingFile] = useState<FileItem | null>(null);

    const { data: product } = useQuery({
        queryKey: ['product', params.id],
        queryFn: async () => (await api.get(`/products/${params.id}`)).data,
    });

    const { data: files, isLoading } = useQuery({
        queryKey: ['product-files', params.id],
        queryFn: async () => (await api.get<FileItem[]>(`products/${params.id}/files`)).data,
    });

    const queryClient = useQueryClient();
    
    const deleteMutation = useMutation({
        mutationFn: (fileId: string) => api.delete(`/files/${fileId}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product-files', params.id] }),
    });

    const syncMutation = useMutation({
        mutationFn: () => api.post(`/products/${params.id}/sync`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product-files', params.id] }),
    });

    return (
        <div className="flex flex-col min-h-screen bg-[var(--paper)]">
            <Navbar />

            <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--line)] pb-6 animate-in fade-in duration-500">
                    <div>
                        <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--ink)] tracking-tight">
                            {product?.name || 'Loading...'}
                        </h1>
                        <p className="text-[var(--muted)] mt-2 font-body max-w-2xl">
                            {product?.description || 'Manage the digital assets synced from this product\'s Google Drive folder.'}
                        </p>
                    </div>
                    
                    {loggedIn && (
                        <Button 
                            onClick={() => syncMutation.mutate()} 
                            disabled={syncMutation.isPending}
                            className="bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--ink)]/90 w-fit"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                            {syncMutation.isPending ? 'Syncing...' : 'Sync with Drive'}
                        </Button>
                    )}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="aspect-square w-full rounded-xl" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {files && files.length === 0 && !isLoading && (
                    <div className="text-center py-20 border border-dashed border-[var(--line)] rounded-2xl bg-white/50">
                        <FileText className="h-16 w-16 text-[var(--line)] mx-auto mb-4" />
                        <h3 className="font-display text-xl font-semibold text-[var(--ink)]">No files found</h3>
                        <p className="text-sm text-[var(--muted)] mt-2 max-w-md mx-auto">
                            There are no files in this product&apos;s Drive folder yet. Click &quot;Sync with Drive&quot; to pull them in.
                        </p>
                    </div>
                )}

                {/* Asset Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {files?.map((file, index) => {
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
                                        
                                        {loggedIn && (
                                            <>
                                                <Button 
                                                    size="icon" 
                                                    variant="secondary" 
                                                    className="h-10 w-10 rounded-full shadow-lg hover:bg-white hover:text-[var(--teal)]"
                                                    onClick={() => setEditingFile(file)}
                                                    title="Edit Metadata"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="secondary" 
                                                    className="h-10 w-10 rounded-full shadow-lg hover:bg-red-100 hover:text-red-600"
                                                    onClick={() => deleteMutation.mutate(file.id)}
                                                    title="Delete File"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* File Metadata */}
                                <div className="p-4 space-y-3">
                                    <h3 className="text-sm font-medium text-[var(--ink)] truncate font-body" title={file.title || file.name}>
                                        {file.title || file.name}
                                    </h3>
                                    
                                    <div className="flex flex-wrap gap-1.5">
                                        {file.category && (
                                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[var(--teal)]/10 text-[var(--teal)] rounded-full border border-[var(--teal)]/20">
                                                {file.category.name}
                                            </span>
                                        )}
                                        {file.fileTags.map((ft) => (
                                            <span key={ft.tag.id} className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[var(--amber)]/10 text-[var(--amber)] rounded-full border border-[var(--amber)]/20">
                                                {ft.tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </main>

            {editingFile && (
                <EditFileDialog
                    fileId={editingFile.id}
                    open={!!editingFile}
                    onOpenChange={(open) => !open && setEditingFile(null)}
                    initial={{
                        title: editingFile.title,
                        description: editingFile.description,
                        remarks: editingFile.remarks,
                        visibility: editingFile.visibility,
                        categoryId: editingFile.category?.id || null,
                        tagIds: editingFile.fileTags.map((ft) => ft.tag.id),
                    }}
                />
            )}

            <Footer />
        </div>
    );
}