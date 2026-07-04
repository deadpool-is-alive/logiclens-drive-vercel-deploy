'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { productSchema, ProductFormValues } from '@/lib/schemas/product';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: { id: string; name: string; description: string | null; driveFolderId: string };
}

export function ProductDialog({ open, onOpenChange, existing }: ProductDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!existing;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    values: existing
      ? { name: existing.name, description: existing.description || '', driveFolderId: existing.driveFolderId }
      : { name: '', description: '', driveFolderId: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      isEditing ? api.patch(`/products/${existing.id}`, values) : api.post('/products', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      reset();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'New Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label>Description</Label>
            <Textarea {...register('description')} />
          </div>

          <div>
            <Label>Google Drive Folder ID</Label>
            <Input {...register('driveFolderId')} disabled={isEditing} />
            {errors.driveFolderId && <p className="text-sm text-red-600 mt-1">{errors.driveFolderId.message}</p>}
            {isEditing && <p className="text-xs text-neutral-500 mt-1">Folder ID can&apos;t be changed after creation.</p>}
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600">
              {(mutation.error as any)?.response?.data?.message || 'Something went wrong'}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}