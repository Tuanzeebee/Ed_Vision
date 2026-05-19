import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { tryDecryptString } from '../../common/crypto.util';

@Injectable()
export class ExamViewerService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get all TOEIC/IELTS Mock Test repositories (ExamRepository)
   */
  async getToeicRepositories(skillArea?: string) {
    const where: any = { cert_type: 'toeic' };
    if (skillArea) {
      where.skill_area = skillArea;
    }

    const repositories = await this.prisma.examRepository.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        skill_area: true,
        total_items: true,
        is_published: true,
        created_at: true,
        pass_score: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Check answer key status for each repository
    const repositoriesWithAnswerKey = await Promise.all(
      repositories.map(async (repo) => {
        const items = await this.prisma.examRepositoryItem.findMany({
          where: { repository_id: repo.id },
          select: {
            id: true,
            options: {
              select: { is_correct: true },
            },
          },
        });

        const totalItems = items.length;
        const itemsWithAnswer = items.filter((item) =>
          item.options.some((opt) => opt.is_correct),
        ).length;

        return {
          ...repo,
          has_answer_key: itemsWithAnswer === totalItems && totalItems > 0,
          answer_key_configured_items: itemsWithAnswer,
          answer_key_missing_items: totalItems - itemsWithAnswer,
        };
      }),
    );

    return repositoriesWithAnswerKey;
  }

  /**
   * Get detailed questions from a TOEIC/IELTS Mock Test repository with decryption
   */
  async getToeicRepositoryDetail(slug: string) {
    const repository = await this.prisma.examRepository.findUnique({
      where: { slug },
      include: {
        items: {
          include: {
            options: {
              orderBy: { sort_order: 'asc' },
            },
          },
          orderBy: { item_order: 'asc' },
        },
      },
    });

    if (!repository) {
      throw new Error('Repository not found');
    }

    // Decrypt sensitive fields
    const decryptedItems = repository.items.map((item) => {
      const decryptedOptions = item.options.map((opt) => ({
        ...opt,
        option_text: tryDecryptString(opt.option_text),
        rationale: opt.rationale ? tryDecryptString(opt.rationale) : null,
      }));

      return {
        ...item,
        stem: tryDecryptString(item.stem),
        reading_passage: item.reading_passage
          ? tryDecryptString(item.reading_passage)
          : null,
        hint: item.hint ? tryDecryptString(item.hint) : null,
        options: decryptedOptions,
      };
    });

    return {
      ...repository,
      items: decryptedItems,
    };
  }

  /**
   * TOEIC practice import stores rows in ToeicPracticeQuestion (+ ToeicPracticeOption),
   * grouped by source_slug (practice_set_id from import UI).
   */
  async getToeicPracticeSets() {
    const questions = await this.prisma.toeicPracticeQuestion.findMany({
      select: {
        skill_area: true,
        part: true,
        score_band_min: true,
        score_band_max: true,
        source_slug: true,
        created_at: true,
        id: true,
        options: {
          select: { is_correct: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const grouped = new Map<string, any>();

    for (const q of questions) {
      const key =
        q.source_slug?.trim() ||
        `${q.skill_area}-${q.score_band_min}-${q.score_band_max}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          practice_set_id: key,
          title: q.source_slug
            ? `TOEIC ${q.skill_area} — ${q.source_slug}`
            : `TOEIC ${q.skill_area} (${q.score_band_min}–${q.score_band_max})`,
          skill_area: q.skill_area,
          score_band_min: q.score_band_min,
          score_band_max: q.score_band_max,
          total_items: 0,
          created_at: q.created_at,
          has_answer_key_count: 0,
        });
      }

      const group = grouped.get(key);
      group.total_items += 1;
      if (q.options.some((opt) => opt.is_correct)) {
        group.has_answer_key_count += 1;
      }
      if (q.created_at > group.created_at) {
        group.created_at = q.created_at;
      }
    }

    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        has_answer_key:
          group.has_answer_key_count === group.total_items &&
          group.total_items > 0,
      }))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }

  /**
   * Get detailed questions from a TOEIC practice set with decryption
   */
  async getToeicPracticeDetail(practiceSetId: string) {
    const include = {
      options: {
        orderBy: { sort_order: 'asc' as const },
      },
    };
    const orderBy = [
      { part: 'asc' as const },
      { source_item_id: 'asc' as const },
      { id: 'asc' as const },
    ];

    let questions = await this.prisma.toeicPracticeQuestion.findMany({
      where: { source_slug: practiceSetId },
      include,
      orderBy,
    });

    if (questions.length === 0) {
      const bandMatch = practiceSetId.match(/^([a-z_]+)-(\d+)-(\d+)$/i);
      if (bandMatch) {
        questions = await this.prisma.toeicPracticeQuestion.findMany({
          where: {
            skill_area: bandMatch[1],
            score_band_min: parseInt(bandMatch[2], 10),
            score_band_max: parseInt(bandMatch[3], 10),
          },
          include,
          orderBy,
        });
      }
    }

    if (questions.length === 0) {
      throw new Error('Practice set not found');
    }

    const first = questions[0];
    const skillArea = first.skill_area;
    const scoreBandMin = first.score_band_min;
    const scoreBandMax = first.score_band_max;

    // Decrypt sensitive fields
    const decryptedQuestions = questions.map((q) => {
      const decryptedOptions = q.options.map((opt) => ({
        ...opt,
        option_text: tryDecryptString(opt.option_text),
        rationale: opt.rationale ? tryDecryptString(opt.rationale) : null,
      }));

      return {
        ...q,
        stem: tryDecryptString(q.stem),
        reading_passage: q.reading_passage
          ? tryDecryptString(q.reading_passage)
          : null,
        explanation: q.explanation ? tryDecryptString(q.explanation) : null,
        ai_explanation: q.ai_explanation
          ? tryDecryptString(q.ai_explanation)
          : null,
        options: decryptedOptions,
      };
    });

    return {
      practice_set_id: practiceSetId,
      skill_area: skillArea,
      score_band_min: scoreBandMin,
      score_band_max: scoreBandMax,
      total_questions: decryptedQuestions.length,
      questions: decryptedQuestions,
      items: decryptedQuestions,
    };
  }

  /**
   * TOEIC diagnostic import → DiagnosticRepository + DiagnosticRepositoryItem + DiagnosticRepositoryOption
   */
  async getToeicDiagnosticTests() {
    const tests = await this.prisma.diagnosticRepository.findMany({
      where: { cert_type: 'toeic' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        cert_type: true,
        total_items: true,
        is_published: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Check answer key status
    const testsWithAnswerKey = await Promise.all(
      tests.map(async (test) => {
        const items = await this.prisma.diagnosticRepositoryItem.findMany({
          where: { repository_id: test.id },
          select: {
            id: true,
            options: {
              select: { is_correct: true },
            },
          },
        });

        const totalItems = items.length;
        const itemsWithAnswer = items.filter((item) =>
          item.options.some((opt) => opt.is_correct),
        ).length;

        return {
          ...test,
          has_answer_key: itemsWithAnswer === totalItems && totalItems > 0,
        };
      }),
    );

    return testsWithAnswerKey;
  }

  /**
   * Get detailed questions from a TOEIC diagnostic test with decryption
   */
  async getToeicDiagnosticDetail(slug: string) {
    const repository = await this.prisma.diagnosticRepository.findUnique({
      where: { slug },
      include: {
        items: {
          include: {
            options: {
              orderBy: { sort_order: 'asc' },
            },
          },
          orderBy: { item_order: 'asc' },
        },
      },
    });

    if (!repository) {
      throw new Error('Diagnostic test not found');
    }

    // Decrypt sensitive fields
    const decryptedItems = repository.items.map((item) => {
      const decryptedOptions = item.options.map((opt) => ({
        ...opt,
        option_text: tryDecryptString(opt.option_text),
      }));

      return {
        ...item,
        stem: tryDecryptString(item.stem),
        reading_passage: item.reading_passage
          ? tryDecryptString(item.reading_passage)
          : null,
        options: decryptedOptions,
      };
    });

    return {
      ...repository,
      items: decryptedItems,
    };
  }

  /**
   * Get all IELTS repositories (Mock Tests)
   */
  async getIeltsRepositories(skillArea?: string) {
    const where: any = { cert_type: 'ielts' };
    if (skillArea) {
      where.skill_area = skillArea;
    }

    const repositories = await this.prisma.examRepository.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        skill_area: true,
        total_items: true,
        is_published: true,
        created_at: true,
        pass_score: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Check answer key status for each repository
    const repositoriesWithAnswerKey = await Promise.all(
      repositories.map(async (repo) => {
        const items = await this.prisma.examRepositoryItem.findMany({
          where: { repository_id: repo.id },
          select: {
            id: true,
            options: {
              select: { is_correct: true },
            },
          },
        });

        const totalItems = items.length;
        const itemsWithAnswer = items.filter((item) =>
          item.options.some((opt) => opt.is_correct),
        ).length;

        return {
          ...repo,
          has_answer_key: itemsWithAnswer === totalItems && totalItems > 0,
          answer_key_configured_items: itemsWithAnswer,
          answer_key_missing_items: totalItems - itemsWithAnswer,
        };
      }),
    );

    return repositoriesWithAnswerKey;
  }

  /**
   * Get detailed questions from an IELTS repository with decryption
   */
  async getIeltsRepositoryDetail(slug: string) {
    // Same as TOEIC, just verify it's IELTS
    const repository = await this.prisma.examRepository.findFirst({
      where: { slug, cert_type: 'ielts' },
      include: {
        items: {
          include: {
            options: {
              orderBy: { sort_order: 'asc' },
            },
          },
          orderBy: { item_order: 'asc' },
        },
      },
    });

    if (!repository) {
      throw new Error('IELTS Repository not found');
    }

    // Decrypt sensitive fields
    const decryptedItems = repository.items.map((item) => {
      const decryptedOptions = item.options.map((opt) => ({
        ...opt,
        option_text: tryDecryptString(opt.option_text),
        rationale: opt.rationale ? tryDecryptString(opt.rationale) : null,
      }));

      return {
        ...item,
        stem: tryDecryptString(item.stem),
        reading_passage: item.reading_passage
          ? tryDecryptString(item.reading_passage)
          : null,
        hint: item.hint ? tryDecryptString(item.hint) : null,
        options: decryptedOptions,
      };
    });

    return {
      ...repository,
      items: decryptedItems,
    };
  }

  /**
   * IELTS practice import → LearningRepository (content_type: practice) + items/options
   */
  async getIeltsPracticeSets() {
    const repositories = await this.prisma.learningRepository.findMany({
      where: {
        cert_type: 'ielts',
        content_type: { in: ['practice', 'practice_set'] },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        skill_area: true,
        target_score_min: true,
        target_score_max: true,
        total_items: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Check answer key status for each repository
    const repositoriesWithAnswerKey = await Promise.all(
      repositories.map(async (repo) => {
        const items = await this.prisma.learningRepositoryItem.findMany({
          where: { repository_id: repo.id },
          select: {
            id: true,
            options: {
              select: { is_correct: true },
            },
          },
        });

        const totalItems = items.length;
        const itemsWithAnswer = items.filter((item) =>
          item.options.some((opt) => opt.is_correct),
        ).length;

        return {
          practice_set_id: repo.slug,
          title: repo.title,
          skill_area: repo.skill_area,
          band_min: repo.target_score_min,
          band_max: repo.target_score_max,
          total_items: totalItems,
          created_at: repo.created_at,
          has_answer_key: itemsWithAnswer === totalItems && totalItems > 0,
          has_answer_key_count: itemsWithAnswer,
        };
      }),
    );

    return repositoriesWithAnswerKey;
  }

  /**
   * Get detailed questions from an IELTS practice set (LearningRepository) with decryption
   */
  async getIeltsPracticeDetail(practiceSetId: string) {
    // practiceSetId is the slug of LearningRepository
    const repository = await this.prisma.learningRepository.findUnique({
      where: { slug: practiceSetId },
      include: {
        items: {
          include: {
            options: {
              orderBy: { sort_order: 'asc' },
            },
          },
          orderBy: { item_order: 'asc' },
        },
      },
    });

    if (!repository) {
      throw new Error('IELTS Practice set not found');
    }

    // Decrypt sensitive fields
    const decryptedItems = repository.items.map((item) => {
      const decryptedOptions = item.options.map((opt) => ({
        ...opt,
        option_text: tryDecryptString(opt.option_text),
        rationale: opt.rationale ? tryDecryptString(opt.rationale) : null,
      }));

      return {
        ...item,
        stem: tryDecryptString(item.stem),
        reading_passage: item.reading_passage
          ? tryDecryptString(item.reading_passage)
          : null,
        hint: item.hint ? tryDecryptString(item.hint) : null,
        explanation: item.explanation ? tryDecryptString(item.explanation) : null,
        ai_explanation: item.ai_explanation
          ? tryDecryptString(item.ai_explanation)
          : null,
        options: decryptedOptions,
      };
    });

    return {
      practice_set_id: practiceSetId,
      skill_area: repository.skill_area,
      band_min: repository.target_score_min,
      band_max: repository.target_score_max,
      total_questions: decryptedItems.length,
      title: repository.title,
      description: repository.description,
      questions: decryptedItems,
      items: decryptedItems,
    };
  }

  /**
   * IELTS diagnostic import → ielts_questions (is_placement = true, status approved/draft)
   */
  async getIeltsDiagnosticTests() {
    const questions = await this.prisma.ieltsQuestion.findMany({
      where: {
        isPlacement: true,
        status: { in: ['approved', 'published', 'draft'] },
      },
      select: {
        skill: true,
        bandMin: true,
        bandMax: true,
        createdAt: true,
        id: true,
        correctAnswer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by skill and band range
    const grouped = new Map<string, any>();
    
    questions.forEach((q) => {
      const bandMin = Number(q.bandMin);
      const bandMax = Number(q.bandMax);
      const key = `${q.skill}-${bandMin}-${bandMax}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          slug: key,
          title: `IELTS Diagnostic - ${q.skill} (Band ${bandMin}–${bandMax})`,
          skill_area: q.skill,
          band_min: bandMin,
          band_max: bandMax,
          cert_type: 'ielts',
          total_items: 0,
          is_published: true,
          created_at: q.createdAt,
          has_answer_key_count: 0,
        });
      }
      
      const group = grouped.get(key);
      group.total_items += 1;
      if (q.correctAnswer) {
        group.has_answer_key_count += 1;
      }
    });

    return Array.from(grouped.values()).map((group) => ({
      ...group,
      has_answer_key: group.has_answer_key_count === group.total_items && group.total_items > 0,
    }));
  }

  /**
   * Get detailed questions from an IELTS diagnostic test (PostgreSQL IeltsQuestion) with decryption
   */
  async getIeltsDiagnosticDetail(slug: string) {
    const match = slug.match(/^([a-z_]+)-([\d.]+)-([\d.]+)$/i);
    if (!match) {
      throw new Error('Invalid IELTS diagnostic slug');
    }
    const skill = match[1];
    const bandMin = parseFloat(match[2]);
    const bandMax = parseFloat(match[3]);

    const questions = await this.prisma.ieltsQuestion.findMany({
      where: {
        skill,
        bandMin,
        bandMax,
        isPlacement: true,
        status: { in: ['approved', 'published', 'draft'] },
      },
      include: {
        passage: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!questions || questions.length === 0) {
      throw new Error('IELTS Diagnostic test not found');
    }

    const decryptedQuestions = questions.map((q, index) => {
      const questionText = tryDecryptString(q.questionText);
      const explanation = q.explanation
        ? tryDecryptString(q.explanation)
        : null;
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const options = rawOptions.map((opt: { key?: string; text?: string }) => ({
        option_key: opt.key ?? '',
        option_text: opt.text ? tryDecryptString(opt.text) : '',
        is_correct: (opt.key ?? '') === q.correctAnswer,
      }));

      return {
        ...q,
        question_number: index + 1,
        stem: questionText,
        questionText,
        explanation,
        options,
        reading_passage: q.passage
          ? tryDecryptString(q.passage.content)
          : null,
        passage: q.passage
          ? {
              ...q.passage,
              content: tryDecryptString(q.passage.content),
            }
          : null,
      };
    });

    return {
      slug,
      title: `IELTS Diagnostic - ${skill} (Band ${bandMin}–${bandMax})`,
      skill_area: skill,
      band_min: bandMin,
      band_max: bandMax,
      cert_type: 'ielts',
      total_items: decryptedQuestions.length,
      items: decryptedQuestions,
      questions: decryptedQuestions,
    };
  }
}
