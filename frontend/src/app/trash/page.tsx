'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/use-auth';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, RotateCcw, AlertTriangle, FileText, Info } from 'lucide-react';
import { Footer } from '@/components/footer';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TrashedFile {
  id: string;
  name: string;
  title: string | null;
  deletedAt: string;
  product: { id: string; name: string };
}

export default function TrashPage() {
  const checked = useRequireAuth();
  const queryClient = useQueryClient();
  const [fileToDeleteForever, setFileToDeleteForever] = useState<TrashedFile | null>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ['trash'],
    queryFn: async () => (await api.get<TrashedFile[]>('/files/trash')).data,
    enabled: checked,
  });

  const restoreMutation = useMutation({
    mutationFn: (fileId: string) => api.post(`/files/${fileId}/restore`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trash'] }),
  });

  // TODO: Make sure you have a hard-delete endpoint in your NestJS backend (e.g., DELETE /files/:id/permanent)
  const deleteForeverMutation = useMutation({
    mutationFn: (fileId: string) => api.delete(`/files/${fileId}/permanent`), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      setFileToDeleteForever(null);
    },
  });

  if (!checked) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--paper)]">
      <Navbar />
      
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 space-y-8">
        
        {/* Header */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-2">
            <Trash2 className="h-6 w-6 text-[var(--muted)]" />
            <h1 className="font-display text-3xl font-bold text-[var(--ink)] tracking-tight">
              Recycle Bin
            </h1>
          </div>
          <p className="text-[var(--muted)] font-body">
            Manage recently deleted files. You can restore them or remove them permanently.
          </p>
        </section>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">
            Items in the recycle bin are safe until you permanently delete them. 
            <span className="font-medium"> Restoring </span> a file will return it to its original product folder.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3 animate-in fade-in duration-300">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-[var(--line)]">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {files && files.length === 0 && !isLoading && (
          <div className="text-center py-20 border border-dashed border-[var(--line)] rounded-2xl bg-white/50 animate-in fade-in duration-300">
            <Trash2 className="h-16 w-16 text-[var(--line)] mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-[var(--ink)]">Trash is empty</h3>
            <p className="text-sm text-[var(--muted)] mt-2">
              There are no deleted files to recover.
            </p>
          </div>
        )}

        {/* Files List */}
        <div className="space-y-2">
          {files?.map((file, index) => (
            <div 
              key={file.id} 
              className="group flex items-center justify-between p-4 bg-white border border-[var(--line)] rounded-xl hover:shadow-md hover:border-[var(--ink)]/10 transition-all animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
            >
              {/* File Info */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-2.5 bg-[var(--paper)] rounded-lg border border-[var(--line)] group-hover:border-[var(--ink)]/10 transition-colors">
                  <FileText className="h-5 w-5 text-[var(--muted)]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-[var(--ink)] truncate">
                    {file.title || file.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono px-1.5 py-0.5 bg-[var(--paper)] rounded border border-[var(--line)] text-[var(--muted)]">
                      {file.product.name}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      Deleted {new Date(file.deletedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => restoreMutation.mutate(file.id)}
                  disabled={restoreMutation.isPending}
                  className="text-[var(--teal)] hover:text-[var(--teal)] hover:bg-[var(--teal)]/10"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Restore
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFileToDeleteForever(file)}
                  disabled={deleteForeverMutation.isPending}
                  className="text-[var(--muted)] hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete Forever
                </Button>
              </div>
            </div>
          ))}
        </div>

      </main>

      <Footer />

      {/* Delete Forever Confirmation Dialog */}
      <AlertDialog open={!!fileToDeleteForever} onOpenChange={(open) => !open && setFileToDeleteForever(null)}>
        <AlertDialogContent className="bg-white border-[var(--line)]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-full text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-[var(--ink)] text-left">
                Permanently delete &quot;{fileToDeleteForever?.title || fileToDeleteForever?.name}&quot;?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[var(--muted)] pl-12">
              This action cannot be undone. This will permanently remove the file record from the database. (Note: This does not delete the file from Google Drive, only from this system).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pl-12">
            <AlertDialogCancel className="bg-[var(--paper)] border-[var(--line)] text-[var(--ink)] hover:bg-[var(--line)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => fileToDeleteForever && deleteForeverMutation.mutate(fileToDeleteForever.id)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteForeverMutation.isPending ? 'Deleting...' : 'Yes, delete forever'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}