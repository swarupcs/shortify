import { z } from 'zod';
export const urlFormSchema = z.object({
  url: z.string().min(1, 'URL is required')
    .transform((val) => { if (!/^https?:\/\//i.test(val)) return `https://${val}`; return val; })
    .refine((val) => { try { new URL(val); return true; } catch { return false; } }, 'Please enter a valid URL'),
  customCode: z.string().max(20).regex(/^[a-zA-Z0-9_-]+$/).optional(),
});
export type UrlFormData = z.infer<typeof urlFormSchema>;
export type ApiResponse<T> = { success: boolean; data?: T; error?: string; };
export type Url = { id: number; originalUrl: string; shortCode: string; createdAt: string; updatedAt: string; clicks: number; };
