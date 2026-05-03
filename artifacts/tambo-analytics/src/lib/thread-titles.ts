const THREAD_TITLES_KEY = "tambo-thread-titles";

export const THREAD_TITLE_EVENT = "tambo:thread-title";

export function getThreadTitles(): Record<string, string> {
  try {
    const raw = localStorage.getItem(THREAD_TITLES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function setThreadTitle(threadId: string, title: string): void {
  try {
    const titles = getThreadTitles();
    titles[threadId] = title;
    localStorage.setItem(THREAD_TITLES_KEY, JSON.stringify(titles));
  } catch {
    // ignore
  }
}

export function deriveTitle(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, " ");
  const words = cleaned.split(" ");
  const title = words.slice(0, 6).join(" ");
  return title.length > 42 ? title.slice(0, 39) + "…" : title;
}
