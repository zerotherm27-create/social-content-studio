import { db } from "./db";

async function main() {
  const workspace = await db.workspace.upsert({
    where: { id: "primary-workspace" },
    update: {},
    create: {
      id: "primary-workspace",
      name: "Social Content Workspace"
    },
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
