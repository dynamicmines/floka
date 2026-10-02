import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
loadEnvConfig(process.cwd());
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL');
  const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
  try {
    await migrate(drizzle(client), { migrationsFolder: './drizzle' });
    console.log('Migrations applied');
  } finally {
    await client.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
