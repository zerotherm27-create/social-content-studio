import { z } from "zod";

export const META_DEFAULT_GRAPH_VERSION = "v23.0";
export const META_PAGE_CONNECT_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management"
];
export const META_PAGE_READ_SCOPES = [...META_PAGE_CONNECT_SCOPES];
export const META_CALLBACK_PATH = "/api/integrations/meta/callback";

type OAuthUrlInput = {
  appId: string;
  redirectUri: string;
  state: string;
  scopes?: string[];
  graphVersion?: string;
};

type TokenExchangeInput = {
  code: string;
  appId: string;
  appSecret: string;
  redirectUri: string;
  graphVersion?: string;
  fetcher?: typeof fetch;
};

type MetaToken = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

export type MetaPage = {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  tasks?: string[];
};

export type MetaPagePost = {
  id: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  shares?: { count?: number };
  comments?: { summary?: { total_count?: number } };
  reactions?: { summary?: { total_count?: number } };
};

export type PublishedMetaPagePost = {
  id: string;
  post_id?: string;
};

export type InstagramBusinessAccount = {
  id: string;
  username?: string;
  name?: string;
};

export type PublishedInstagramMedia = {
  id: string;
};

export class MetaPagePostsPermissionError extends Error {
  constructor() {
    super(
      "Facebook has not granted this app access to read Page posts. Your Page is still connected, but post-based learning requires Meta approval. You can keep using Website learning and the Brand DNA fields in the meantime."
    );
    this.name = "MetaPagePostsPermissionError";
  }
}

const tokenSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().optional(),
  expires_in: z.number().optional()
});

const pagesSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      access_token: z.string(),
      category: z.string().optional(),
      tasks: z.array(z.string()).optional()
    })
  )
});

const postsSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      message: z.string().optional(),
      created_time: z.string().optional(),
      permalink_url: z.string().optional(),
      shares: z.object({ count: z.number().optional() }).optional(),
      comments: z.object({ summary: z.object({ total_count: z.number().optional() }).optional() }).optional(),
      reactions: z.object({ summary: z.object({ total_count: z.number().optional() }).optional() }).optional()
    })
  )
});

const publishedPagePostSchema = z.object({
  id: z.string(),
  post_id: z.string().optional()
});

const instagramBusinessAccountSchema = z.object({
  instagram_business_account: z.object({
    id: z.string(),
    username: z.string().optional(),
    name: z.string().optional()
  }).optional()
});

const instagramContainerSchema = z.object({
  id: z.string()
});

const instagramPublishedMediaSchema = z.object({
  id: z.string()
});

