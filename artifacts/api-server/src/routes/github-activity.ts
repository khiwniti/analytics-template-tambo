import { Router } from "express";
import { createHash } from "node:crypto";
import { logger } from "../lib/logger";

const githubActivityRouter = Router();

/** Normalized activity item returned to the frontend. */
type ActivityItem = {
  type: "push" | "create" | "pr";
  repo: string;
  message: string;
  url: string;
  createdAt: string;
};

type CachePayload = {
  items: ActivityItem[];
  rateLimited: boolean;
  fetchedAt: number;
  etag: string;
};

const GITHUB_USER = "getintheQ";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let cache: CachePayload | null = null;

type GhEvent = {
  type: string;
  repo?: { name?: string };
  created_at?: string;
  payload?: {
    commits?: Array<{ message?: string; sha?: string }>;
    ref_type?: string;
    ref?: string;
    pull_request?: {
      title?: string;
      html_url?: string;
      number?: number;
      state?: string;
      merged?: boolean;
    };
    action?: string;
  };
};

const MAX_ITEMS = 6;
const MAX_MSG_LEN = 80;

function truncate(s: string, max: number): string {
  const one = s.split("\n")[0];
  return one.length > max ? one.slice(0, max - 1) + "…" : one;
}

function normalize(events: GhEvent[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const ev of events) {
    if (!ev.repo?.name || !ev.created_at) continue;
    const repo = ev.repo.name;
    const repoUrl = `https://github.com/${repo}`;
    if (ev.type === "PushEvent") {
      const commits = ev.payload?.commits ?? [];
      const first = commits[0];
      if (!first?.message) continue;
      const sha = first.sha ?? "";
      items.push({
        type: "push",
        repo,
        message: truncate(first.message, MAX_MSG_LEN),
        url: sha ? `${repoUrl}/commit/${sha}` : repoUrl,
        createdAt: ev.created_at,
      });
    } else if (ev.type === "CreateEvent" && ev.payload?.ref_type === "repository") {
      items.push({
        type: "create",
        repo,
        message: truncate(`Created repository ${repo}`, MAX_MSG_LEN),
        url: repoUrl,
        createdAt: ev.created_at,
      });
    } else if (ev.type === "PullRequestEvent" && ev.payload?.action === "opened") {
      const pr = ev.payload.pull_request;
      if (!pr?.title || !pr.html_url) continue;
      items.push({
        type: "pr",
        repo,
        message: truncate(`Opened PR #${pr.number ?? ""}: ${pr.title}`, MAX_MSG_LEN),
        url: pr.html_url,
        createdAt: ev.created_at,
      });
    }
  }
  return items.slice(0, MAX_ITEMS);
}

type GhRepo = {
  name?: string;
  full_name?: string;
  description?: string | null;
  html_url?: string;
  fork?: boolean;
  pushed_at?: string;
  updated_at?: string;
  stargazers_count?: number;
};

/** Fallback: top public repos by stars/recent push when there are no events. */
async function fetchPinnedFallback(headers: Record<string, string>): Promise<ActivityItem[]> {
  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?type=owner&sort=pushed&per_page=30`,
      { headers },
    );
    if (!res.ok) return [];
    const repos = (await res.json()) as GhRepo[];
    const ranked = repos
      .filter((r) => !r.fork && r.html_url && r.name)
      .sort(
        (a, b) =>
          (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0) ||
          new Date(b.pushed_at ?? 0).getTime() - new Date(a.pushed_at ?? 0).getTime(),
      )
      .slice(0, MAX_ITEMS);
    return ranked.map((r) => ({
      type: "create" as const,
      repo: r.full_name ?? r.name ?? "",
      message: truncate(r.description ?? `Pinned repo ${r.name}`, MAX_MSG_LEN),
      url: r.html_url ?? `https://github.com/${GITHUB_USER}`,
      createdAt: r.pushed_at ?? r.updated_at ?? new Date().toISOString(),
    }));
  } catch (err) {
    logger.warn({ err }, "Pinned-repo fallback failed");
    return [];
  }
}

async function fetchActivity(): Promise<CachePayload> {
  const url = `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`;
  const headers: Record<string, string> = {
    "User-Agent": "khiw.dev-portfolio",
    Accept: "application/vnd.github+json",
  };
  if (process.env["GITHUB_TOKEN"]) {
    headers["Authorization"] = `Bearer ${process.env["GITHUB_TOKEN"]}`;
  }
  try {
    const res = await fetch(url, { headers });
    if (res.status === 403 || res.status === 429) {
      logger.warn({ status: res.status }, "GitHub API rate limited");
      return {
        items: [],
        rateLimited: true,
        fetchedAt: Date.now(),
        etag: `"rl-${Date.now()}"`,
      };
    }
    if (!res.ok) {
      logger.warn({ status: res.status }, "GitHub API non-OK response");
      return {
        items: [],
        rateLimited: false,
        fetchedAt: Date.now(),
        etag: `"err-${Date.now()}"`,
      };
    }
    const events = (await res.json()) as GhEvent[];
    let items = normalize(events);
    if (items.length === 0) {
      logger.info("No recent GitHub events; falling back to pinned repos");
      items = await fetchPinnedFallback(headers);
    }
    const hash = createHash("sha1").update(JSON.stringify(items)).digest("hex").slice(0, 16);
    const etag = `"gh-${items.length}-${hash}"`;
    return { items, rateLimited: false, fetchedAt: Date.now(), etag };
  } catch (err) {
    logger.error({ err }, "Failed to fetch GitHub activity");
    return {
      items: [],
      rateLimited: false,
      fetchedAt: Date.now(),
      etag: `"err-${Date.now()}"`,
    };
  }
}

githubActivityRouter.get("/github-activity", async (req, res) => {
  const now = Date.now();
  if (!cache || now - cache.fetchedAt > CACHE_TTL_MS) {
    cache = await fetchActivity();
  }
  const ifNoneMatch = req.headers["if-none-match"];
  res.setHeader("ETag", cache.etag);
  res.setHeader(
    "Cache-Control",
    `public, max-age=${Math.floor(CACHE_TTL_MS / 1000)}`,
  );
  if (ifNoneMatch && ifNoneMatch === cache.etag) {
    res.status(304).end();
    return;
  }
  res.json({
    items: cache.items,
    rateLimited: cache.rateLimited,
    fetchedAt: new Date(cache.fetchedAt).toISOString(),
  });
});

export default githubActivityRouter;
