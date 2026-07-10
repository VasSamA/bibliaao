/**
 * Script executável: npm run bible:import
 * Lê MIDVASH_VERSION_SLUGS (lista separada por vírgulas de slugs de versão
 * na Midvash API, ex: "ara,acf,nvi") e importa cada uma para a base de
 * dados local. Ver versões disponíveis em https://api.midvash.com/v1/versions
 * (não requer chave de API).
 */
import { PrismaClient } from '@prisma/client';
import { BibleImportService } from './bible-import.service';

async function main() {
  const prisma = new PrismaClient();
  const service = new BibleImportService(prisma);

  const versionSlugs = (process.env.MIDVASH_VERSION_SLUGS ?? 'ara')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  for (const slug of versionSlugs) {
    await service.importVersion(slug);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Falha na importação bíblica:', e);
  process.exit(1);
});
