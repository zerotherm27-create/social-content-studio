"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { type Platform as PlatformValue } from "@/lib/domain";
import { platformDefinitions } from "@/lib/platforms";

type AgentComposerProps = {
  brandId: string;
  brandName: string;
  brandOffers: string;
  brandVisualStyle: string;
  brandApprovalMode: string;
  connectedPlatforms: PlatformValue[];
  initialBrief?: {
    title: string;
    goal: string;
    source: string;
    creativeDirection?: string;
  } | null;
};

type Tone = "clear" | "warm" | "bold";

const toneLabels: Record<Tone, string> = {
  clear: "Clear",
  warm: "Warm",
  bold: "Bold"
};

export function AgentComposer({
  brandId,
  brandName,
  brandOffers,
  brandVisualStyle,
  brandApprovalMode,
  connectedPlatforms,
  initialBrief
}: AgentComposerProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [title, setTitle] = useState(initialBrief?.title ?? "");
  const [goal, setGoal] = useState(initialBrief?.goal ?? "");
  const [source, setSource] = useState(initialBrief?.source ?? "");
  const [creativeDirection, setCreativeDirection] = useState(initialBrief?.creativeDirection ?? "");
  const [tone, setTone] = useState<Tone>("warm");
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformValue[]>(connectedPlatforms);

  useEffect(() => {
    if (!initialBrief) return;
    setTitle(initialBrief.title);
    setGoal(initialBrief.goal);
    setSource(initialBrief.source);
    setCreativeDirection(initialBrief.creativeDirection ?? "");
  }, [initialBrief]);

  const connectedSet = useMemo(() => new Set(connectedPlatforms), [connectedPlatforms]);

  function togglePlatform(platform: PlatformValue) {
    setSelectedPlatforms((current) =>
      current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    setError("");
    setSuccess("");

    try {
      const createResponse = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          title: title.trim(),
          goal: goal.trim(),
          source: source.trim(),
          tone: toneLabels[tone],
          creativeDirection: creativeDirection.trim(),
          platforms: selectedPlatforms
        })
      });
      const createPayload = await createResponse.json();
      if (!createResponse.ok) throw new Error(createPayload.error ?? "Campaign creation failed.");

      const generateResponse = await fetch(`/api/campaigns/${createPayload.campaign.id}/generate`, { method: "POST" });
      const generatePayload = await generateResponse.json();
      if (!generateResponse.ok) throw new Error(generatePayload.error ?? "Draft generation failed.");

      setSuccess(`Created ${generatePayload.drafts.length} brand-led drafts and art cards.`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Campaign generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  const canSubmit =
    title.trim().length >= 2 &&
    goal.trim().length >= 2 &&
    source.trim().length >= 2 &&
    selectedPlatforms.length > 0;

  return (
    <form className="composerDesk" onSubmit={handleSubmit}>
      <div className="composerLead">
        <div>
          <p className="eyebrow">Campaign brief</p>
          <h2>Give Orbit the truth. It will shape the campaign.</h2>
        </div>
      </div>

      <div className="composerGrid simplifiedComposer">
        <section className="composerInputs">
          <label>
            Campaign title
            <input required minLength={2} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name this campaign" />
          </label>
          <label>
            Marketing objective
            <textarea required minLength={2} value={goal} onChange={(event) => setGoal(event.target.value)} rows={3} placeholder="Example: Drive weekday bookings from nearby condo residents." />
          </label>
          <label>
            Verified offer details
            <textarea required minLength={2} value={source} onChange={(event) => setSource(event.target.value)} rows={6} placeholder="Add the offer, customer benefit, price, deadline, location, terms, proof points, and exact next step. Orbit will only use details entered here." />
          </label>
          {brandOffers.trim() ? (
            <button className="sourceAssist" type="button" onClick={() => setSource(brandOffers)}>
              Use current Brand DNA offers
            </button>
          ) : null}
          <label>
            Creative direction <span className="optionalLabel">optional</span>
            <textarea value={creativeDirection} onChange={(event) => setCreativeDirection(event.target.value)} rows={4} placeholder={brandVisualStyle || "Describe the hero product or service moment, setting, people, props, and brand-color details."} />
          </label>

          <div className="toneControl" role="group" aria-label="Campaign tone">
            {(Object.keys(toneLabels) as Tone[]).map((item) => (
              <button aria-pressed={tone === item} className={tone === item ? "active" : ""} key={item} type="button" onClick={() => setTone(item)}>
                {toneLabels[item]}
              </button>
            ))}
          </div>
        </section>

        <section className="composerDecisionRail">
          <fieldset className="channelMatrix">
            <legend>Channels</legend>
            <div>
              {platformDefinitions.map((definition) => {
                const active = selectedPlatforms.includes(definition.platform);
                const connected = connectedSet.has(definition.platform);
                return (
                  <button
                    aria-pressed={active}
                    className={active ? "channelButton active" : "channelButton"}
                    key={definition.platform}
                    type="button"
                    onClick={() => togglePlatform(definition.platform)}
                  >
                    <span>{definition.shortLabel}</span>
                    <small>{connected ? "Connected" : "Draft only"}</small>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="generationSummary">
            <p className="eyebrow">What Orbit will apply</p>
            <h3>{brandName}</h3>
            <dl>
              <div><dt>Voice</dt><dd>Brand DNA</dd></div>
              <div><dt>Visuals</dt><dd>{creativeDirection.trim() ? "Campaign direction" : brandVisualStyle.trim() ? "Brand visual style" : "Generated from the brief"}</dd></div>
              <div><dt>Approval</dt><dd>{brandApprovalMode.toLowerCase()}</dd></div>
              <div><dt>Output</dt><dd>{selectedPlatforms.length === 1 ? "1 draft + art card" : `${selectedPlatforms.length} drafts + art cards`}</dd></div>
            </dl>
          </div>
        </section>
      </div>

      <div className="composerSubmit">
        <div aria-live="polite">
          <strong>{error ? "Campaign needs attention" : success ? "Campaign ready" : "Ready when the brief is accurate"}</strong>
          <span className={error ? "submitError" : success ? "submitSuccess" : ""}>
            {error || success || "Orbit will turn one verified offer into platform-specific copy and a marketing-ready publication asset for every selected channel."}
          </span>
        </div>
        <button type="submit" disabled={isGenerating || !canSubmit}>
          {isGenerating ? "Generating campaign" : "Generate campaign"}
        </button>
      </div>
    </form>
  );
}
