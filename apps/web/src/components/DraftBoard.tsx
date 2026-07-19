"use client";

import type { ContentDraft } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Platform } from "@/lib/domain";
import { getBestDailyPublishLabel, parseManilaSpecificTime } from "@/lib/scheduling";

export function DraftBoard({ drafts }: { drafts: ContentDraft[] }) {
  const router = useRouter();

  async function approveDraft(draftId: string) {
    await fetch(`/api/drafts/${draftId}/approve`, { method: "POST" });
    router.refresh();
  }

  async function scheduleBestTime(draftId: string) {
    const response = await fetch(`/api/drafts/${draftId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "BEST_DAILY" })
    });
    if (!response.ok) {
      const payload = await response.json();
      window.alert(payload.error ?? "Scheduling failed.");
    }
    router.refresh();
  }

  async function scheduleSpecificTime(draftId: string) {
    const value = window.prompt("Enter Manila date and time, like 2026-07-16 19:30");
    if (!value) return;

    const scheduledAt = parseManilaSpecificTime(value);
    if (!scheduledAt) {
      window.alert("Please use this format: 2026-07-16 19:30");
      return;
    }

    const response = await fetch(`/api/drafts/${draftId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: scheduledAt.toISOString() })
    });
    if (!response.ok) {
      const payload = await response.json();
      window.alert(payload.error ?? "Scheduling failed.");
    }
    router.refresh();
  }

  async function publishDraft(draftId: string) {
    const response = await fetch(`/api/drafts/${draftId}/publish`, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json();
      window.alert(payload.error ?? "Publishing failed.");
    }
    router.refresh();
  }

  return (
    <section className="panel">
      <div className="sectionHeading">
        <div>
          <p className="eyebrow">Draft review</p>
          <h2>Platform-ready drafts</h2>
        </div>
      </div>
      <div className="draftGrid">
        {drafts.length === 0 ? (
          <p className="muted">Create a campaign and generate drafts to start the review workflow.</p>
        ) : (
          drafts.map((draft) => (
            <article className="draftCard" key={draft.id}>
              <img className="draftArtCard" src={`/api/drafts/${draft.id}/artcard`} alt={`${draft.artHeadline || "Generated"} art card`} />
              <header>
                <strong>{draft.platform.replace("_", " ")}</strong>
                <span>{draft.approvalStatus.replace("_", " ")}</span>
              </header>
              <p>{draft.caption}</p>
              <div className="tagRow">
                {(JSON.parse(draft.hashtags) as string[]).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <footer>
                <span>{draft.riskLevel.toLowerCase()} risk</span>
                <div className="buttonRow">
                  <button type="button" onClick={() => approveDraft(draft.id)}>
                    Approve
                  </button>
                  {canPublishDirectly(draft.platform) ? (
                    <button type="button" onClick={() => scheduleBestTime(draft.id)}>
                      Best time · {getBestDailyPublishLabel(draft.platform)}
                    </button>
                  ) : (
                    <button type="button" disabled title="Scheduling to publish needs this platform API configured first.">
                      Best time setup needed
                    </button>
                  )}
                  {canPublishDirectly(draft.platform) ? (
                    <button type="button" onClick={() => scheduleSpecificTime(draft.id)}>
                      Set time
                    </button>
                  ) : (
                    <button type="button" disabled title="Scheduling to publish needs this platform API configured first.">
                      Set time setup needed
                    </button>
                  )}
                  {canPublishDirectly(draft.platform) ? (
                    <button type="button" onClick={() => publishDraft(draft.id)}>
                      Publish now
                    </button>
                  ) : (
                    <button type="button" disabled title="This platform needs its publishing API configured first.">
                      API setup needed
                    </button>
                  )}
                  <a className="buttonLink" href={`/api/drafts/${draft.id}/artcard`} target="_blank" rel="noreferrer">Open creative</a>
                  <a className="buttonLink" href={`/api/drafts/${draft.id}/artcard.png`} download>Download PNG</a>
                </div>
              </footer>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function canPublishDirectly(platform: string) {
  return platform === Platform.GOOGLE_BUSINESS || platform === Platform.FACEBOOK || platform === Platform.INSTAGRAM || platform === Platform.THREADS;
}
