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
      const more = commits.length > 1 ? ` (+${commits.length - 1} more)` : "";
      items.push({
        type: "push",
        repo,
        message: first.message.split("\n")[0].slice(0, 140) + more,
        url: sha ? `${repoUrl}/commit/${sha}` : repoUrl,
        createdAt: ev.created_at,
      });
    } else if (ev.type === "CreateEvent" && ev.payload?.ref_type === "repository") {
      items.push({
        type: "create",
        repo,
        message: `Created repository ${repo}`,
        url: repoUrl,
        createdAt: ev.created_at,
      });
    } else if (ev.type === "PullRequestEvent" && ev.payload?.action === "opened") {
      const pr = ev.payload.pull_request;
      if (!pr?.title || !pr.html_url) continue;
      items.push({
        type: "pr",
        repo,
        message: `Opened PR #${pr.number ?? ""}: ${pr.title.slice(0, 140)}`,
        url: pr.html_url,
        createdAt: ev.created_at,
      });
    }
  }
  return items.slice(0, 10);
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
    const items = normalize(events);
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
