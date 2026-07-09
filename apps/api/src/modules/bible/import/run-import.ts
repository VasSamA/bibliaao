/**
 * Script executável: npm run bible:import
 * Lê API_BIBLE_VERSION_IDS (lista separada por vírgulas de IDs de versão
 * na API.Bible) e importa cada uma para a base de dados local.
 */
import { PrismaClient } from '@prisma/client';
import { BibleImportService } from './bible-import.service';

async function main() {
  const prisma = new PrismaClient();
  const service = new BibleImportService(prisma);

  const versionIds = (process.env.API_BIBLE_VERSION_IDS ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  if (versionIds.length === 0) {
    console.error(
      'Defina API_BIBLE_VERSION_IDS no .env com os IDs de versão da API.Bible (ex: de https://scripture.api.bible/livedocs, endpoint /bibles).',
    );
    process.exit(1);
  }

  for (const id of versionIds) {
    await service.importVersion(id);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Falha na importação bíblica:', e);
  process.exit(1);
});
