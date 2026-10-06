import { createSearchFlow, SearchStore } from "./flow";

async function main(): Promise<void> {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) throw new Error('Usage: npm run main -- "your search query"');
  const shared: SearchStore = { query };
  await createSearchFlow().run(shared);
  console.log(shared.report);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
