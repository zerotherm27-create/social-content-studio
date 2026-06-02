import type { SocialAccount } from "@prisma/client";
import Link from "next/link";
import { Platform } from "@/lib/domain";
import { getPlatformDefinition, platformDefinitions } from "@/lib/platforms";

export function ConnectedAccounts({ accounts, brandId }: { accounts: SocialAccount[]; brandId: string }) {
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
            {account.platform === Platform.GOOGLE_BUSINESS ? (
              <Link className="buttonLink accountAction" href={`/api/integrations/google/connect?brandId=${brandId}`}>
                {account.connected ? "Reconnect" : "Connect"}
              </Link>
            ) : (
              <span className="accountAction muted">Coming later</span>
            )}
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
