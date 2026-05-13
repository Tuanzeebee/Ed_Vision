import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { clampIrtB } from '../utils/irt-bootstrap.util';

@Injectable()
export class IrtRecalibrationService {
  private readonly logger = new Logger(IrtRecalibrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Re-calibrates irt_b for questions with enough real-world responses.
   * Triggered manually or by a cron job.
   */
  async recalibrateAll(minResponses = 50): Promise<{ updated: number }> {
    const questions = await this.prisma.ieltsQuestion.findMany({
      where: {
        usedCount: { gte: minResponses },
        status: 'approved',
        irtA: { not: null },
      },
    });

    let updatedCount = 0;
    for (const q of questions) {
      const newB = this.calculateNewB(
        Number(q.correctRate ?? 0.5),
        Number(q.irtA ?? 1.0),
        Number(q.irtC ?? 0.0),
        Number(q.irtB ?? 0.0),
      );

      if (Math.abs(newB - Number(q.irtB)) > 0.05) {
        await this.prisma.ieltsQuestion.update({
          where: { id: q.id },
          data: { irtB: newB },
        });
        updatedCount++;
      }
    }

    this.logger.log(`Recalibration complete: ${updatedCount} questions updated.`);
    return { updated: updatedCount };
  }

  /**
   * Simple difficulty re-estimation based on observed correct rate.
   * Based on the inverse of the 3PL IRT model.
   * P(theta) = c + (1 - c) / (1 + exp(-a * (theta - b)))
   */
  private calculateNewB(p: number, a: number, c: number, currentB: number): number {
    // Prevent math errors with extreme probabilities
    const safeP = Math.max(c + 0.01, Math.min(0.99, p));
    
    // Reverse 3PL: 
    // (P - c) / (1 - c) = 1 / (1 + exp(-a * (theta - b)))
    // Let P_adj = (P - c) / (1 - c)
    // 1 / P_adj = 1 + exp(-a * (theta - b))
    // 1 / P_adj - 1 = exp(-a * (theta - b))
    // ln(1 / P_adj - 1) = -a * (theta - b)
    // b = theta + ln(1 / P_adj - 1) / a
    
    // We assume the average student attempting this question is at 'currentB' 
    // if we don't have their individual thetas. 
    // In a more advanced version, we would use the average theta of students who answered.
    
    const pAdj = (safeP - c) / (1 - c);
    const logit = Math.log(1 / pAdj - 1);
    const newB = currentB + logit / a;

    return clampIrtB(newB);
  }
}
