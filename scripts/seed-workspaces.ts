import { db } from '../lib/db';
import { workspaces } from '../lib/schema';

const DEFAULT_WORKSPACES = [
  'Frontend Unit',
  'Backend Unit',
  'Marketing Team',
  'Management',
];

async function seed() {
  const existing = await db.select().from(workspaces);
  if (existing.length > 0) {
    console.log('Workspaces already exist, skipping seed.');
    return;
  }
  await db.insert(workspaces).values(
    DEFAULT_WORKSPACES.map((name) => ({ name }))
  );
  console.log('Seeded', DEFAULT_WORKSPACES.length, 'workspaces.');
}

seed().catch(console.error).finally(() => process.exit(0));
