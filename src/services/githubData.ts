import {
  PortfolioData,
  GitHubPortfolioFile,
  portfolioData as bundledPortfolioData,
  defaultPersonalInfo,
  defaultEducation,
} from "../data/portfolioData";

export const GITHUB_OWNER = "Arunamjain";
export const GITHUB_REPO = "Auroro";
export const GITHUB_FILE_PATH = "data.json";
export const GITHUB_CONTENTS_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
export const GITHUB_REPO_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

const SESSION_TOKEN_KEY = "aurora_github_pat";

export type DataSourceStatus = "github" | "github-empty" | "fallback";

export interface FetchPortfolioResult {
  data: PortfolioData;
  source: DataSourceStatus;
  sha: string | null;
  message: string;
}

export interface TokenValidationResult {
  valid: boolean;
  repoFullName?: string;
  defaultBranch?: string;
  error?: string;
}

export interface SavePortfolioResult {
  sha: string | null;
  commitSha?: string;
  commitUrl?: string;
}

// --- sessionStorage-only token helpers ---
export function getSessionToken(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): void {
  try {
    window.sessionStorage.setItem(SESSION_TOKEN_KEY, token.trim());
  } catch {
    // Ignore storage quota errors in restricted sandboxes
  }
}

export function clearSessionToken(): void {
  try {
    window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // Ignore storage errors
  }
}

// --- UTF-8-safe Base64 encoding / decoding ---
export function decodeBase64Utf8(base64Content: string): string {
  const cleaned = base64Content.replace(/\s/g, "");
  const binaryStr = window.atob(cleaned);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

export function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binaryStr = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binaryStr += String.fromCharCode(...chunk);
  }
  return window.btoa(binaryStr);
}

// --- Schema adapters ---
export function githubFileToPortfolio(
  file: Partial<GitHubPortfolioFile> | null | undefined,
  treatMissingAsEmpty = false
): PortfolioData {
  const base = bundledPortfolioData;
  if (!file) {
    if (treatMissingAsEmpty) {
      return {
        personalInfo: { ...defaultPersonalInfo },
        skills: [],
        projects: [],
        certifications: [],
        experience: [],
        education: defaultEducation,
      };
    }
    return structuredClone(base);
  }

  return {
    personalInfo: {
      ...defaultPersonalInfo,
      ...(file.personalInfo && typeof file.personalInfo === "object" ? file.personalInfo : {}),
    },
    skills: Array.isArray(file.skills) ? file.skills : treatMissingAsEmpty ? [] : base.skills,
    projects: Array.isArray(file.projects) ? file.projects : treatMissingAsEmpty ? [] : base.projects,
    certifications: Array.isArray(file.certificates)
      ? file.certificates
      : treatMissingAsEmpty
      ? []
      : base.certifications,
    experience: Array.isArray(file.experiences)
      ? file.experiences
      : treatMissingAsEmpty
      ? []
      : base.experience,
    education: defaultEducation,
  };
}

export function portfolioToGitHubFile(portfolio: PortfolioData): GitHubPortfolioFile {
  return {
    skills: portfolio.skills || [],
    projects: portfolio.projects || [],
    certificates: portfolio.certifications || [],
    experiences: portfolio.experience || [],
    personalInfo: {
      ...defaultPersonalInfo,
      ...(portfolio.personalInfo || {}),
    },
  };
}

// --- Runtime loader from GitHub Contents API ---
export async function fetchPortfolioFromGitHub(token?: string | null): Promise<FetchPortfolioResult> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token && token.trim()) {
    headers["Authorization"] = `Bearer ${token.trim()}`;
  }

  try {
    const res = await fetch(GITHUB_CONTENTS_URL, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (res.status === 404) {
      return {
        data: structuredClone(bundledPortfolioData),
        source: "github-empty",
        sha: null,
        message: "GitHub data.json not yet created (404) — displaying bundled data.json until published.",
      };
    }

    if (!res.ok) {
      throw new Error(`GitHub Contents API returned HTTP ${res.status}`);
    }

    const payload = await res.json();
    if (!payload || typeof payload.content !== "string") {
      throw new Error("GitHub Contents API response did not include base64 content.");
    }

    const decoded = decodeBase64Utf8(payload.content);
    const parsed = JSON.parse(decoded) as Partial<GitHubPortfolioFile>;

    return {
      data: githubFileToPortfolio(parsed, true),
      source: "github",
      sha: typeof payload.sha === "string" ? payload.sha : null,
      message: "Loaded live data.json from GitHub Contents API.",
    };
  } catch (err: any) {
    console.warn("[GITHUB_DATA] Runtime fetch failed, activating bundled fallback:", err?.message || err);
    return {
      data: structuredClone(bundledPortfolioData),
      source: "fallback",
      sha: null,
      message: `GitHub fetch unavailable (${err?.message || "network error"}) — using bundled copy.`,
    };
  }
}

