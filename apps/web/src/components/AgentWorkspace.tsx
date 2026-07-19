"use client";

import type { Brand, Campaign, ContentDraft, ContentIdea } from "@prisma/client";
import { useRouter } from "next/navigation";
import { type CSSProperties, type FormEvent, useMemo, useState } from "react";
import { AgentComposer } from "@/components/AgentComposer";
import { ConnectedAccounts } from "@/components/ConnectedAccounts";
import { DraftBoard } from "@/components/DraftBoard";
import { Platform } from "@/lib/domain";

type BrandWorkspace = Brand & {
  drafts: ContentDraft[];
  socialAccounts: PublicSocialAccount[];
  ideas: ContentIdea[];
  campaigns: Campaign[];
};

export type PublicSocialAccount = {
  id: string;
  brandId: string;
  platform: string;
  displayName: string;
  externalId: string;
  connected: boolean;
  tokenStatus: string;
  accountName: string | null;
  locationName: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type BrandSummary = {
  id: string;
  name: string;
  initials: string;
  approvalMode: string;
  _count: {
    drafts: number;
    ideas: number;
  };
};

type View = "today" | "ideas" | "create" | "campaigns" | "calendar" | "insights" | "brand";

const navItems: Array<{ id: View; label: string }> = [
  { id: "today", label: "Today" },
  { id: "ideas", label: "Ideas" },
  { id: "create", label: "Create" },
  { id: "campaigns", label: "Campaigns" },
  { id: "calendar", label: "Calendar" },
  { id: "insights", label: "Insights" },
  { id: "brand", label: "Brand DNA" }
];

export function AgentWorkspace({ brand, brands }: { brand: BrandWorkspace; brands: BrandSummary[] }) {
  const router = useRouter();
  const [view, setView] = useState<View>("today");
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [campaignBrief, setCampaignBrief] = useState<{ title: string; goal: string; source: string; creativeDirection?: string } | null>(null);

  const pendingDrafts = brand.drafts.filter((draft) => draft.approvalStatus === "PENDING_REVIEW");
  const scheduledDrafts = brand.drafts.filter((draft) => draft.scheduledAt);
  const connectedCount = brand.socialAccounts.filter((account) => account.connected).length;
  const heading = useMemo(() => navItems.find((item) => item.id === view)?.label ?? "Today", [view]);

  function switchBrand(brandId: string) {
    router.push(`/?brandId=${encodeURIComponent(brandId)}`);
  }

  return (
    <main className="agentShell">
      <aside className="agentNav">
        <button className="brandSwitcher" type="button" onClick={() => setView("brand")}>
          <span className="brandMonogram">{brand.initials}</span>
          <span>
            <strong>{brand.name}</strong>
            <small>{formatStatus(brand.approvalMode)} approval</small>
          </span>
        </button>

        <section className="brandList" aria-label="Brands">
          <div>
            <span>Brands</span>
            <button type="button" onClick={() => setIsAddingBrand((value) => !value)}>
              {isAddingBrand ? "Close" : "Add"}
            </button>
          </div>
          {brands.map((item) => (
            <button
              className={item.id === brand.id ? "brandListItem active" : "brandListItem"}
              key={item.id}
              type="button"
              onClick={() => switchBrand(item.id)}
            >
              <span>{item.initials}</span>
              <strong>{item.name}</strong>
              <small>{item._count.drafts} drafts</small>
            </button>
          ))}
          {isAddingBrand ? <AddBrandPanel /> : null}
        </section>

        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              className={view === item.id ? "navItem active" : "navItem"}
              key={item.id}
              onClick={() => setView(item.id)}
              type="button"
            >
              {item.label}
              {item.id === "today" && pendingDrafts.length > 0 ? <span>{pendingDrafts.length}</span> : null}
            </button>
          ))}
        </nav>

        <div className="navFooter">
          <p>{connectedCount} of {brand.socialAccounts.length} channels connected</p>
          <button type="button" onClick={() => setView("brand")}>Manage brand</button>
        </div>
      </aside>

      <section className="agentMain">
        <header className="agentTopbar">
          <div>
            <p className="contextLabel">{brand.name} workspace</p>
            <h1>{heading}</h1>
          </div>
          <div className="topbarActions">
            <span className={pendingDrafts.length ? "agentState paused" : "agentState"}>
              {pendingDrafts.length ? `${pendingDrafts.length} awaiting review` : "Workspace ready"}
            </span>
            <button className="primaryAction" type="button" onClick={() => setView("create")}>Create</button>
          </div>
        </header>

        {view === "today" ? (
          <TodayView
            brand={brand}
            pendingDrafts={pendingDrafts}
            scheduledCount={scheduledDrafts.length}
            onNavigate={setView}
          />
        ) : null}

        {view === "ideas" ? (
          <IdeasView
            brandId={brand.id}
            brandName={brand.name}
            audience={brand.audience}
            initialIdeas={brand.ideas}
            onBuild={(idea) => {
              setCampaignBrief({
                title: idea.title,
                goal: idea.purpose,
                source: `${idea.hook}\n\n${idea.reason}`,
                creativeDirection: idea.imagePrompt
              });
              setView("create");
            }}
          />
        ) : null}

        {view === "create" ? (
          <CreateView brand={brand} initialBrief={campaignBrief} />
        ) : null}

        {view === "campaigns" ? (
          <CampaignsView campaigns={brand.campaigns} drafts={brand.drafts} onCreate={() => setView("create")} />
        ) : null}

        {view === "calendar" ? <CalendarView drafts={brand.drafts} /> : null}
        {view === "insights" ? <InsightsView brand={brand} /> : null}
        {view === "brand" ? <BrandView brand={brand} brandCount={brands.length} onAddBrand={() => setIsAddingBrand(true)} /> : null}
      </section>

      <nav className="mobileNav" aria-label="Mobile navigation">
        {navItems.slice(0, 5).map((item) => (
          <button className={view === item.id ? "active" : ""} key={item.id} onClick={() => setView(item.id)} type="button">
            {item.label}
          </button>
        ))}
      </nav>

      {isAddingBrand ? (
        <div className="mobileBrandAdd" role="dialog" aria-label="Add brand">
          <div>
            <button type="button" onClick={() => setIsAddingBrand(false)}>Close</button>
          </div>
          <AddBrandPanel />
        </div>
      ) : null}
    </main>
  );
}

