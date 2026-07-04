'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useIsAuthenticated } from "@/lib/use-is-authenticated";
import { Navbar } from "@/components/navbar";
import { ProductDialog } from "@/components/product-dialog";
import { ProductCard } from "@/components/product-card";
import { Product } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Image as ImageIcon } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Footer } from '@/components/footer';

export default function Home() {
  const loggedIn = useIsAuthenticated();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get<Product[]>('/products')).data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeletingProduct(null);
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-[var(--paper)]">
      <Navbar />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--ink)] via-[#2a2d35] to-[var(--teal)] p-8 md:p-12 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative z-10">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Your Digital Assets.
            </h1>
            <p className="mt-3 text-lg text-white/70 max-w-xl font-body">
              Search, preview, and manage company assets stored in Google Drive. Everything organized in one place.
            </p>
            {loggedIn && (
              <Button 
                onClick={() => { setEditingProduct(null); setDialogOpen(true); }}
                className="mt-6 bg-[var(--teal)] hover:bg-[var(--teal)]/90 text-white font-medium"
              >
                <Plus className="h-4 w-4 mr-2" /> Add New Product
              </Button>
            )}
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--amber)]/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 blur-2xl rounded-full translate-y-1/2 -translate-x-1/2" />
        </section>

        {/* Content Grid Section */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--ink)]">Products</h2>
              <p className="text-sm text-[var(--muted)] font-body mt-1">
                {products?.length ? `${products.length} products found` : 'No products available'}
              </p>
            </div>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12 border border-dashed border-[var(--line)] rounded-xl">
              <p className="text-red-500 font-medium">Failed to load products.</p>
              <p className="text-sm text-[var(--muted)] mt-1">Please check your connection or try again later.</p>
            </div>
          )}

          {products && products.length === 0 && !isLoading && (
            <div className="text-center py-16 border border-dashed border-[var(--line)] rounded-xl bg-white/50">
              <ImageIcon className="h-12 w-12 text-[var(--line)] mx-auto mb-4" />
              <p className="text-[var(--ink)] font-medium font-display text-lg">No products yet</p>
              <p className="text-sm text-[var(--muted)] mt-1">Get started by creating your first product folder.</p>
            </div>
          )}

          {/* The Clean Grid Map */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products?.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                index={index}
                loggedIn={loggedIn}
                onEdit={(p) => { setEditingProduct(p); setDialogOpen(true); }}
                onDelete={(p) => setDeletingProduct(p)}
              />
            ))}
          </div>
        </section>
      </main>

      <Footer />

      {dialogOpen && (
        <ProductDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          existing={editingProduct || undefined}
        />
      )}

      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent className="bg-white border-[var(--line)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--ink)]">Delete &quot;{deletingProduct?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--muted)]">
              This permanently deletes the product and all its synced file records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[var(--paper)] border-[var(--line)] text-[var(--ink)] hover:bg-[var(--line)]">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}