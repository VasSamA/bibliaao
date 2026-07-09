import { PrismaClient, UserRole, ContentStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Biblia.ao...');

  // --- Permissões base ---
  const permissionDefs = [
    { key: 'content.create', description: 'Criar conteúdos (estudos, devocionais, artigos)' },
    { key: 'content.publish', description: 'Publicar conteúdos' },
    { key: 'content.moderate', description: 'Aprovar/rejeitar comentários e submissões' },
    { key: 'users.manage', description: 'Gerir utilizadores e permissões' },
    { key: 'churches.manage', description: 'Gerir igrejas e eventos' },
    { key: 'platform.configure', description: 'Configurações gerais da plataforma' },
  ];
  for (const p of permissionDefs) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: {},
      create: p,
    });
  }

  // --- Super administrador ---
  const passwordHash = await argon2.hash('MudarEsta#Senha123');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@biblia.ao' },
    update: {},
    create: {
      name: 'Administrador Biblia.ao',
      email: 'admin@biblia.ao',
      passwordHash,
      role: UserRole.SUPER_ADMINISTRADOR,
      country: 'Angola',
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`Utilizador super admin: ${superAdmin.email} (senha inicial: MudarEsta#Senha123 — alterar imediatamente)`);

  // --- Versão bíblica placeholder (substituída pela importação real via API.Bible) ---
  const version = await prisma.bibleVersion.upsert({
    where: { code: 'ARA' },
    update: {},
    create: {
      code: 'ARA',
      name: 'Almeida Revista e Atualizada',
      language: 'pt',
      description: 'Versão de exemplo — substituir por importação via API.Bible (npm run bible:import)',
      isDefault: true,
    },
  });

  const joao = await prisma.bibleBook.upsert({
    where: { versionId_slug: { versionId: version.id, slug: 'joao' } },
    update: {},
    create: {
      versionId: version.id,
      slug: 'joao',
      name: 'João',
      abbreviation: 'Jo',
      testament: 'NT',
      order: 43,
      chaptersCount: 21,
    },
  });

  const chapter3 = await prisma.bibleChapter.upsert({
    where: { bookId_number: { bookId: joao.id, number: 3 } },
    update: {},
    create: { bookId: joao.id, number: 3, versesCount: 36 },
  });

  await prisma.bibleVerse.upsert({
    where: { chapterId_number: { chapterId: chapter3.id, number: 16 } },
    update: {},
    create: {
      chapterId: chapter3.id,
      number: 16,
      reference: 'João 3:16',
      text:
        'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigénito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
    },
  });

  // --- Devocional de exemplo ---
  await prisma.devotional.upsert({
    where: { date: new Date(new Date().toDateString()) },
    update: {},
    create: {
      title: 'O amor que não pereceu',
      slug: `devocional-exemplo-${Date.now()}`,
      date: new Date(new Date().toDateString()),
      verseReference: 'João 3:16',
      verseText:
        'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigénito...',
      reflection:
        'Este é o versículo mais conhecido das Escrituras — e por boas razões. Ele resume o evangelho numa única frase: o amor de Deus, a dádiva de Cristo, a fé como resposta, e a vida eterna como promessa.',
      prayer: 'Senhor, obrigado pelo teu amor que não desiste de nós. Ajuda-nos a viver como quem recebeu este dom. Amém.',
      application: 'Hoje, partilha este versículo com alguém que precisa de esperança.',
      status: ContentStatus.PUBLICADO,
      authorId: superAdmin.id,
    },
  }).catch(() => {
    // Ignorar se já existir devocional para hoje (constraint única em `date`)
  });

  // --- Igreja de exemplo ---
  await prisma.church.create({
    data: {
      name: 'Igreja Exemplo — Biblia.ao',
      denomination: 'Evangélica',
      address: 'Rua Exemplo, 123',
      city: 'Luanda',
      province: 'Luanda',
      country: 'Angola',
      latitude: -8.8383,
      longitude: 13.2344,
      status: 'APROVADA',
      submittedById: superAdmin.id,
    },
  }).catch(() => {});

  console.log('Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
