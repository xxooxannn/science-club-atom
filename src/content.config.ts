import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string(),
    authorRole: z.string().optional(),
    tags: z.array(z.string()).default([]),
    // Placeholder photography — swap with real club photos (see README).
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const reports = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reports' }),
  schema: z.object({
    title: z.string(),
    abstract: z.string(),
    authors: z.array(z.string()),
    date: z.coerce.date(),
    field: z.string(), // e.g. Physics, Chemistry, Biology, Engineering
    file: z.string().optional(), // link to the published PDF
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles, reports };