export function buildMetaOAuthUrl(input: OAuthUrlInput) {
  const graphVersion = input.graphVersion ?? process.env.META_GRAPH_VERSION ?? META_DEFAULT_GRAPH_VERSION;
  const url = new URL(`https://www.facebook.com/${graphVersion}/dialog/oauth`);
  url.searchParams.set("client_id", input.appId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", (input.scopes ?? META_PAGE_READ_SCOPES).join(","));
  url.searchParams.set("auth_type", "rerequest");
  url.searchParams.set("state", input.state);
  return url;
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

function getRequestOrigin(request: Request | URL) {
  if (request instanceof URL) {
    return request.origin;
  }

  const fallbackUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (!host) {
    return fallbackUrl.origin;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const hostname = host.split(":")[0] ?? "";
  const protocol = forwardedProto ?? (isLocalHostname(hostname) ? "http" : "https");

  return `${protocol}://${host}`;
}

export function getMetaRedirectUri(request: Request | URL) {
  const configuredRedirectUri = process.env.META_REDIRECT_URI?.trim();
  const requestOrigin = getRequestOrigin(request);
  const requestRedirectUri = new URL(META_CALLBACK_PATH, requestOrigin).toString();

  if (!configuredRedirectUri) {
    return requestRedirectUri;
  }

  try {
    const configuredUrl = new URL(configuredRedirectUri);
    if (configuredUrl.origin === requestOrigin) {
      return configuredRedirectUri;
    }
  } catch {
    return requestRedirectUri;
  }

  return requestRedirectUri;
}

export async function exchangeMetaCode(input: TokenExchangeInput): Promise<MetaToken> {
  const fetcher = input.fetcher ?? fetch;
  const graphVersion = input.graphVersion ?? process.env.META_GRAPH_VERSION ?? META_DEFAULT_GRAPH_VERSION;
  const url = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
  url.searchParams.set("client_id", input.appId);
  url.searchParams.set("client_secret", input.appSecret);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("code", input.code);

  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Meta OAuth token exchange failed: ${response.status} ${await response.text()}`);
  }
  return tokenSchema.parse(await response.json());
}

export async function exchangeForLongLivedMetaToken(input: {
  accessToken: string;
  appId: string;
  appSecret: string;
  graphVersion?: string;
  fetcher?: typeof fetch;
}): Promise<MetaToken> {
  const fetcher = input.fetcher ?? fetch;
  const graphVersion = input.graphVersion ?? process.env.META_GRAPH_VERSION ?? META_DEFAULT_GRAPH_VERSION;
  const url = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", input.appId);
  url.searchParams.set("client_secret", input.appSecret);
  url.searchParams.set("fb_exchange_token", input.accessToken);

  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Meta long-lived token exchange failed: ${response.status} ${await response.text()}`);
  }
  return tokenSchema.parse(await response.json());
}

export async function fetchManagedMetaPages(input: {
  accessToken: string;
  graphVersion?: string;
  fetcher?: typeof fetch;
}): Promise<MetaPage[]> {
  const fetcher = input.fetcher ?? fetch;
  const graphVersion = input.graphVersion ?? process.env.META_GRAPH_VERSION ?? META_DEFAULT_GRAPH_VERSION;
  const fetchPages = async (edge: "accounts" | "assigned_pages") => {
    const url = new URL(`https://graph.facebook.com/${graphVersion}/me/${edge}`);
    url.searchParams.set("fields", "id,name,access_token,category,tasks");
    url.searchParams.set("access_token", input.accessToken);

    const response = await fetcher(url);
    if (!response.ok) {
      throw new Error(`Meta Page lookup failed: ${response.status} ${await response.text()}`);
    }
    return pagesSchema.parse(await response.json()).data;
  };

  const directlyManagedPages = await fetchPages("accounts");
  if (directlyManagedPages.length > 0) {
    return directlyManagedPages;
  }

  // Meta may omit task-based Page access from /me/accounts when the Page is
  // managed through a Business Portfolio. /me/assigned_pages exposes those
  // assignments while honoring the same granular Page permissions.
  return fetchPages("assigned_pages");
}

function normalizeMetaPageName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function selectBestMetaPageForBrand(
  pages: MetaPage[],
  brandName: string,
  existingDisplayName?: string | null,
  existingExternalId?: string | null
) {
  if (pages.length === 0) {
    return undefined;
  }

  const normalizedBrandName = normalizeMetaPageName(brandName);
  const normalizedExistingDisplayName = existingDisplayName ? normalizeMetaPageName(existingDisplayName) : "";
  const usableExistingDisplayName =
    normalizedExistingDisplayName &&
    !normalizedExistingDisplayName.startsWith("pending ") &&
    normalizedExistingDisplayName !== "facebook" &&
    normalizedExistingDisplayName !== "facebook pages";

  return (
    pages.find((page) => normalizeMetaPageName(page.name) === normalizedBrandName) ??
    pages.find((page) => normalizeMetaPageName(page.name).includes(normalizedBrandName)) ??
    pages.find((page) => normalizedBrandName.includes(normalizeMetaPageName(page.name))) ??
    (usableExistingDisplayName
      ? pages.find((page) => normalizeMetaPageName(page.name) === normalizedExistingDisplayName)
      : undefined) ??
    (existingExternalId ? pages.find((page) => page.id === existingExternalId) : undefined) ??
    pages[0]
  );
}

export async function fetchMetaPagePosts(input: {
  pageId: string;
  pageAccessToken: string;
  limit?: number;
  graphVersion?: string;
  fetcher?: typeof fetch;
}): Promise<MetaPagePost[]> {
  const fetcher = input.fetcher ?? fetch;
  const graphVersion = input.graphVersion ?? process.env.META_GRAPH_VERSION ?? META_DEFAULT_GRAPH_VERSION;
  // `/posts` can include visitor-created content and therefore requires
  // pages_read_user_content. Orbit only needs posts published by the managed
  // Page, so use the narrower edge that works with a Page access token.
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${input.pageId}/published_posts`);
  // Brand learning needs only content authored by the managed Page. Expanding
  // comments, reactions, or shares can make Meta classify the request as
  // user-content access and require pages_read_user_content/App Review.
  url.searchParams.set("fields", "id,message,created_time,permalink_url");
  url.searchParams.set("limit", String(input.limit ?? 20));
  url.searchParams.set("access_token", input.pageAccessToken);

  const response = await fetcher(url);
  if (!response.ok) {
    const responseText = await response.text();
    if (
      response.status === 403 ||
      /(?:"code"\s*:\s*10|pages_read_user_content|Page Public Content Access)/i.test(responseText)
    ) {
      throw new MetaPagePostsPermissionError();
    }
    throw new Error(`Facebook could not read this Page's published posts (status ${response.status}).`);
  }
  return postsSchema.parse(await response.json()).data;
}

