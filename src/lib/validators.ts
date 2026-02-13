import { z } from "zod";

export const AttackQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(2000).default(20),
  state: z.string().trim().max(100).optional(),
  group: z.string().trim().max(200).optional(),
  status: z.enum(["confirmed", "unconfirmed", "developing"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().trim().max(200).optional(),
  sort: z.enum(["date_desc", "date_asc", "casualties_desc"]).default("date_desc"),
  casualtyType: z.enum(["killed", "injured", "kidnapped"]).optional(),
});

export type AttackQuery = z.infer<typeof AttackQuerySchema>;

export const AttackInputSchema = z.object({
  title: z.string().trim().min(5).max(500),
  description: z.string().trim().min(10).max(5000),
  date: z.string().datetime(),
  location: z.object({
    state: z.string().trim().min(1).max(100),
    lga: z.string().trim().max(100).default("Unknown"),
    town: z.string().trim().max(100).default("Unknown"),
    coordinates: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),
  }),
  group: z.string().trim().min(1).max(200),
  casualties: z.object({
    killed: z.number().int().min(0).nullable().default(null),
    injured: z.number().int().min(0).nullable().default(null),
    kidnapped: z.number().int().min(0).nullable().default(null),
    displaced: z.number().int().min(0).nullable().default(null),
  }),
  sources: z
    .array(
      z.object({
        url: z.string().url().max(2000),
        title: z.string().trim().max(500).default(""),
        publisher: z.string().trim().max(200).default(""),
      })
    )
    .min(0)
    .max(20),
  status: z.enum(["confirmed", "unconfirmed", "developing"]).default("unconfirmed"),
  tags: z.array(z.string().trim().max(50)).max(20).default([]),
});

export type AttackInput = z.infer<typeof AttackInputSchema>;
