import { z } from "zod";

// --- Notes ---
const VALID_CATEGORIES = ["Bahagia", "Sedih", "Produktif", "Santai", "Penting"] as const;

// Helper: convert null/empty string → undefined so .url() check is skipped
const optionalUrl = z.preprocess(
    (v) => (v === null || v === "" ? undefined : v),
    z.string().url("Must be a valid URL").optional()
);

export const createNoteSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    content: z.string().min(1, "Content is required"),
    url: optionalUrl,
    category: z.enum(VALID_CATEGORIES).optional().default("Santai"),
    imageUrl: optionalUrl,
});

// --- Books ---
export const createBookSchema = z.object({
    title: z.string().min(1, "Title is required").max(150),
    description: z.string().min(1, "Description is required"),
    author: z.string().min(1, "Author is required").max(100),
    cover: z.string().optional().nullable(),
    status: z.string().optional(),
    publishedDate: z.string().optional().nullable(),
});

export const updateBookSchema = z.object({
    title: z.string().min(1, "Title is required").max(150).optional(),
    description: z.string().min(1, "Description is required").optional(),
    author: z.string().min(1, "Author is required").max(100).optional(),
    cover: z.string().optional().nullable(),
    status: z.string().optional(),
    publishedDate: z.string().optional().nullable(),
    isFavorite: z.boolean().optional(),
});

// --- Parts ---
export const createPartSchema = z.object({
    title: z.string().min(1, "Title is required").max(150),
    content: z.string().min(1, "Content is required"),
    partNumber: z.number().int().positive("Part number must be a positive integer"),
});

export const updatePartSchema = z.object({
    title: z.string().min(1, "Title is required").max(150).optional(),
    content: z.string().min(1, "Content is required").optional(),
    partNumber: z.number().int().positive("Part number must be a positive integer").optional(),
});

// --- Gallery ---
export const createGallerySchema = z.object({
    photoUrl: z.string().min(1, "Photo URL is required"),
    description: z.string().optional().nullable(),
});

export const updateGallerySchema = z.object({
    photoUrl: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
});