export async function createMetaPagePost(input: {
  pageId: string;
  pageAccessToken: string;
  message: string;
  link?: string;
  graphVersion?: string;
  fetcher?: typeof fetch;
}): Promise<PublishedMetaPagePost> {
  const fetcher = input.fetcher ?? fetch;
  const graphVersion = input.graphVersion ?? process.env.META_GRAPH_VERSION ?? META_DEFAULT_GRAPH_VERSION;
  const response = await fetcher(`https://graph.facebook.com/${graphVersion}/${input.pageId}/feed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      message: input.message,
      ...(input.link ? { link: input.link } : {}),
      access_token: input.pageAccessToken
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Facebook Page post failed: ${response.status} ${message}`);
  }

  return publishedPagePostSchema.parse(await response.json());
}

export async function fetchInstagramBusinessAccount(input: {
  pageId: string;
  pageAccessToken: string;
  graphVersion?: string;
  fetcher?: typeof fetch;
}): Promise<InstagramBusinessAccount | undefined> {
  const fetcher = input.fetcher ?? fetch;
  const graphVersion = input.graphVersion ?? process.env.META_GRAPH_VERSION ?? META_DEFAULT_GRAPH_VERSION;
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${input.pageId}`);
  url.searchParams.set("fields", "instagram_business_account{id,username,name}");
  url.searchParams.set("access_token", input.pageAccessToken);

  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Instagram business account lookup failed: ${response.status} ${await response.text()}`);
  }

  return instagramBusinessAccountSchema.parse(await response.json()).instagram_business_account;
}

export async function createInstagramImagePost(input: {
  igUserId: string;
  pageAccessToken: string;
  imageUrl: string;
  caption: string;
  graphVersion?: string;
  fetcher?: typeof fetch;
}): Promise<PublishedInstagramMedia> {
  const fetcher = input.fetcher ?? fetch;
  const graphVersion = input.graphVersion ?? process.env.META_GRAPH_VERSION ?? META_DEFAULT_GRAPH_VERSION;
  const createContainerResponse = await fetcher(`https://graph.facebook.com/${graphVersion}/${input.igUserId}/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      image_url: input.imageUrl,
      caption: input.caption,
      access_token: input.pageAccessToken
    })
  });

  if (!createContainerResponse.ok) {
    throw new Error(`Instagram media container creation failed: ${createContainerResponse.status} ${await createContainerResponse.text()}`);
  }

  const container = instagramContainerSchema.parse(await createContainerResponse.json());
  const publishResponse = await fetcher(`https://graph.facebook.com/${graphVersion}/${input.igUserId}/media_publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      creation_id: container.id,
      access_token: input.pageAccessToken
    })
  });

  if (!publishResponse.ok) {
    throw new Error(`Instagram media publish failed: ${publishResponse.status} ${await publishResponse.text()}`);
  }

  return instagramPublishedMediaSchema.parse(await publishResponse.json());
}

export function summarizeMetaPosts(posts: MetaPagePost[]) {
  return posts
    .filter((post) => post.message)
    .map((post, index) => {
      const reactions = post.reactions?.summary?.total_count ?? 0;
      const comments = post.comments?.summary?.total_count ?? 0;
      const shares = post.shares?.count ?? 0;
      const hasEngagement =
        post.reactions?.summary?.total_count !== undefined ||
        post.comments?.summary?.total_count !== undefined ||
        post.shares?.count !== undefined;
      return [
        `Post ${index + 1}`,
        post.created_time ? `Created: ${post.created_time}` : "",
        hasEngagement ? `Engagement: ${reactions} reactions, ${comments} comments, ${shares} shares` : "",
        post.message
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n")
    .slice(0, 12000);
}
