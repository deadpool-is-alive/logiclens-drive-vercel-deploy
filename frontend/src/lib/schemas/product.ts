import { z } from 'zod';

export const productSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    driveFolderId: z.string().min(1, 'Drive folder ID is required'),
});


export type ProductFormValues = z.infer<typeof productSchema>;