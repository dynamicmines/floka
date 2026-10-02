import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
const pg = new EmbeddedPostgres({
  databaseDir: './.local-db',
  port: 54329,
  user: 'flowka',
  password: 'local-development-only',
  persistent: true,
  authMethod: 'scram-sha-256',
  postgresFlags: ['-h', '127.0.0.1'],
});
async function main() {
  if (!existsSync('./.local-db/PG_VERSION')) await pg.initialise();
  await pg.start();
  const client = pg.getPgClient();
  await client.connect();
  const { rows } = await client.query("SELECT 1 FROM pg_database WHERE datname='flowka'");
  await client.end();
  if (!rows.length) await pg.createDatabase('flowka');
  console.log(
    'Development database ready: postgresql://flowka:local-development-only@127.0.0.1:54329/flowka',
  );
}
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, async () => {
    await pg.stop();
    process.exit(0);
  });
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