function AddBrandPanel() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");

  async function createBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, websiteUrl })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not add brand.");
      router.push(`/?brandId=${encodeURIComponent(payload.brand.id)}`);
      router.refresh();
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Could not add brand.");
    }
  }

  return (
    <form className="addBrandPanel" onSubmit={createBrand}>
      <label>
        Brand name
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your brand name" />
      </label>
      <label>
        Website
        <input type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://example.com" />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <button disabled={status === "saving" || name.trim().length < 2} type="submit">
        {status === "saving" ? "Adding" : "Add brand"}
      </button>
    </form>
  );
}

function TodayView({
  brand,
  pendingDrafts,
  scheduledCount,
  onNavigate
}: {
  brand: BrandWorkspace;
  pendingDrafts: ContentDraft[];
  scheduledCount: number;
  onNavigate: (view: View) => void;
}) {
  const dateLabel = new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila"
  }).format(new Date());
  const connectedCount = brand.socialAccounts.filter((account) => account.connected).length;
  const brandFields = [brand.voice, brand.audience, brand.offers, brand.visualStyle].filter((value) => value.trim()).length;
  const priorities = [
    pendingDrafts.length
      ? {
          view: "campaigns" as View,
          title: `Review ${pendingDrafts.length} ${pendingDrafts.length === 1 ? "draft" : "drafts"}`,
          detail: "These drafts are waiting for approval before scheduling or publishing.",
          action: "Review"
        }
      : null,
    brand.ideas.length === 0
      ? {
          view: "ideas" as View,
          title: "Generate the first idea set",
          detail: "Ideas will be created from the current Brand DNA and saved offers.",
          action: "Generate"
        }
      : null,
    brand.campaigns.length === 0
      ? {
          view: "create" as View,
          title: "Create the first campaign",
          detail: "Start with an accurate offer, announcement, or customer need.",
          action: "Create"
        }
      : null,
    connectedCount === 0
      ? {
          view: "brand" as View,
          title: "Connect a publishing channel",
          detail: "Drafts work without a connection, but publishing requires an approved account.",
          action: "Connect"
        }
      : null,
    brandFields < 4
      ? {
          view: "brand" as View,
          title: "Complete Brand DNA",
          detail: `${brandFields} of 4 core context fields are ready. More context improves every output.`,
          action: "Complete"
        }
      : null,
    scheduledCount === 0 && brand.drafts.length > 0
      ? {
          view: "calendar" as View,
          title: "Schedule an approved draft",
          detail: "No posts have a publishing time yet.",
          action: "Schedule"
        }
      : null
  ].filter((item): item is NonNullable<typeof item> => Boolean(item)).slice(0, 3);

  const timeline = [
    ...brand.drafts
      .filter((draft) => draft.scheduledAt)
      .map((draft) => ({
        date: draft.scheduledAt as Date,
        title: draft.artHeadline || draft.caption.slice(0, 56),
        detail: `${formatPlatform(draft.platform)} · scheduled`,
        status: "Scheduled"
      })),
    ...pendingDrafts.map((draft) => ({
      date: draft.createdAt,
      title: draft.artHeadline || draft.caption.slice(0, 56),
      detail: `${formatPlatform(draft.platform)} · awaiting approval`,
      status: "Review"
    }))
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <div className="viewStack todayView">
      <section className="briefingHeader">
        <p className="contextLabel">{dateLabel}</p>
        <h2>{priorities.length ? "Here is what needs attention." : "Nothing is waiting on you."}</h2>
        <p>This view reflects live Brand DNA, campaigns, drafts, schedules, and account connections for {brand.name}.</p>
      </section>

      <div className="todayLayout">
        <div className="todayPrimary">
          <section className="priorityList" aria-labelledby="priorities-heading">
            <div className="sectionTitleRow">
              <div>
                <p className="contextLabel">Priorities</p>
                <h3 id="priorities-heading">{priorities.length ? "Next useful actions" : "All caught up"}</h3>
              </div>
              <button className="textAction" type="button" onClick={() => onNavigate("calendar")}>Open calendar</button>
            </div>
            {priorities.length ? priorities.map((priority, index) => (
              <button className="priorityItem" key={priority.title} type="button" onClick={() => onNavigate(priority.view)}>
                <span className="priorityNumber">{String(index + 1).padStart(2, "0")}</span>
                <span><strong>{priority.title}</strong><small>{priority.detail}</small></span>
                <span className="rowAction">{priority.action}</span>
              </button>
            )) : <p className="honestEmpty">New actions will appear here when a draft needs review, Brand DNA is incomplete, or a schedule changes.</p>}
          </section>

          <section className="planTimeline">
            <div className="sectionTitleRow">
              <div>
                <p className="contextLabel">Content queue</p>
                <h3>Actual draft activity</h3>
              </div>
              <span className="quietMeta">{scheduledCount} scheduled</span>
            </div>
            {timeline.length ? timeline.map((item, index) => (
              <div className={index === 0 ? "timelineItem current" : "timelineItem"} key={`${item.title}-${item.date.toISOString()}`}>
                <time>{formatShortDate(item.date)}</time>
                <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                <b>{item.status}</b>
              </div>
            )) : <p className="honestEmpty">No drafts or scheduled posts yet. Generate a campaign to create the first real queue.</p>}
          </section>
        </div>

        <aside className="activityRail">
          <div>
            <p className="contextLabel">Workspace status</p>
            <h3>{brandFields === 4 ? "Brand context is ready" : "Brand context needs work"}</h3>
            <p>These checks are calculated from saved data. Orbit does not publish anything without a connected account and the required approval state.</p>
          </div>
          <div className="agentSteps">
            <span><b>Brand DNA</b> {brandFields} of 4 core fields complete</span>
            <span><b>Channels</b> {connectedCount} connected</span>
            <span><b>Campaigns</b> {brand.campaigns.length} saved</span>
          </div>
          <button className="secondaryAction" type="button" onClick={() => onNavigate("brand")}>Review Brand DNA</button>
        </aside>
      </div>
    </div>
  );
}

