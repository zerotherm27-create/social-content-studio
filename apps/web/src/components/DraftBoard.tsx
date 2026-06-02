"use client";

import type { ContentDraft } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Platform } from "@/lib/domain";

export function DraftBoard({ drafts }: { drafts: ContentDraft[] }) {
  const router = useRouter();

  async function approveDraft(draftId: string) {
    await fetch(`/api/drafts/${draftId}/approve`, { method: "POST" });
    router.refresh();
  }

  async function scheduleDraft(draftId: string) {
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await fetch(`/api/drafts/${draftId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt })
    });
    router.refresh();
  }

  async function publishGoogleDraft(draftId: string) {
    const response = await fetch(`/api/drafts/${draftId}/publish/google`, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json();
      window.alert(payload.error ?? "Google publishing failed.");
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
                  <button type="button" onClick={() => scheduleDraft(draft.id)}>
                    Schedule
                  </button>
                  {draft.platform === Platform.GOOGLE_BUSINESS ? (
                    <button type="button" onClick={() => publishGoogleDraft(draft.id)}>
                      Publish Google
                    </button>
                  ) : null}
                </div>
              </footer>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
