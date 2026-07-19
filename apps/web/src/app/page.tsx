import { AgentWorkspace } from "@/components/AgentWorkspace";
import { FirstBrandSetup } from "@/components/FirstBrandSetup";
import { db } from "@/lib/db";

type DashboardPageProps = {
  searchParams?: Promise<{
    brandId?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const requestedBrandId = params?.brandId;
  const brandsPromise = db.brand.findMany({
    orderBy: { createdAt: "asc" },
    select: brandSummarySelect
  });
  const requestedBrandPromise = requestedBrandId ? fetchBrandWorkspace(requestedBrandId) : Promise.resolve(null);
  const [brands, requestedBrand] = await Promise.all([brandsPromise, requestedBrandPromise]);
  const brand =
    requestedBrand && brands.some((item) => item.id === requestedBrand.id)
      ? requestedBrand
      : brands[0]
        ? await fetchBrandWorkspace(brands[0].id)
        : null;

  if (!brand) {
    return <FirstBrandSetup />;
  }

  return <AgentWorkspace key={brand.id} brand={brand} brands={brands} />;
}

const brandSummarySelect = {
  id: true,
  name: true,
  initials: true,
  approvalMode: true,
  _count: {
    select: {
      drafts: true,
      ideas: true
    }
  }
} as const;

const brandSelect = {
  id: true,
  workspaceId: true,
  name: true,
  initials: true,
  voice: true,
  audience: true,
  offers: true,
  bannedPhrases: true,
  websiteUrl: true,
  visualStyle: true,
  approvalMode: true,
  createdAt: true,
  updatedAt: true
} as const;

const socialAccountSelect = {
  id: true,
  brandId: true,
  platform: true,
  displayName: true,
  externalId: true,
  connected: true,
  tokenStatus: true,
  accountName: true,
  locationName: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true
} as const;

async function fetchBrandWorkspace(brandId: string) {
  const [brand, socialAccounts, ideas, drafts, campaigns] = await Promise.all([
    db.brand.findUnique({
      where: { id: brandId },
      select: brandSelect
    }),
    db.socialAccount.findMany({
      where: { brandId },
      orderBy: { createdAt: "asc" },
      select: socialAccountSelect
    }),
    db.contentIdea.findMany({
      where: { brandId },
      orderBy: { createdAt: "desc" }
    }),
    db.contentDraft.findMany({
      where: { brandId },
      orderBy: { createdAt: "desc" }
    }),
    db.campaign.findMany({
      where: { brandId },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return brand ? { ...brand, socialAccounts, ideas, drafts, campaigns } : null;
}
