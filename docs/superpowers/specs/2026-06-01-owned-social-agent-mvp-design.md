# Owned Social Agent MVP Design

## Goal

Build an owned, production-grade social content agent inspired by Blotato's workflow, without depending on Blotato as the publishing engine. The current static Social Content Studio is a prototype for the product shape, but the production version should be rebuilt as a full-stack application.

The first product should help small businesses, local businesses, creators, and agencies turn a campaign topic or source into platform-specific content, review it, schedule it, and publish it directly to connected accounts.

## Product Scope

The MVP supports:

- Multi-brand workspaces.
- Brand memory for voice, audience, offers, locations, compliance rules, and banned phrases.
- Campaign briefs and source-based generation.
- AI-generated posts tailored per platform.
- Review, approval, revision, and scheduling.
- Hybrid approval/autopilot rules.
- Calendar and publishing queue.
- Direct platform integrations for:
  - Facebook Pages.
  - Instagram professional accounts.
  - Google Business Profile updates.
  - TikTok.
  - LinkedIn pages/profiles.
- Publish logs, retries, and failure alerts.

The MVP does not try to match every advanced Blotato-like feature immediately. It should defer long-form video clipping, deep analytics, complex team permissions, and full automation-builder features until the core content-to-publish loop works reliably.

## Publishing Modes

The product uses Hybrid Mode by default.

- Review Mode: the agent drafts content and waits for approval before scheduling or publishing.
- Autopilot Mode: the agent generates, schedules, and publishes when the brand rules allow it.
- Hybrid Mode: low-risk content can publish automatically, while sensitive or high-impact content requires approval.

Approval rules can be configured by brand, campaign, platform, content type, and risk trigger.

Example defaults:

- Google Business Profile updates for routine promotions can autopublish.
- Facebook and Instagram posts can autopublish only after the campaign has approved examples.
- LinkedIn thought-leadership posts require approval by default.
- TikTok posts require approval until media and captions have been reviewed.
- Posts mentioning prices, legal claims, medical claims, political topics, competitors, guarantees, or regulated services require approval.

## Architecture

Use a full-stack web application instead of extending the static prototype.

The current static app should be preserved as the prototype/legacy demo. The production app should be added beside it rather than overwriting `index.html`, `styles.css`, and `app.js`. This keeps the existing demo available while the real product is rebuilt with backend services, persistence, auth, and integrations.

Recommended stack:

- Next.js for the dashboard, agent workspace, calendar, and API routes.
- Postgres for persistent application data.
- Object storage for uploaded and generated media.
- Background jobs for scheduling, publishing, retries, media processing, and periodic checks.
- OAuth integrations for platform account connections.
- AI provider integration for content generation, revision, content critique, and brand memory extraction.

Core services:

- Agent Service: turns briefs and sources into structured content plans.
- Brand Memory Service: stores and retrieves brand voice, audience, offers, rules, examples, and blocked claims.
- Content Service: manages drafts, variants, approvals, revisions, and generated assets.
- Calendar Service: manages scheduled slots, timezone handling, and queue state.
- Publishing Service: normalizes platform-specific posting APIs behind a common internal interface.
- Integration Service: handles OAuth tokens, refresh, account discovery, permission checks, and platform constraints.
- Policy Service: decides whether a post can autopublish or needs human approval.
- Audit Service: records agent actions, approvals, publish attempts, API responses, and failures.

## Data Model

Primary entities:

- User: authenticated person using the product.
- Workspace: billing and ownership boundary.
- Brand: business, creator, or client profile.
- BrandMemory: voice, audience, offers, locations, examples, rules, and restrictions.
- SocialAccount: connected external account with platform metadata.
- Campaign: topic, goal, source material, target platforms, dates, and status.
- ContentDraft: generated post content with platform, caption, media, hashtags, status, and risk score.
- MediaAsset: uploaded or generated image/video files.
- ApprovalRule: policy that determines review versus autopilot behavior.
- ScheduleSlot: target publishing time and timezone.
- PublishJob: background job that attempts to publish a draft.
- PublishLog: immutable record of publish attempts, API responses, retries, and final status.

## Agent Workflow

