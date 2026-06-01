import type { Brand, SocialAccount } from "@prisma/client";
import type { Platform } from "@/lib/domain";
import { getPlatformDefinition, platformDefinitions } from "@/lib/platforms";

type BrandWithAccounts = Brand & { socialAccounts: SocialAccount[] };

export function BrandSidebar({ brand }: { brand: BrandWithAccounts }) {
  return (
    <aside className="sidebar">
      <div className="brandMark">{brand.initials}</div>
      <p className="eyebrow">Owned Social Agent</p>
      <h1>{brand.name}</h1>
      <section className="sidebarPanel">
        <p className="eyebrow">Brand memory</p>
        <p>{brand.voice}</p>
      </section>
      <section className="sidebarPanel">
        <p className="eyebrow">Connections</p>
        {brand.socialAccounts.map((account) => (
          <div className="connectionRow" key={account.id}>
            <span>{labelForPlatform(account.platform)}</span>
            <strong>{account.connected ? "Live" : "Ready"}</strong>
          </div>
        ))}
      </section>
    </aside>
  );
}

function labelForPlatform(platform: string) {
  const known = platformDefinitions.some((definition) => definition.platform === platform);
  return known ? getPlatformDefinition(platform as Platform).shortLabel : platform.replace("_", " ");
}
