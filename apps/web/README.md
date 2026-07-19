# Owned Social Agent Web

Production app foundation for the owned social content agent.

## Local Setup

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

The app runs at `http://127.0.0.1:3001`.

## AI Generation

Draft generation uses the OpenAI Responses API when `OPENAI_API_KEY` is set. Without a key, the app falls back to deterministic mock generation so local development still works.

Copy `.env.example` to `.env`, set `DATABASE_URL` to your Supabase Transaction Pooler connection string, and set:

```bash
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5.4-mini"
```

`gpt-5.4-mini` is the default because OpenAI's model docs describe it as a strong mini model for lower-latency, high-volume work, and the Responses API supports structured outputs for schema-shaped JSON.

## Google Business Profile

The Google Business Profile connector uses Google's OAuth consent flow with the `https://www.googleapis.com/auth/business.manage` scope. Configure these values before clicking the Google connector:

```bash
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://127.0.0.1:3001/api/integrations/google/callback"
```

OAuth tokens are stored in the configured Supabase Postgres database. Production should encrypt tokens before broad public launch.

## Meta Facebook Page

The Meta connector uses Facebook Login for Business, reads managed Pages from `/me/accounts`, and imports recent Page posts for Brand DNA learning. Configure a Meta Developer app with Facebook Login for Business and add this valid OAuth redirect URI:

```bash
http://127.0.0.1:3001/api/integrations/meta/callback
```

Set these values before clicking the Facebook connector:

```bash
META_APP_ID="..."
META_APP_SECRET="..."
META_REDIRECT_URI="http://127.0.0.1:3001/api/integrations/meta/callback"
META_GRAPH_VERSION="v23.0"
```

The connector requests `pages_show_list`, `pages_read_engagement`, and `business_management`. In development mode, connect with a Meta account that has a role on the Meta app and can manage the target Facebook Page.