1. User creates or selects a brand.
2. User enters a campaign topic, offer, source URL/text, or uploaded material.
3. Agent reads brand memory and campaign goal.
4. Agent creates a content plan for selected platforms.
5. Agent generates platform-specific drafts.
6. Agent critiques drafts against brand rules and platform constraints.
7. Policy Service marks each draft as approval required or autopublish eligible.
8. User approves, edits, or asks the agent to revise.
9. Calendar Service schedules approved or autopilot-eligible drafts.
10. Publishing Service dispatches jobs at the correct time.
11. Publish logs and failures are shown in the dashboard.

## Platform Integration Notes

Facebook Pages:

- Use Meta Graph API for Page publishing.
- Requires Meta app setup, OAuth, page permissions, app review, and likely business verification.
- Support text, link, photo, and video publishing in phases.

Instagram:

- Use Instagram Graph API content publishing for professional accounts.
- Requires linked account setup, approved permissions, and media-container publishing flow.
- Start with image posts and reels only after media workflow is stable.

Google Business Profile:

- Use Google Business Profile LocalPosts API to create location updates.
- Requires Google OAuth and `business.manage` scope.
- Strong fit for local business MVP because updates map cleanly to offers, events, and announcements.

TikTok:

- Use TikTok Content Posting API.
- Account review, media constraints, and user-facing posting flows must be handled carefully.
- Start with upload/direct-post support after the media pipeline and approval flow are reliable.

LinkedIn:

- Use LinkedIn Posts API.
- Supports organic text, image, video, document, article, multi-image, and poll posts depending on permissions and author type.
- Start with organization posts and simple member posts if app access allows it.

## User Experience

Main screens:

- Brand setup and memory.
- Agent campaign builder.
- Draft review board.
- Calendar and publishing queue.
- Connected accounts.
- Publish logs and alerts.
- Settings for approval/autopilot rules.

The first screen after login should be the working agent dashboard, not a marketing page.

The agent UI should make the workflow obvious:

- Input: topic, source, offer, campaign goal.
- Output: platform-specific drafts.
- Decision: approve, revise, schedule, or autopilot.
- Confidence: show why something needs approval.
- Accountability: show what the agent did and what happened when publishing ran.

## Error Handling

The system should treat publishing as unreliable external work and design for recovery.

Handle:

- Expired OAuth tokens.
- Missing platform permissions.
- Platform rate limits.
- Media validation failures.
- API review or account restrictions.
- Scheduled jobs that fail.
- Partial success when some platforms publish and others fail.

Every publish attempt must produce a PublishLog entry. Failed posts should move into a visible needs-attention state with retry options.

## Testing And Verification

Required test coverage:

- Unit tests for policy decisions and platform payload builders.
- Integration tests for agent workflow state transitions.
- Mocked API tests for each platform connector.
- Background job tests for scheduling, retries, and idempotency.
- End-to-end tests for campaign creation, approval, scheduling, and publish-log display.

Manual verification before public launch:

- OAuth connection flow per platform.
- Sandbox/test account publishing where supported.
- Expired token recovery.
- Failed media upload recovery.
- Timezone scheduling accuracy.
- Approval versus autopilot behavior.

## Phased Build

Phase 1: Production Foundation

- Rebuild as a full-stack app.
- Add auth, database, workspaces, brands, brand memory, campaign briefs, draft generation, review board, calendar, and manual export.

Phase 2: Publishing Engine

- Add job queue, publish jobs, publish logs, retries, failure states, and the shared connector interface.

Phase 3: First Direct Integrations

- Add Google Business Profile, LinkedIn, and Facebook Pages first.
- Add Instagram after Meta account and media requirements are stable.
- Add TikTok after the video/media pipeline and approval flow are ready.

Phase 4: Visual Engine

- Add image cards, carousels, thumbnails, and reusable templates.
- Add video and reels generation later.

Phase 5: Autopilot Agent

- Expand hybrid rules.
- Add recurring campaigns.
- Add performance-informed recommendations.
- Add emergency pause and stricter audit controls.

## Open Decisions

- Which AI provider and model family to use for generation.
- Which auth provider to use.
- Which Postgres host and object storage provider to use.
- Whether the initial rebuild should happen inside this folder as a new app directory or in a new repository.
- Whether to initialize git in this folder before implementation planning.

## Implementation Plans

- [Owned Social Agent Foundation](../plans/2026-06-01-owned-social-agent-foundation.md)
