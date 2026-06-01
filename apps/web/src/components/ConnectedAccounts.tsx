import type { SocialAccount } from "@prisma/client";
import { getPlatformDefinition, platformDefinitions } from "@/lib/platforms";
import type { Platform } from "@/lib/domain";

export function ConnectedAccounts({ accounts }: { accounts: SocialAccount[] }) {
  return (
    <section className="panel">
      <p className="eyebrow">Direct integrations</p>
      <h2>Publishing connectors</h2>
      <div className="accountGrid">
        {accounts.map((account) => (
          <article className="accountCard" key={account.id}>
            <strong>{labelForPlatform(account.platform)}</strong>
            <span>{account.displayName}</span>
            <p>{account.connected ? "Connected" : "OAuth setup pending"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function labelForPlatform(platform: string) {
  const known = platformDefinitions.some((definition) => definition.platform === platform);
  return known ? getPlatformDefinition(platform as Platform).label : platform.replace("_", " ");
}
