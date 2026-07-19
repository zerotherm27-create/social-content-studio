import Link from "next/link";
import type { PublicSocialAccount } from "@/components/AgentWorkspace";
import { Platform } from "@/lib/domain";
import { getPlatformDefinition, platformDefinitions } from "@/lib/platforms";

export function ConnectedAccounts({ accounts, brandId }: { accounts: PublicSocialAccount[]; brandId: string }) {
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
            ) : account.platform === Platform.FACEBOOK ? (
              <Link className="buttonLink accountAction" href={`/api/integrations/meta/connect?brandId=${brandId}`}>
                {account.connected ? "Reconnect" : "Connect"}
              </Link>
            ) : account.platform === Platform.INSTAGRAM ? (
              <Link className="buttonLink accountAction" href={`/api/integrations/meta/connect?brandId=${brandId}`}>
                {account.connected ? "Reconnect" : "Connect via Meta"}
              </Link>
            ) : account.platform === Platform.THREADS ? (
              <Link className="buttonLink accountAction" href={`/api/integrations/threads/connect?brandId=${brandId}`}>
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
