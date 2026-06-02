import { AgentComposer } from "@/components/AgentComposer";
import { BrandSidebar } from "@/components/BrandSidebar";
import { CalendarQueue } from "@/components/CalendarQueue";
import { ConnectedAccounts } from "@/components/ConnectedAccounts";
import { DraftBoard } from "@/components/DraftBoard";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const brand = await db.brand.findFirst({
    include: {
      socialAccounts: true,
      drafts: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!brand) {
    return (
      <main className="emptyState">
        <h1>No brand found</h1>
        <p>Run the database seed command to create the demo workspace.</p>
      </main>
    );
  }

  return (
    <main className="appShell">
      <BrandSidebar brand={brand} />
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Hybrid mode</p>
            <h2>Generate, approve, schedule, publish.</h2>
          </div>
          <a className="buttonLink" href="/api/export">
            Manual export
          </a>
        </header>
        <div className="dashboardGrid">
          <AgentComposer brandId={brand.id} />
          <ConnectedAccounts accounts={brand.socialAccounts} brandId={brand.id} />
        </div>
        <DraftBoard drafts={brand.drafts} />
        <CalendarQueue drafts={brand.drafts} />
      </section>
    </main>
  );
}
