"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function FirstBrandSetup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, websiteUrl })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not create the brand.");
      router.push(`/?brandId=${encodeURIComponent(payload.brand.id)}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the brand.");
      setIsSaving(false);
    }
  }

  return (
    <main className="firstBrandShell">
      <section>
        <p className="contextLabel">New workspace</p>
        <h1>Start with the real brand.</h1>
        <p>Add a name and, if available, the public website. Orbit will begin empty and learn only from sources you approve.</p>
        <form onSubmit={submit}>
          <label>Brand name<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your brand name" /></label>
          <label>Website <span>optional</span><input type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://yourbrand.com" /></label>
          {error ? <p className="inlineError" role="alert">{error}</p> : null}
          <button className="primaryAction" disabled={isSaving} type="submit">{isSaving ? "Creating workspace" : "Create brand workspace"}</button>
        </form>
      </section>
    </main>
  );
}