// --- Live Token Validation against GitHub Repository API ---
export async function validateGitHubToken(rawToken: string): Promise<TokenValidationResult> {
  const token = rawToken.trim();
  if (!token) {
    return { valid: false, error: "Please enter a GitHub fine-grained Personal Access Token." };
  }

  try {
    const res = await fetch(GITHUB_REPO_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });

    if (res.status === 401) {
      return {
        valid: false,
        error: "Token rejected by GitHub (401 Unauthorized). Check that the token is valid and not expired.",
      };
    }

    if (res.status === 403) {
      return {
        valid: false,
        error: `Access forbidden (403). Ensure this token has repository access to ${GITHUB_OWNER}/${GITHUB_REPO}.`,
      };
    }

    if (res.status === 404) {
      return {
        valid: false,
        error: `Repository ${GITHUB_OWNER}/${GITHUB_REPO} not accessible with this token (404). Verify repository selection on the fine-grained token.`,
      };
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return {
        valid: false,
        error: errBody?.message || `GitHub validation failed with HTTP ${res.status}.`,
      };
    }

    const repoData = await res.json();

    // Fine-grained tokens scoped to repository contents return push: true when Contents: Read and Write is enabled
    if (repoData.permissions && repoData.permissions.push === false) {
      return {
        valid: false,
        error: `Token only has read access to ${GITHUB_OWNER}/${GITHUB_REPO}. Grant "Contents: Read and write" permission to save changes.`,
      };
    }

    return {
      valid: true,
      repoFullName: repoData.full_name || `${GITHUB_OWNER}/${GITHUB_REPO}`,
      defaultBranch: repoData.default_branch || "main",
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Unable to reach GitHub API for validation: ${err?.message || "Network error"}.`,
    };
  }
}

// --- Atomic Save Pipeline: GET sha (skip if 404) -> PUT base64 content ---
export async function savePortfolioToGitHub(
  portfolio: PortfolioData,
  rawToken: string,
  commitMessage?: string
): Promise<SavePortfolioResult> {
  const token = rawToken.trim();
  if (!token) {
    throw new Error("Missing GitHub token. Please authenticate with a fine-grained token.");
  }

  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Step 1: GET current file metadata for its latest SHA (skip SHA if 404)
  let currentSha: string | undefined;
  const getRes = await fetch(GITHUB_CONTENTS_URL, {
    method: "GET",
    headers: authHeaders,
    cache: "no-store",
  });

  if (getRes.status === 200) {
    const existing = await getRes.json();
    if (typeof existing?.sha === "string") {
      currentSha = existing.sha;
    }
  } else if (getRes.status === 404) {
    // File does not exist yet on GitHub; omit sha so PUT creates data.json
    currentSha = undefined;
  } else if (getRes.status === 401) {
    throw new Error("GitHub token unauthorized (401). Please re-enter a valid fine-grained token.");
  } else if (getRes.status === 403) {
    throw new Error("Permission denied (403) reading data.json. Ensure token grants Contents: Read and write.");
  } else {
    const errJson = await getRes.json().catch(() => ({}));
    throw new Error(errJson?.message || `Failed to inspect existing data.json (HTTP ${getRes.status}).`);
  }

  // Step 2: Serialize and encode updated data.json as UTF-8 Base64
  const filePayload = portfolioToGitHubFile(portfolio);
  const formattedJson = JSON.stringify(filePayload, null, 2) + "\n";
  const base64Content = encodeBase64Utf8(formattedJson);

  const finalMessage =
    commitMessage && commitMessage.trim()
      ? commitMessage.trim()
      : `chore(portfolio): update data.json via Aurora admin (${new Date().toISOString()})`;

  const putBody: Record<string, string> = {
    message: finalMessage,
    content: base64Content,
  };
  if (currentSha) {
    putBody.sha = currentSha;
  }

  // Step 3: PUT updated content to GitHub Contents API
  const putRes = await fetch(GITHUB_CONTENTS_URL, {
    method: "PUT",
    headers: {
      ...authHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(putBody),
  });

  if (!putRes.ok) {
    const errJson = await putRes.json().catch(() => ({}));
    if (putRes.status === 401) {
      throw new Error("GitHub token expired or invalid (401). Please re-authenticate.");
    }
    if (putRes.status === 403) {
      throw new Error("Write access denied (403). Confirm your fine-grained token has 'Contents: Read and write' on Arunamjain/Auroro.");
    }
    if (putRes.status === 409) {
      throw new Error("File conflict (409): data.json was modified elsewhere. Click Save to GitHub again to retry with the latest SHA.");
    }
    if (putRes.status === 422) {
      throw new Error(`GitHub rejected the update (422): ${errJson?.message || "Invalid content or SHA."}`);
    }
    throw new Error(errJson?.message || `Failed to commit data.json to GitHub (HTTP ${putRes.status}).`);
  }

  const putData = await putRes.json();
  return {
    sha: putData?.content?.sha || null,
    commitSha: putData?.commit?.sha,
    commitUrl: putData?.commit?.html_url,
  };
}
