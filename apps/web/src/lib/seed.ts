import { db } from "./db";
import { ApprovalMode, Platform } from "./domain";

async function main() {
  const workspace = await db.workspace.upsert({
    where: { id: "demo-workspace" },
    update: {},
    create: {
      id: "demo-workspace",
      name: "Demo Agency Workspace",
      brands: {
        create: {
          id: "demo-brand-luna",
          name: "Luna Brew Cafe",
          initials: "LB",
          voice: "Warm, polished, local, and sensory. Short sentences. Clear calls to action.",
          audience: "Busy professionals, coffee lovers, nearby office workers, and weekend cafe visitors.",
          offers: "Summer cold brew flight, first-week discount, seasonal pastries, private tasting events.",
          bannedPhrases: "guaranteed cure, cheapest in town, miracle",
          approvalMode: ApprovalMode.HYBRID,
          socialAccounts: {
            create: [
              { platform: Platform.FACEBOOK, displayName: "Luna Brew Cafe Page", externalId: "pending-facebook", connected: false },
              { platform: Platform.INSTAGRAM, displayName: "@lunabrewcafe", externalId: "pending-instagram", connected: false },
              { platform: Platform.GOOGLE_BUSINESS, displayName: "Luna Brew Cafe GBP", externalId: "pending-google", connected: false },
              { platform: Platform.TIKTOK, displayName: "@lunabrewcafe", externalId: "pending-tiktok", connected: false },
              { platform: Platform.LINKEDIN, displayName: "Luna Brew Cafe Company", externalId: "pending-linkedin", connected: false }
            ]
          },
          approvalRules: {
            create: [
              { name: "Price claims", trigger: "price|discount|free|guarantee", requiresReview: true },
              { name: "Regulated claims", trigger: "health|legal|medical|financial|political", requiresReview: true },
              { name: "Competitors", trigger: "better than|versus|competitor", requiresReview: true }
            ]
          }
        }
      }
    },
    include: { brands: true }
  });

  console.log(`Seeded ${workspace.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
