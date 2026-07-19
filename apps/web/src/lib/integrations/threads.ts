import { z } from "zod";

export const THREADS_DEFAULT_GRAPH_VERSION = "v1.0";
export const THREADS_SCOPES = ["threads_basic", "threads_content_publish"];
export const THREADS_CALLBACK_PATH = "/api/integrations/threads/callback";

type ThreadsOAuthUrlInput = {
  appId: string;
  redirectUri: string;
  state: string;
  scopes?: string[];
};

type ThreadsTokenExchangeInput = {
  code: string;
  appId: string;
  appSecret: string;
  redirectUri: string;
  fetcher?: typeof fetch;
};

const threadsShortLivedTokenSchema = z.object({
  access_token: z.string().min(1),
  user_id: z.string()
});

const threadsLongLivedTokenSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().optional(),
  expires_in: z.number().optional()
});

const threadsProfileSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  name: z.string().optional()
});

const threadsContainerSchema = z.object({
  id: z.string()
});

const threadsPublishedPostSchema = z.object({
  id: z.string()
});

export type ThreadsProfile = z.infer<typeof threadsProfileSchema>;
export type ThreadsPublishedPost = z.infer<typeof threadsPublishedPostSchema>;

export function getThreadsAppId() {
  return process.env.THREADS_APP_ID?.trim() || process.env.META_APP_ID?.trim();
}

export function getThreadsAppSecret() {
  return process.env.THREADS_APP_SECRET?.trim() || process.env.META_APP_SECRET?.trim();
}

export function getThreadsRedirectUri(request: Request | URL) {
  const configuredRedirectUri = process.env.THREADS_REDIRECT_URI?.trim();
  if (configuredRedirectUri) {
    return configuredRedirectUri;
  }

  const requestUrl = request instanceof URL ? request : new URL(request.url);
  const forwardedHost = request instanceof Request ? request.headers.get("x-forwarded-host") : undefined;
  const host = forwardedHost ?? (request instanceof Request ? request.headers.get("host") : undefined);
  const forwardedProto = request instanceof Request ? request.headers.get("x-forwarded-proto") : undefined;
  const origin = host ? `${forwardedProto ?? "https"}://${host}` : requestUrl.origin;

  return new URL(THREADS_CALLBACK_PATH, origin).toString();
}

export function buildThreadsOAuthUrl(input: ThreadsOAuthUrlInput) {
  const url = new URL("https://threads.com/oauth/authorize");
  url.searchParams.set("client_id", input.appId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", (input.scopes ?? THREADS_SCOPES).join(","));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", input.state);
  return url;
}

export async function exchangeThreadsCode(input: ThreadsTokenExchangeInput) {
  const fetcher = input.fetcher ?? fetch;
  const response = await fetcher("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: input.appId,
      client_secret: input.appSecret,
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri,
      code: input.code
    })
  });

  if (!response.ok) {
    throw new Error(`Threads OAuth token exchange failed: ${response.status} ${await response.text()}`);
  }

  return threadsShortLivedTokenSchema.parse(await response.json());
}

export async function exchangeForLongLivedThreadsToken(input: {
  accessToken: string;
  appSecret: string;
  fetcher?: typeof fetch;
}) {
  const fetcher = input.fetcher ?? fetch;
  const url = new URL("https://graph.threads.net/access_token");
  url.searchParams.set("grant_type", "th_exchange_token");
  url.searchParams.set("client_secret", input.appSecret);
  url.searchParams.set("access_token", input.accessToken);

  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Threads long-lived token exchange failed: ${response.status} ${await response.text()}`);
  }

  return threadsLongLivedTokenSchema.parse(await response.json());
}

export async function fetchThreadsProfile(input: {
  userId: string;
  accessToken: string;
  graphVersion?: string;
  fetcher?: typeof fetch;
}): Promise<ThreadsProfile> {
  const fetcher = input.fetcher ?? fetch;
  const graphVersion = input.graphVersion ?? process.env.THREADS_GRAPH_VERSION ?? THREADS_DEFAULT_GRAPH_VERSION;
  const url = new URL(`https://graph.threads.net/${graphVersion}/${input.userId}`);
  url.searchParams.set("fields", "id,username,name");
  url.searchParams.set("access_token", input.accessToken);

  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Threads profile lookup failed: ${response.status} ${await response.text()}`);
  }

  return threadsProfileSchema.parse(await response.json());
}

export async function createThreadsTextPost(input: {
  userId: string;
  accessToken: string;
  text: string;
  graphVersion?: string;
  fetcher?: typeof fetch;
}): Promise<ThreadsPublishedPost> {
  const fetcher = input.fetcher ?? fetch;
  const graphVersion = input.graphVersion ?? process.env.THREADS_GRAPH_VERSION ?? THREADS_DEFAULT_GRAPH_VERSION;
  const createResponse = await fetcher(`https://graph.threads.net/${graphVersion}/${input.userId}/threads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      media_type: "TEXT",
      text: input.text,
      access_token: input.accessToken
    })
  });

  if (!createResponse.ok) {
    throw new Error(`Threads post container creation failed: ${createResponse.status} ${await createResponse.text()}`);
  }

  const container = threadsContainerSchema.parse(await createResponse.json());
  const publishResponse = await fetcher(`https://graph.threads.net/${graphVersion}/${input.userId}/threads_publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      creation_id: container.id,
      access_token: input.accessToken
    })
  });

  if (!publishResponse.ok) {
    throw new Error(`Threads post publish failed: ${publishResponse.status} ${await publishResponse.text()}`);
  }

  return threadsPublishedPostSchema.parse(await publishResponse.json());
}
