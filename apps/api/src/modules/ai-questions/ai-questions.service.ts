import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../../prisma/prisma.service';
import { AskQuestionDto } from './dto/ask-question.dto';

/**
 * "Pergunte à Bíblia" — módulo de IA com arquitetura RAG
 * (Retrieval-Augmented Generation):
 *
 *   1. RECUPERAÇÃO: pesquisa versículos, estudos e devocionais aprovados
 *      relacionados com a pergunta do utilizador (full-text search local;
 *      substituível por pesquisa vetorial/embeddings em produção).
 *   2. GERAÇÃO: envia a pergunta + os trechos recuperados como contexto
 *      a um modelo de linguagem (OpenAI), instruído a responder SOMENTE
 *      com base nesse contexto e a citar as referências usadas.
 *   3. APRESENTAÇÃO: devolve a resposta junto das referências bíblicas
 *      usadas, para que o utilizador possa verificar na própria Bíblia.
 *
 * A IA nunca deve substituir a leitura da Bíblia — apenas ajudar a
 * encontrar e compreender melhor as Escrituras.
 */
@Injectable()
export class AiQuestionsService {
  private readonly logger = new Logger(AiQuestionsService.name);
  private readonly client = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

  constructor(private readonly prisma: PrismaService) {}

  async ask(userId: string | undefined, dto: AskQuestionDto) {
    const start = Date.now();

    const context = await this.retrieveContext(dto.question);

    if (!this.client) {
      const fallback = {
        answer:
          'O serviço de IA ainda não está configurado (falta OPENAI_API_KEY). ' +
          'Aqui estão referências e estudos relacionados encontrados na base de dados:',
        referencesUsed: context.verseReferences,
      };
      return this.persist(userId, dto.question, fallback.answer, context, undefined, Date.now() - start);
    }

    const systemPrompt = `Você é um assistente bíblico do Biblia.ao. Responda SEMPRE com base apenas
no contexto fornecido (versículos e estudos aprovados). Nunca invente referências.
Cite explicitamente as referências bíblicas usadas na resposta. Se o contexto não
for suficiente, diga isso honestamente e sugira ao utilizador ler os capítulos
relacionados. Escreva em português de Angola, num tom pastoral e acolhedor.`;

    const userPrompt = `Pergunta: ${dto.question}

Contexto recuperado:
${context.chunks.join('\n---\n')}`;

    const completion = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content ?? 'Não foi possível gerar uma resposta.';

    return this.persist(
      userId,
      dto.question,
      answer,
      context,
      process.env.OPENAI_MODEL,
      Date.now() - start,
    );
  }

  /** Recupera versículos e estudos/devocionais aprovados relacionados com a pergunta. */
  private async retrieveContext(question: string) {
    const keywords = question
      .toLowerCase()
      .replace(/[^\p{L}\s]/gu, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5);

    const verses = await this.prisma.bibleVerse.findMany({
      where: { OR: keywords.map((k) => ({ text: { contains: k, mode: 'insensitive' as const } })) },
      take: 5,
    });

    const studies = await this.prisma.study.findMany({
      where: {
        status: 'PUBLICADO',
        OR: keywords.map((k) => ({ content: { contains: k, mode: 'insensitive' as const } })),
      },
      take: 3,
      select: { title: true, summary: true, slug: true },
    });

    const chunks = [
      ...verses.map((v) => `${v.reference} — "${v.text}"`),
      ...studies.map((s) => `Estudo "${s.title}": ${s.summary}`),
    ];

    return {
      chunks,
      verseReferences: verses.map((v) => v.reference),
      studySlugs: studies.map((s) => s.slug),
    };
  }

  private async persist(
    userId: string | undefined,
    question: string,
    answer: string,
    context: { verseReferences: string[]; studySlugs: string[] },
    model: string | undefined,
    latencyMs: number,
  ) {
    return this.prisma.aiQuestion.create({
      data: {
        userId,
        question,
        answer,
        referencesUsed: context.verseReferences,
        sourceChunks: context as any,
        model,
        latencyMs,
      },
    });
  }

  myHistory(userId: string) {
    return this.prisma.aiQuestion.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }
}
