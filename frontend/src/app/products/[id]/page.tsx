'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useIsAuthenticated } from '@/lib/use-is-authenticated';
import { Navbar } from '@/components/navbar';
import { DriveSidebar } from '@/components/drive-sidebar';
import { FileBrowserCard } from '@/components/file-browser-card';
import { EditFileDialog } from '@/components/edit-file-dialog';
import { PreviewDialog } from '@/components/preview-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, RefreshCw, FolderOpen, Upload } from 'lucide-react';
import { Footer } from '@/components/footer';
import { FileItem } from '@/lib/types'; // Import shared interface
import { UploadDialog } from '@/components/upload-dialog';
import { useRequireAuth } from '@/lib/use-auth';

// Define a separate interface specifically for the Preview Dialog,
// because it includes extra data fetched from the /preview-url endpoint
interface PreviewFileData {
  id: string; 
  name: string; 
  mimeType: string; 
  previewUrl: string; 
  role: string;
}

export default function ProductDetailPage() {
  const loggedIn = useRequireAuth();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const currentFolderId = searchParams.get('folder') || null;
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Root' }]);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<PreviewFileData | null>(null); // Use PreviewFileData here

  const { data: product } = useQuery({
    queryKey: ['product', params.id],
    queryFn: async () => (await api.get(`/products/${params.id}`)).data 
  });

  const { data: files, isLoading } = useQuery({
    queryKey: ['product-files', params.id, currentFolderId],
    queryFn: async () => (await api.get<FileItem[]>(`/products/${params.id}/files?parentId=${currentFolderId || ''}`)).data 
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => api.delete(`/files/${fileId}`), 
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product-files', params.id] }) 
  });

  const syncMutation = useMutation({
    mutationFn: () => api.post(`/products/${params.id}/sync-hierarchy`), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-files', params.id] }) ;
      queryClient.invalidateQueries({queryKey: ['sidebar-folders']});
    }
  });

  useEffect(() => {
    syncMutation.mutate();
    // We don't need to clean it up because React Query handles the state.
    // If the user navigates away quickly, it just cancels the background request.
  }, [ params.id]); 




  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`breadcrumb-path:${params.id}`);
      if (stored) {
        const parsedPath: { id: string | null; name: string }[] = JSON.parse(stored);
        const lastId = parsedPath.length > 0 ? parsedPath[parsedPath.length - 1].id : null;
        if (lastId === currentFolderId) {
          setBreadcrumbs(parsedPath);
          return;
        }
      }
    } catch {
      // Ignore malformed/unavailable sessionStorage data and fall through.
    }
    // If we're back at the product root and there's no matching stored path,
    // make sure the breadcrumbs reset cleanly.
    if (currentFolderId === null) {
      setBreadcrumbs([{ id: null, name: 'Root' }]);
    }
  }, [currentFolderId, params.id]);

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newFolderId = customEvent.detail;
      const clickedFolder = files?.find(f => f.id === newFolderId);
      if (clickedFolder) {
        setBreadcrumbs(prev => [...prev, { id: clickedFolder.id, name: clickedFolder.title || clickedFolder.name }]);
      }
      queryClient.invalidateQueries({ queryKey: ['product-files', params.id] });
    };
    window.addEventListener('folder-navigate', handleNavigate);
    return () => window.removeEventListener('folder-navigate', handleNavigate);
  }, [files, params.id, queryClient]);

  const handleBreadcrumbClick = (index: number) => {
    const targetFolder = breadcrumbs[index];
    const newUrl = targetFolder.id ? `/products/${params.id}?folder=${targetFolder.id}` : `/products/${params.id}`;
    window.history.pushState({}, '', newUrl);
    window.dispatchEvent(new CustomEvent('folder-navigate', { detail: targetFolder.id }));
    setBreadcrumbs(prev => prev.slice(0, index + 1));
  };

  // Safely fetch preview URL and merge with the FileItem
  const handlePreview = async (file: FileItem) => {
    try {
      const res = await api.get<{ previewUrl: string; role: string }>(`/files/${file.id}/preview-url`);
      setPreviewFile({ 
        id: file.id, 
        name: file.name, 
        mimeType: file.mimeType, 
        previewUrl: res.data.previewUrl, 
        role: res.data.role 
      });
    } catch {
      setPreviewFile({ 
        id: file.id, 
        name: file.name, 
        mimeType: file.mimeType, 
        previewUrl: `${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}/preview`, 
        role: 'reader' 
      });
    }
  };

   const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      // Append all selected files
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      return api.post(`/products/${params.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      setUploadDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['product-files', params.id] });
    }
  });

  return (
    <div className="flex flex-col h-full">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <DriveSidebar />
        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
          <div className="max-w-6xl mx-auto flex flex-col min-h-full">
            
            <div className="mb-6 pb-4 border-b border-[#dadce0] dark:border-[#5f6368]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043]">
                    <ArrowLeft className="h-5 w-5 text-[#5f6368] dark:text-[#9aa0a6]" />
                  </button>
                  <h1 className="text-xl text-[#202124] dark:text-[#e8eaed]">{product?.name}</h1>
                </div>
                {loggedIn && (
                                    <div className="flex gap-2">
                    <Button variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="border-[#dadce0] dark:border-[#5f6368] text-[#5f6368] dark:text-[#9aa0a6]">
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> Force Refresh
                    </Button>
                    <Button 
                      onClick={() => setUploadDialogOpen(true)} 
                      className="bg-[#1a73e8] dark:bg-[#8ab4f8] hover:bg-[#1765cc] dark:hover:bg-[#aecbfa] text-white dark:text-[#202124]"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Upload Files
                    </Button>
                  </div>
                ) }
              </div>

              <div className="flex items-center gap-1 text-sm overflow-x-auto pb-2">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.id || 'root'} className="flex items-center gap-1 flex-shrink-0">
                    {index > 0 && <ChevronRight className="h-4 w-4 text-[#5f6368] dark:text-[#9aa0a6]" />}
                    <button 
                      onClick={() => handleBreadcrumbClick(index)}
                      className={`hover:text-[#1a73e8] dark:hover:text-[#8ab4f8] transition-colors px-1 rounded ${
                        index === breadcrumbs.length - 1 ? 'text-[#202124] dark:text-[#e8eaed] font-medium' : 'text-[#5f6368] dark:text-[#9aa0a6]'
                      }`}
                    >
                      {crumb.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="space-y-2 p-3">
                    <Skeleton className="aspect-square w-full rounded-md bg-[#e8eaed] dark:bg-[#3c4043]" />
                    <Skeleton className="h-4 w-3/4 rounded bg-[#e8eaed] dark:bg-[#3c4043]" />
                  </div>
                ))}
              </div>
            )}

            {files && files.length === 0 && !isLoading && (
              <div className="text-center py-20 bg-white dark:bg-[#2d2e30] rounded-lg border border-[#dadce0] dark:border-[#5f6368]">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-[#dadce0] dark:text-[#5f6368]" />
                <p className="text-[#5f6368] dark:text-[#9aa0a6]">This folder is empty</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
              {files?.map((file) => (
                <FileBrowserCard 
                  key={file.id} 
                  file={file} 
                  productId={params.id}
                  loggedIn={loggedIn}
                  onEdit={(f) => setEditingFile(f)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onPreview={handlePreview}
                />
              ))}
            </div>
            
            <Footer />
          </div>
        </main>
      </div>

      {/* FIX: Map exactly to the fields your EditFileDialog expects (includes remarks & visibility) */}
      {editingFile && (
        <EditFileDialog 
          fileId={editingFile.id} 
          open={!!editingFile} 
          onOpenChange={(open) => !open && setEditingFile(null)} 
          initial={{
            title: editingFile.title, 
            description: editingFile.description || '', 
            remarks: editingFile.remarks || '', // Fixed: Added remarks
            visibility: editingFile.visibility,     // Fixed: Added visibility
            categoryId: editingFile.category?.id || null, 
            tagIds: editingFile.fileTags.map((ft) => ft.tag.id) 
          }} 
        />
      )}
      
      {/* FIX: Pass the specific PreviewFileData type to the dialog */}
      {previewFile && (
        <PreviewDialog 
          file={previewFile} 
          open={!!previewFile} 
          onOpenChange={(open) => !open && setPreviewFile(null)} 
        />
      )}

      <UploadDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen} 
        onUpload={(files) => uploadMutation.mutate(files)} 
        isUploading={uploadMutation.isPending} 
      />
    </div>
  );
}