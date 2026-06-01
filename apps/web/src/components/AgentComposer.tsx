"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Platform } from "@/lib/domain";
import { platformDefinitions } from "@/lib/platforms";

export function AgentComposer({ brandId }: { brandId: string }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    const formData = new FormData(event.currentTarget);
    const platforms = formData.getAll("platforms");
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          title: formData.get("title"),
          goal: formData.get("goal"),
          source: formData.get("source"),
          platforms
        })
      });

      const { campaign } = await response.json();
      await fetch(`/api/campaigns/${campaign.id}/generate`, { method: "POST" });
      router.refresh();
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <div className="sectionHeading">
        <div>
          <p className="eyebrow">Agent composer</p>
          <h2>Turn one campaign into platform drafts</h2>
        </div>
      </div>
      <label>
        Campaign title
        <input name="title" defaultValue="Summer cold brew flight" />
      </label>
      <label>
        Goal
        <input name="goal" defaultValue="Launch a new product and drive store visits" />
      </label>
      <label>
        Source or offer
        <textarea name="source" defaultValue="Three new cold brew flavors with a first-week discount." rows={4} />
      </label>
      <fieldset>
        <legend>Platforms</legend>
        <div className="platformGrid">
          {platformDefinitions.map((definition) => (
            <label className="checkPill" key={definition.platform}>
              <input
                name="platforms"
                type="checkbox"
                value={definition.platform}
                defaultChecked={definition.platform !== Platform.TIKTOK}
              />
              {definition.shortLabel}
            </label>
          ))}
        </div>
      </fieldset>
      <button type="submit" disabled={isGenerating}>
        {isGenerating ? "Generating" : "Create campaign"}
      </button>
    </form>
  );
}
