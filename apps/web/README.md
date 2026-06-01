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

Copy `.env.example` to `.env` and set:

```bash
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5.4-mini"
```

`gpt-5.4-mini` is the default because OpenAI's model docs describe it as a strong mini model for lower-latency, high-volume work, and the Responses API supports structured outputs for schema-shaped JSON.
