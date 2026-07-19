# Design System: Orbit Social Agent

## 1. Visual Theme & Atmosphere

Orbit feels like a calm creative operations studio: editorial enough for visual work, structured enough for approvals and publishing. It should not resemble a generic analytics dashboard or a chat app stretched across a screen.

- Density: Daily App Balanced, 6/10. Creation screens are spacious; queues and calendars are denser.
- Variance: Offset Asymmetric, 7/10. Use one dominant working canvas with a slimmer contextual rail instead of equal-width card grids.
- Motion: Fluid and purposeful, 5/10. Motion communicates generation, saving, approval, and publishing state.
- Product character: confident, warm, observant, and operational. The agent feels present through recommendations and state changes, not a mascot or glowing orb.
- Desktop canvas: maximum width 1600px. Persistent 232px navigation rail, flexible workspace, optional 320px context inspector.
- Mobile: single-column workspace with bottom navigation for Home, Ideas, Create, Calendar, and Brand.

## 2. Color Palette & Roles

- **Studio Canvas** (#F4F2EC) — warm neutral application background.
- **Paper Surface** (#FCFBF8) — primary work surfaces and editors.
- **Charcoal Ink** (#1C211D) — primary text and navigation background.
- **Moss Text** (#596159) — secondary copy and metadata.
- **Hairline** (#DDDCD5) — borders, separators, and table rules.
- **Signal Coral** (#E66A4E) — the only accent; primary actions, active states, selected ideas, and progress indicators.
- **Success Tint** (#DDE9DD) — quiet status background only; never used as a competing accent.
- **Warning Tint** (#F3E5CE) — approval-required background only.
- **Failure Tint** (#F1DAD5) — failed publish and destructive feedback only.

Never introduce purple, electric blue, neon effects, or multicolor gradients. Generated media supplies the visual color; the product chrome stays restrained.

## 3. Typography Rules

- **Display and UI:** Satoshi, with Geist Sans as fallback. Use tight tracking for headings and medium weight for controls.
- **Body:** Satoshi, 15–17px with relaxed 1.5 line height and a maximum readable width of 65 characters.
- **Metadata:** Geist Mono, 12–13px for timestamps, platform constraints, versions, and publishing states.
- **Scale:** 32–40px page title, 22–26px section title, 16–18px card title, 14–16px body, 12–13px metadata.
- Use sentence case everywhere. Avoid all-caps except small 11px eyebrow labels with generous tracking.
- Serif fonts and Inter are banned in the application UI.

## 4. Component Stylings

- **Navigation rail:** Charcoal Ink background, compact wordmark, brand switcher at the top, six text-and-icon destinations, usage and account controls at the bottom. Active destination uses a Paper Surface inset with dark text, not a glowing pill.
- **Primary buttons:** Signal Coral fill, 10px corners, 44px minimum height, no gradient or shadow. On press, translate down 1px. Secondary actions use Paper Surface with Hairline border.
- **Agent brief input:** A large paper-like composer, not a chat bubble. It includes source attachment, goal, channel selection, campaign constraints, and one clear “Build campaign” action.
- **Idea cards:** Media-first 4:5 previews with a narrow text footer. Cards may vary in width across a masonry-like editorial grid, but remain aligned to a strict CSS grid. Hover reveals Save, Skip, and Make variations. Never overlay body copy across imagery.
- **Campaign canvas:** Two-column asymmetric layout: 65% editable creative canvas, 35% agent inspector. The inspector contains rationale, brand checks, platform adaptations, and version history.
- **Draft variants:** Use a horizontal filmstrip below the main creative rather than multiple equal cards.
- **Status chips:** Compact rounded rectangles, not pills everywhere. Use neutral text and tinted semantic backgrounds. Include plain-language labels such as “Needs approval,” “Ready,” “Scheduled,” and “Published.”
- **Approval drawer:** Fixed contextual rail showing what changed, why review is required, and Approve / Request changes controls.
- **Calendar:** Week grid with media thumbnails and platform markers. Unscheduled ideas live in a collapsible left tray. Drag targets receive a subtle Coral inset border.
- **Analytics:** Editorial summaries first, charts second. Start with “What the agent learned” and concrete recommended actions. Avoid vanity-number card rows.
- **Inputs:** Labels above fields, 12px spacing, inline helper text, and error text below. Focus uses a 2px Signal Coral inner ring.
- **Loading:** Use skeletons shaped like the resulting creative and copy. During generation, show named steps such as “Reading offer,” “Checking brand rules,” and “Building variants.” No circular spinner.
- **Empty states:** Show a small composed sample of what will appear, paired with one action. Do not use empty dashboard cards.

## 5. Layout Principles

- Use a persistent three-zone shell only when context requires it: navigation, working canvas, inspector.
- Give every screen one dominant task. Do not show generator, drafts, calendar, publishing queue, and analytics on one long page.
- Avoid equal three-column card rows. Prefer an asymmetric 7/5 split, a media grid with mixed spans, or a structured list.
- Use 24px desktop gutters and 16px mobile gutters. Major section gaps are 32–48px; component gaps are 8–16px.
- Use 16px surface corners and 10px control corners. Avoid excessive 24–40px rounding.
- Elevation is rare. Use borders and negative space for most hierarchy; use one soft, background-tinted shadow only for floating drawers and menus.
- All multi-column layouts collapse below 768px. The inspector becomes a bottom sheet, and navigation becomes a five-item bottom bar plus a More menu.
- All tap targets are at least 44px. No horizontal page overflow on mobile.

## 6. Motion & Interaction

- Default spring: stiffness 100, damping 20.
- Animate transform and opacity only.
- New ideas enter with a 60ms stagger and a short upward fade.
- Saving an idea produces a restrained scale confirmation and moves it into the campaign tray.
- Generation progress animates along a thin Coral track while the named work step changes.
- Active publish jobs use a subtle moving dot along a timeline; completed jobs become static.
- The agent activity indicator may breathe gently while working, but no decorative perpetual animation should compete with content.
- Respect reduced-motion preferences and replace transforms with instant state changes.

## 7. Core Product Navigation

1. **Today** — agent briefing, pending approvals, publishing issues, and recommended next actions.
2. **Ideas** — daily swipe/save/skip discovery feed generated from Brand DNA and campaign goals.
3. **Create** — source-to-campaign composer and focused creative workspace.
4. **Campaigns** — grouped assets, versions, goals, and campaign status.
5. **Calendar** — scheduled content, queue health, and drag-to-schedule workflow.
6. **Insights** — performance interpretation and agent recommendations.
7. **Brand DNA** — voice, audience, offers, visual references, rules, and connected channels.

## 8. Anti-Patterns (Banned)

- No emojis as interface icons.
- No Inter, generic serif fonts, or pure black.
- No purple, blue neon, gradient buttons, or outer glows.
- No chatbot-first layout or giant conversational bubble as the main experience.
- No centered marketing hero inside the product.
- No three equal KPI cards or three equal feature cards.
- No excessive pills, floating glass cards, or every section inside a rounded container.
- No overlapping text and images.
- No fake performance numbers or unearned predictive metrics.
- No generic AI copy such as “Unleash,” “Elevate,” “Magic,” or “Next-gen.”
- No mascots, glowing agent orbs, or decorative robot imagery.
- No instant list mounting; use short staggered reveals.
- No inaccessible low-contrast gray text.

