export default function DashboardPage() {
  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brandMark">OSA</div>
        <p className="eyebrow">Owned Social Agent</p>
        <h1>Agent cockpit</h1>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Production foundation</p>
            <h2>Generate, approve, schedule, publish.</h2>
          </div>
          <button type="button">Manual export</button>
        </header>
      </section>
    </main>
  );
}
