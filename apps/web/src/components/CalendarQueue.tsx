import type { ContentDraft } from "@prisma/client";

export function CalendarQueue({ drafts }: { drafts: ContentDraft[] }) {
  const scheduled = drafts.filter((draft) => draft.scheduledAt);

  return (
    <section className="panel">
      <p className="eyebrow">Calendar queue</p>
      <h2>{scheduled.length} scheduled</h2>
      {scheduled.length === 0 ? (
        <p className="muted">Approved drafts will appear here after scheduling.</p>
      ) : (
        <div className="queueList">
          {scheduled.map((draft) => (
            <div className="queueItem" key={draft.id}>
              <time>{draft.scheduledAt?.toLocaleString()}</time>
              <strong>{draft.platform.replace("_", " ")}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
