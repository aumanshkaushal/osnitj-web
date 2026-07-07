import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type Project = {
  no: string;
  name: string;
  desc: string;
  tag: string;
  stars: number;
  forks: number;
  contributors: number;
  url: string;
};

type Contributor = {
  handle: string;
  role: string;
  avatar: string;
  url: string;
};

type RecentCommit = {
  sha: string;
  message: string;
  date: string;
  repo: string;
  repoUrl: string;
  url: string;
  author: string;
  authorUrl: string | null;
  branch: string;
};

type GitHubRepo = {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  archived: boolean;
  fork: boolean;
  default_branch: string;
};

type GitHubContributor = {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    } | null;
  };
  author: {
    login: string;
    html_url: string;
  } | null;
};

const ORG_LOGIN = "Opensource-NITJ";
const GITHUB_API_BASE = "https://api.github.com";

function fmtNum(n: number) {
  return n.toLocaleString("en-US");
}

function pluralize(n: number, singular: string, plural = `${singular}s`) {
  return `${fmtNum(n)} ${n === 1 ? singular : plural}`;
}

function pad(n: number, w = 2) {
  return String(n).padStart(w, "0");
}

async function fetchJson<T>(url: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const err = new Error(`GitHub request failed: ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

async function fetchGitHubOrgRepos() {
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const pageRepos = await fetchJson<GitHubRepo[]>(
      `${GITHUB_API_BASE}/orgs/${ORG_LOGIN}/repos?type=public&sort=pushed&per_page=100&page=${page}`,
    );

    repos.push(...pageRepos);
    if (pageRepos.length < 100) break;
    page += 1;
  }

  return repos;
}

async function fetchRepoContributors(repo: string) {
  return fetchJson<GitHubContributor[]>(
    `${GITHUB_API_BASE}/repos/${ORG_LOGIN}/${repo}/contributors?per_page=100`,
  );
}

async function fetchRepoCommits(repo: GitHubRepo) {
  const commits = await fetchJson<GitHubCommit[]>(
    `${GITHUB_API_BASE}/repos/${ORG_LOGIN}/${repo.name}/commits?sha=${repo.default_branch}&per_page=5`,
  );

  return commits.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message.split("\n")[0] || "Commit",
    date: commit.commit.author?.date ?? new Date(0).toISOString(),
    repo: repo.name,
    repoUrl: repo.html_url,
    url: commit.html_url,
    author: commit.author?.login ?? commit.commit.author?.name ?? "unknown",
    authorUrl: commit.author?.html_url ?? null,
    branch: repo.default_branch,
  }));
}

// Cache file path and helper functions for persistence
const CACHE_FILE_PATH = path.join(process.cwd(), ".next", "github-cache.json");

async function writeCacheToFile(data: any) {
  try {
    await fs.mkdir(path.dirname(CACHE_FILE_PATH), { recursive: true });
    await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write GitHub cache file:", err);
  }
}

async function readCacheFromFile() {
  try {
    const content = await fs.readFile(CACHE_FILE_PATH, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

let cachedData: {
  timestamp?: number;
  projects: Project[];
  contributors: Contributor[];
  commits: RecentCommit[];
} | null = null;

const CACHE_DURATION = 15 * 60 * 1000;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  if (!cachedData) {
    cachedData = await readCacheFromFile();
  }

  const now = Date.now();
  const isFresh = cachedData && cachedData.timestamp && (now - cachedData.timestamp < CACHE_DURATION);

  if (isFresh && !forceRefresh) {
    return NextResponse.json(cachedData, {
      headers: {
        "Cache-Control": "public, max-age=900, must-revalidate",
        "X-Cache-Status": "HIT_FRESH",
      },
    });
  }

  try {
    const repos = await fetchGitHubOrgRepos();
    const [contributorsByRepo, commitsByRepo] = await Promise.all([
      Promise.all(
        repos.map(async (repo) => {
          try {
            return [repo.name, await fetchRepoContributors(repo.name)] as const;
          } catch (err: any) {
            // Propagate rate limits (403/429) or server errors (>=500) to trigger fallback cache
            if (err?.status === 403 || err?.status === 429 || err?.status >= 500) {
              throw err;
            }
            return [repo.name, []] as const;
          }
        }),
      ),
      Promise.all(
        repos.map(async (repo) => {
          try {
            return await fetchRepoCommits(repo);
          } catch (err: any) {
            if (err?.status === 403 || err?.status === 429 || err?.status >= 500) {
              throw err;
            }
            return [];
          }
        }),
      ),
    ]);

    const contributorTotals = new Map<
      string,
      Contributor & { contributions: number }
    >();
    const contributorCounts = new Map<string, number>();

    contributorsByRepo.forEach(([repoName, repoContributors]) => {
      contributorCounts.set(repoName, repoContributors.length);

      repoContributors.forEach((contributor) => {
        if (!contributor.login || contributor.type === "Bot") return;

        const current = contributorTotals.get(contributor.login);
        contributorTotals.set(contributor.login, {
          handle: contributor.login,
          role: `${pluralize(
            (current?.contributions ?? 0) + contributor.contributions,
            "contribution",
          )}`,
          avatar: contributor.avatar_url,
          url: contributor.html_url,
          contributions:
            (current?.contributions ?? 0) + contributor.contributions,
        });
      });
    });

    const projects = repos.map((repo, index) => ({
      no: pad(index + 1),
      name: repo.name,
      desc:
        repo.description ||
        "Public repository under the Opensource@NITJ organization.",
      tag: repo.language || "Mixed",
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      contributors: contributorCounts.get(repo.name) ?? 0,
      url: repo.html_url,
    }));

    const contributors = Array.from(contributorTotals.values())
      .sort((a, b) => b.contributions - a.contributions)
      .map(({ handle, role, avatar, url }) => ({ handle, role, avatar, url }));

    const commits = commitsByRepo
      .flat()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);

    cachedData = {
      timestamp: Date.now(),
      projects,
      contributors,
      commits,
    };
    
    writeCacheToFile(cachedData);

    return NextResponse.json(cachedData, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "X-Cache-Status": "MISS",
      },
    });
  } catch (error: any) {
    if (cachedData) {
      const status = error?.status || "unknown";
      const message = error?.message || String(error);
      console.warn(`[GitHub API] Request failed (Status: ${status}, Message: ${message}). Serving stale cache.`);
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          "X-Cache-Status": "STALE",
        },
      });
    }

    const message =
      error instanceof Error ? error.message : "Unable to load GitHub data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