function IdeasView({ brandId, brandName, audience, initialIdeas, onBuild }: { brandId: string; brandName: string; audience: string; initialIdeas: ContentIdea[]; onBuild: (idea: ContentIdea) => void }) {
  const [ideaList, setIdeaList] = useState(initialIdeas);
  const [selected, setSelected] = useState<ContentIdea | null>(initialIdeas[0] ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = useMemo(() => ["All", ...Array.from(new Set(ideaList.map((idea) => idea.purpose))).slice(0, 6)], [ideaList]);
  const filteredIdeas = activeFilter === "All" ? ideaList : ideaList.filter((idea) => idea.purpose === activeFilter);

  async function generateIdeas() {
    setIsGenerating(true);
    setError("");
    try {
      const response = await fetch(`/api/brands/${brandId}/ideas`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Idea generation failed.");
      setIdeaList(payload.ideas);
      setSelected(payload.ideas[0] ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Idea generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function updateStatus(idea: ContentIdea, status: "SAVED" | "SKIPPED" | "BUILT") {
    const response = await fetch(`/api/ideas/${idea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) return;
    const { idea: updated } = await response.json();
    setIdeaList((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected((current) => current?.id === updated.id ? updated : current);
    if (status === "BUILT") onBuild(updated);
  }

  return (
    <div className="viewStack ideasView">
      <section className="viewIntro">
        <h2>Ideas worth making</h2>
        <p>Fresh directions based on {brandName}&apos;s offers, audience, brand voice, and current content mix.</p>
        <div className="ideasToolbar">
          <div className="filterRow" aria-label="Idea filters">
            {filters.map((filter) => <button className={activeFilter === filter ? "active" : ""} type="button" key={filter} onClick={() => setActiveFilter(filter)}>{filter}</button>)}
          </div>
          <button className="primaryAction" disabled={isGenerating} type="button" onClick={generateIdeas}>{isGenerating ? "Building ideas" : ideaList.length ? "Refresh ideas" : "Generate ideas"}</button>
        </div>
        {error ? <p className="inlineError" role="alert">{error}</p> : null}
      </section>

      {ideaList.length === 0 ? (
        <section className="ideaEmpty"><div className="ideaEmptyVisual"><span>{brandName.slice(0, 2).toUpperCase()}</span><small>Brand DNA → ideas → art cards</small></div><div><p className="contextLabel">Ready when you are</p><h3>Build the first idea set</h3><p>Orbit will use the saved voice, audience, offers, and visual direction to propose six distinct concepts.</p><button className="primaryAction" disabled={isGenerating} type="button" onClick={generateIdeas}>{isGenerating ? "Reading Brand DNA" : "Generate ideas"}</button></div></section>
      ) : <div className="ideasLayout">
        <section className="ideaGrid" aria-label="Generated content ideas">
          {filteredIdeas.map((idea) => (
            <article className={selected?.id === idea.id ? "ideaCard selected" : "ideaCard"} key={idea.id}>
              <button className="ideaImageButton" type="button" aria-label={`Inspect ${idea.title}`} onClick={() => setSelected(idea)}>
                <img className="ideaImage" src={`/api/ideas/${idea.id}/artcard`} alt={`${idea.title} art card for ${brandName}`} />
              </button>
              <div className="ideaCardCopy">
                <span>{idea.format}</span>
                <h3>{idea.title}</h3>
                <p>{idea.purpose}</p>
                <div>
                  <button type="button" onClick={() => updateStatus(idea, "SAVED")}>{idea.status === "SAVED" ? "Saved" : "Save"}</button>
                  <button type="button" onClick={() => updateStatus(idea, "SKIPPED")}>Skip</button>
                  <button type="button" onClick={() => setSelected(idea)}>Inspect</button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {selected ? <aside className="ideaInspector">
          <img className="inspectorPreview" src={`/api/ideas/${selected.id}/artcard`} alt={`${selected.title} art card preview`} />
          <p className="contextLabel">Selected idea</p>
          <h3>{selected.title}</h3>
          <p>{selected.reason}</p>
          <dl>
            <div><dt>Purpose</dt><dd>{selected.purpose}</dd></div>
            <div><dt>Best format</dt><dd>{selected.format}</dd></div>
            <div><dt>Audience</dt><dd>{audience}</dd></div>
          </dl>
          <button className="primaryAction fullWidth" type="button" onClick={() => updateStatus(selected, "BUILT")}>Build this idea</button>
          <button className="secondaryAction fullWidth" type="button" onClick={() => updateStatus(selected, "SAVED")}>{selected.status === "SAVED" ? "Saved for later" : "Save for later"}</button>
          <a className="artCardDownload" href={`/api/ideas/${selected.id}/artcard`} target="_blank" rel="noreferrer">Open full-size art card</a>
        </aside> : null}
      </div>
      }
    </div>
  );
}

function CreateView({ brand, initialBrief }: { brand: BrandWorkspace; initialBrief: { title: string; goal: string; source: string; creativeDirection?: string } | null }) {
  return (
    <div className="viewStack createView">
      <section className="viewIntro">
        <h2>Turn one source into a campaign</h2>
        <p>Add an offer, idea, or source. Orbit will apply Brand DNA and create a platform-ready set.</p>
      </section>
      <div className="createLayout">
        <AgentComposer
          brandId={brand.id}
          brandName={brand.name}
          brandOffers={brand.offers}
          brandVisualStyle={brand.visualStyle}
          brandApprovalMode={brand.approvalMode}
          connectedPlatforms={brand.socialAccounts.filter((account) => account.connected).map((account) => account.platform as (typeof Platform)[keyof typeof Platform])}
          initialBrief={initialBrief}
        />
        <aside className="brandContext">
          <p className="contextLabel">Brand DNA applied</p>
          <h3>{brand.name}</h3>
          <div><span>Voice</span><p>{brand.voice}</p></div>
          <div><span>Audience</span><p>{brand.audience}</p></div>
          <div><span>Restricted</span><p>{brand.bannedPhrases}</p></div>
          <div><span>Approval</span><p>{brand.approvalMode.toLowerCase()} mode</p></div>
        </aside>
      </div>
      {brand.drafts.length > 0 ? <DraftBoard drafts={brand.drafts} /> : null}
    </div>
  );
}

function CampaignsView({ campaigns, drafts, onCreate }: { campaigns: Campaign[]; drafts: ContentDraft[]; onCreate: () => void }) {
  return (
    <div className="viewStack">
      <section className="viewIntro withAction">
        <div><h2>Campaigns</h2><p>Every campaign here was created from a real brief and the current Brand DNA.</p></div>
        <button className="primaryAction" type="button" onClick={onCreate}>Start campaign</button>
      </section>
      {campaigns.length ? (
        <section className="campaignList">
          {campaigns.map((campaign) => {
            const campaignDrafts = drafts.filter((draft) => draft.campaignId === campaign.id);
            return (
              <article className="campaignRow" key={campaign.id}>
                <div>
                  <span>{formatShortDate(campaign.createdAt)}</span>
                  <h3>{campaign.title}</h3>
                  <p>{campaign.goal}</p>
                </div>
                <dl>
                  <div><dt>Status</dt><dd>{formatStatus(campaign.status)}</dd></div>
                  <div><dt>Drafts</dt><dd>{campaignDrafts.length}</dd></div>
                  <div><dt>Channels</dt><dd>{readPlatforms(campaign.targetPlatforms).length}</dd></div>
                </dl>
              </article>
            );
          })}
        </section>
      ) : <EmptyWorkspaceCard title="No campaigns yet" detail="Create a campaign from an accurate source, offer, or announcement. Generated drafts and art cards will stay grouped here." action="Create first campaign" onAction={onCreate} />}
      {drafts.length ? <DraftBoard drafts={drafts} /> : null}
    </div>
  );
}

function CalendarView({ drafts }: { drafts: ContentDraft[] }) {
  const days = getCurrentWeek();
  const scheduledDrafts = drafts.filter((draft) => draft.scheduledAt);
  return (
    <div className="viewStack">
      <section className="viewIntro"><h2>Plan the week</h2><p>Review the publishing rhythm, fill useful gaps, and catch problems before posts go live.</p></section>
      <section className="calendarShell">
        <div className="calendarToolbar"><strong>{formatWeekRange(days)}</strong><span>Asia/Manila · {scheduledDrafts.length} scheduled</span></div>
        <div className="weekGrid">
          {days.map((day) => {
            const dayDrafts = scheduledDrafts.filter((draft) => draft.scheduledAt && dateKey(draft.scheduledAt) === dateKey(day));
            return <div className="dayColumn" key={day.toISOString()}>
              <h3>{formatDayHeading(day)}</h3>
              {dayDrafts.length ? dayDrafts.map((draft) => (
                <article className="calendarPost" key={draft.id}>
                  <img src={`/api/drafts/${draft.id}/artcard`} alt="" />
                  <div><span>{formatPlatform(draft.platform)}</span><strong>{draft.artHeadline || draft.caption.slice(0, 48)}</strong><small>{formatTime(draft.scheduledAt as Date)}</small></div>
                </article>
              )) : <span className="emptyDay">No posts scheduled</span>}
            </div>
          })}
        </div>
      </section>
      {!scheduledDrafts.length ? <EmptyWorkspaceCard title="The calendar is empty" detail="Approve and schedule a generated draft to place the first real post on this calendar." /> : null}
    </div>
  );
}

function InsightsView({ brand }: { brand: BrandWorkspace }) {
  const published = brand.drafts.filter((draft) => draft.approvalStatus === "PUBLISHED");
  const scheduled = brand.drafts.filter((draft) => draft.scheduledAt);
  const pending = brand.drafts.filter((draft) => draft.approvalStatus === "PENDING_REVIEW");
  const platformCounts = brand.drafts.reduce<Record<string, number>>((counts, draft) => {
    counts[draft.platform] = (counts[draft.platform] ?? 0) + 1;
    return counts;
  }, {});
  const leadingPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="viewStack insightsView">
      <section className="viewIntro"><h2>What the agent is learning</h2><p>Recommendations become useful only when they explain the evidence behind them.</p></section>
      <section className="insightMetrics">
        <article><span>Campaigns</span><strong>{brand.campaigns.length}</strong><small>saved briefs</small></article>
        <article><span>Drafts</span><strong>{brand.drafts.length}</strong><small>generated outputs</small></article>
        <article><span>Scheduled</span><strong>{scheduled.length}</strong><small>with real publish times</small></article>
        <article><span>Published</span><strong>{published.length}</strong><small>confirmed results</small></article>
      </section>
      {published.length === 0 ? (
        <EmptyWorkspaceCard title="Performance insights need published content" detail="Orbit will not invent engagement results. Once posts are published and performance data is available, evidence-backed recommendations can appear here." />
      ) : (
        <section className="insightNotes">
          <h3>Operational signals</h3>
          <div><strong>Review queue</strong><p>{pending.length} drafts are currently waiting for approval.</p></div>
          <div><strong>Content distribution</strong><p>{leadingPlatform ? `${formatPlatform(leadingPlatform[0])} has ${leadingPlatform[1]} of ${brand.drafts.length} drafts.` : "No platform mix is available yet."}</p></div>
        </section>
      )}
    </div>
  );
}

function BrandView({ brand, brandCount, onAddBrand }: { brand: BrandWorkspace; brandCount: number; onAddBrand: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    websiteUrl: brand.websiteUrl ?? "",
    voice: brand.voice,
    audience: brand.audience,
    offers: brand.offers,
    visualStyle: brand.visualStyle,
    bannedPhrases: brand.bannedPhrases
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [extractState, setExtractState] = useState<"idle" | "reading" | "ready" | "error">("idle");
  const [facebookState, setFacebookState] = useState<"idle" | "reading" | "ready" | "error">("idle");
  const [deleteState, setDeleteState] = useState<"idle" | "confirming" | "deleting" | "error">("idle");
  const [extractMessage, setExtractMessage] = useState("");
  const [facebookMessage, setFacebookMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const facebookAccount = brand.socialAccounts.find((account) => account.platform === Platform.FACEBOOK);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaveState("idle");
  }

  async function saveBrand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    const response = await fetch(`/api/brands/${brand.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setSaveState(response.ok ? "saved" : "error");
  }

  async function learnFromWebsite() {
    if (!form.websiteUrl) return;
    setExtractState("reading");
    setExtractMessage("");
    try {
      const response = await fetch(`/api/brands/${brand.id}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: form.websiteUrl })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not learn from this website.");
      setForm((current) => ({ ...current, ...payload.profile }));
      setExtractState("ready");
      setExtractMessage(`Saved from ${payload.evidence.pageTitle || form.websiteUrl}. You can still edit the fields below.`);
      setSaveState("saved");
      router.refresh();
    } catch (caught) {
      setExtractState("error");
      setExtractMessage(caught instanceof Error ? caught.message : "Could not learn from this website.");
    }
  }

  async function learnFromFacebook() {
    setFacebookState("reading");
    setFacebookMessage("");
    try {
      const response = await fetch("/api/integrations/meta/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: brand.id })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not learn from Facebook.");
      setForm((current) => ({ ...current, ...payload.profile }));
      setFacebookState("ready");
      setFacebookMessage(`Saved from ${payload.evidence.pageName}. Reviewed ${payload.evidence.postsReviewed} recent posts.`);
      setSaveState("saved");
      router.refresh();
    } catch (caught) {
      setFacebookState("error");
      setFacebookMessage(caught instanceof Error ? caught.message : "Could not learn from Facebook.");
    }
  }

  async function deleteBrand() {
    setDeleteState("deleting");
    setDeleteMessage("");
    try {
      const response = await fetch(`/api/brands/${brand.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not delete this brand.");

      if (payload.nextBrandId) {
        router.push(`/?brandId=${encodeURIComponent(payload.nextBrandId)}`);
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (caught) {
      setDeleteState("error");
      setDeleteMessage(caught instanceof Error ? caught.message : "Could not delete this brand.");
    }
  }

  return (
    <div className="viewStack brandView">
      <section className="viewIntro withAction">
        <div>
          <h2>The context behind every decision</h2>
          <p>Review what Orbit knows, where it came from, and what still needs confirmation.</p>
        </div>
        <button className="primaryAction" type="button" onClick={onAddBrand}>Add brand</button>
      </section>
      <form className="brandDnaGrid" onSubmit={saveBrand}>
        <section className="dnaLead"><span className="brandMonogram large">{brand.initials}</span><div><h3>{brand.name}</h3><p>Brand profile is ready for campaign generation.</p></div></section>
        <section className="websiteSource"><span>Website source</span><label>Website URL<input type="url" value={form.websiteUrl} onChange={(event) => updateField("websiteUrl", event.target.value)} placeholder="https://yourbrand.com" /></label><div className="websiteActions"><button className="secondaryAction" disabled={!form.websiteUrl || extractState === "reading"} type="button" onClick={learnFromWebsite}>{extractState === "reading" ? "Reading website" : "Learn from website"}</button>{extractMessage ? <p className={extractState === "error" ? "extractError" : ""}>{extractMessage}</p> : <p>Orbit learns Brand DNA and saves it to this brand. You can edit it afterward.</p>}</div></section>
        <section className="websiteSource"><span>Facebook source</span><div className="facebookSourceRow"><div><h3>{facebookAccount?.displayName ?? "Facebook Page"}</h3><p>{facebookAccount?.connected ? "Use recent Page posts to tune voice, offers, audience, and content style." : "Connect Facebook first, then Orbit can learn from recent Page posts."}</p></div><button className="secondaryAction" disabled={!facebookAccount?.connected || facebookState === "reading"} type="button" onClick={learnFromFacebook}>{facebookState === "reading" ? "Reading Facebook" : "Learn from Facebook"}</button></div>{facebookMessage ? <p className={facebookState === "error" ? "extractError" : ""}>{facebookMessage}</p> : null}</section>
        <section><span>Voice</span><label>How the brand should sound<textarea rows={5} value={form.voice} onChange={(event) => updateField("voice", event.target.value)} /></label></section>
        <section><span>Audience</span><label>Who the content is for<textarea rows={5} value={form.audience} onChange={(event) => updateField("audience", event.target.value)} /></label></section>
        <section className="visualWorld"><span>Visual world</span><BrandVisualPreview brandName={brand.name} visualStyle={form.visualStyle} /><label>Creative direction<textarea rows={3} value={form.visualStyle} onChange={(event) => updateField("visualStyle", event.target.value)} /></label></section>
        <section><span>Offers</span><label>Products, services, and active offers<textarea rows={5} value={form.offers} onChange={(event) => updateField("offers", event.target.value)} /></label></section>
        <section><span>Restrictions</span><label>Blocked phrases and claims<textarea rows={5} value={form.bannedPhrases} onChange={(event) => updateField("bannedPhrases", event.target.value)} /></label></section>
        <div className="brandSaveBar"><span>{saveState === "saved" ? "Brand DNA saved" : saveState === "error" ? "Could not save Brand DNA" : "Changes affect future ideas and campaigns."}</span><button className="primaryAction" disabled={saveState === "saving"} type="submit">{saveState === "saving" ? "Saving" : "Save Brand DNA"}</button></div>
      </form>
      <section className="dangerZone">
        <div>
          <p className="contextLabel">Danger zone</p>
          <h3>Delete this brand</h3>
          <p>
            This removes the brand, Brand DNA, ideas, drafts, campaigns, connected account records, and rules.
            This cannot be undone.
          </p>
        </div>
        {deleteState === "confirming" ? (
          <div className="dangerConfirm">
            <p>Delete <strong>{brand.name}</strong> permanently?</p>
            <div>
              <button className="secondaryAction" type="button" onClick={() => setDeleteState("idle")}>Cancel</button>
              <button className="dangerAction" disabled={brandCount <= 1} type="button" onClick={deleteBrand}>
                Yes, delete brand
              </button>
            </div>
          </div>
        ) : (
          <button className="dangerAction" disabled={brandCount <= 1 || deleteState === "deleting"} type="button" onClick={() => setDeleteState("confirming")}>
            {deleteState === "deleting" ? "Deleting" : "Delete brand"}
          </button>
        )}
        {brandCount <= 1 ? <p className="inlineNotice">Add another brand before deleting this one.</p> : null}
        {deleteMessage ? <p className="inlineError" role="alert">{deleteMessage}</p> : null}
      </section>
      <ConnectedAccounts accounts={brand.socialAccounts} brandId={brand.id} />
    </div>
  );
}

function EmptyWorkspaceCard({ title, detail, action, onAction }: { title: string; detail: string; action?: string; onAction?: () => void }) {
  return (
    <section className="emptyWorkspaceCard">
      <span aria-hidden="true">○</span>
      <div><h3>{title}</h3><p>{detail}</p></div>
      {action && onAction ? <button className="primaryAction" type="button" onClick={onAction}>{action}</button> : null}
    </section>
  );
}

function BrandVisualPreview({ brandName, visualStyle }: { brandName: string; visualStyle: string }) {
  const seed = `${brandName}:${visualStyle}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  const hue = hash % 360;
  const style = {
    "--brand-hue": String(hue),
    "--brand-hue-alt": String((hue + 54) % 360)
  } as CSSProperties;
  return <div className="brandVisualPreview" style={style}><i /><div><strong>{brandName}</strong><span>{visualStyle || "Add a creative direction to guide generated art cards."}</span></div></div>;
}

function readPlatforms(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatPlatform(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" }).format(value);
}

function formatDayHeading(value: Date) {
  return new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Manila" }).format(value);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }).format(value);
}

function dateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Manila" }).format(value);
}

function getCurrentWeek() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  start.setDate(start.getDate() - ((day + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const value = new Date(start);
    value.setDate(start.getDate() + index);
    return value;
  });
}

function formatWeekRange(days: Date[]) {
  if (!days.length) return "This week";
  return `${formatShortDate(days[0])} – ${formatShortDate(days[days.length - 1])}`;
}
