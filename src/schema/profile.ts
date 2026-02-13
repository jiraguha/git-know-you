import { z } from "zod";

export const ProjectCountsSchema = z.object({
  commits: z.number(),
  pull_requests: z.number(),
  issues_created: z.number(),
  reviews: z.number(),
  discussions: z.number(),
});

export const ProjectSchema = z.object({
  repo: z.string(),
  role: z.enum(["owner", "contributor"]),
  stars: z.number(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  counts: ProjectCountsSchema,
});

export const ProfileSchema = z.object({
  username: z.string(),
  fetched_at: z.string(),
  github: z.object({
    name: z.string().nullable(),
    bio: z.string().nullable(),
    company: z.string().nullable(),
    location: z.string().nullable(),
    public_repos: z.number(),
    followers: z.number(),
    created_at: z.string(),
  }),
  open_source: z.object({
    contributes: z.boolean(),
    activity_level: z.enum(["inactive", "occasional", "active", "prolific"]),
    summary: z.string(),
    projects: z.array(ProjectSchema),
    totals: ProjectCountsSchema,
    languages: z.record(z.string(), z.number()),
    maintained_projects: z.array(z.string()),
    stats: z.object({
      total_stars: z.number(),
      total_forks: z.number(),
      recent_events_count: z.number(),
      account_age_years: z.number(),
    }),
  }),
});

export type ProjectCounts = z.infer<typeof ProjectCountsSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ActivityLevel = Profile["open_source"]["activity_level"];
