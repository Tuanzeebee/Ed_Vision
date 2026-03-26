import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface PredictionFeatures {
  semester_number: number;
  course_code: string;
  study_format: string;
  credits_unit: number;

  // Historical features
  last_score: number;
  mean_prev_score: number;
  score_trend: number;
  score_stability: number;
  score_stability_cv: number;
  recent_improvement: number;
  n_assessments: number;
  study_load: number;

  // External factors from StudentSurveyFactors
  weekly_study_hours: number;
  part_time_hours: number;
  financial_support: number;
  emotional_support: number;
}

interface MLPredictionResponse {
  mode: string;
  model_type: string;
  predicted_score: number;
}

@Injectable()
export class TranscriptPredictionService {
  private readonly logger = new Logger(TranscriptPredictionService.name);
  private readonly mlServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Get ML service URL from environment or use default
    this.mlServiceUrl =
      this.configService.get<string>('PYTHON_ML_API_URL') ||
      'http://localhost:8000';
    this.logger.log(`ML Service URL configured: ${this.mlServiceUrl}`);
  }

  /**
   * Trigger prediction for all courses after transcript upload
   * @param studentCode - Student code from uploaded file
   */
  async triggerPredictionAfterUpload(studentCode: string): Promise<void> {
    try {
      this.logger.log(`Starting prediction for student: ${studentCode}`);

      // 1. Get student_id from student_code
      const student = await this.prisma.student.findUnique({
        where: { student_code: studentCode },
        select: { student_id: true, student_code: true },
      });

      if (!student) {
        throw new BadRequestException(
          `Student with code ${studentCode} not found`,
        );
      }

      // 2. Get external factors from StudentSurveyFactors
      const surveyFactors = await this.prisma.studentSurveyFactors.findUnique({
        where: { student_id: student.student_id },
      });

      // Use default values if no survey data
      const externalFactors = {
        weekly_study_hours: surveyFactors?.study_time_hours || 10, // Default 10 hours/week
        part_time_hours: surveyFactors?.work_time_hours || 0, // Default no part-time work
        financial_support: surveyFactors?.financial_support_score || 50, // Default medium support
        emotional_support: surveyFactors?.mental_health_score || 50, // Default medium mental health
      };

      this.logger.log(`External factors for ${studentCode}:`, externalFactors);

      // 3. Get all completed courses (historical data)
      const completedCourses = await this.prisma.studentCourseRecord.findMany({
        where: {
          student_id: student.student_id,
          status: 'completed',
          raw_score: { not: null },
        },
        include: {
          course: true,
          academicTerm: true,
        },
        orderBy: [
          { academicTerm: { academic_year: 'asc' } },
          { academicTerm: { semester_number: 'asc' } },
        ],
      });

      if (completedCourses.length === 0) {
        this.logger.warn(
          `No completed courses found for ${studentCode}. Cannot calculate historical features.`,
        );
        return;
      }

      // 4. Get all planned courses (courses to predict)
      // Exclude courses with study_format = 'DEM' (Demonstration/Lab courses)
      const plannedCourses = await this.prisma.studentCourseRecord.findMany({
        where: {
          student_id: student.student_id,
          status: 'planned',
          course: {
            study_format: {
              not: 'DEM', // Exclude demonstration/lab courses
            },
          },
        },
        include: {
          course: true,
          academicTerm: true,
        },
      });

      if (plannedCourses.length === 0) {
        this.logger.log(
          `No planned courses found for ${studentCode}. Nothing to predict.`,
        );
        return;
      }

      this.logger.log(
        `Found ${plannedCourses.length} courses to predict for ${studentCode} (excluding DEM courses)`,
      );

      // 5. Calculate historical features
      const scores = completedCourses
        .map((c) => Number(c.raw_score))
        .filter((s) => !isNaN(s) && s > 0);

      const lastScore = scores[scores.length - 1] || 5.0;
      const meanPrevScore =
        scores.length > 0
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : 5.0;

      // Calculate score trend (linear regression slope)
      const scoreTrend = this.calculateScoreTrend(scores);

      // Calculate score stability (standard deviation)
      const scoreStability = this.calculateStandardDeviation(scores);

      // Calculate coefficient of variation
      const scoreStabilityCV =
        meanPrevScore > 0 ? scoreStability / meanPrevScore : 0;

      // Recent improvement (last 3 scores trend)
      const recentScores = scores.slice(-3);
      const recentImprovement =
        recentScores.length >= 2 ? this.calculateScoreTrend(recentScores) : 0;

      const nAssessments = scores.length;

      // Study load: ratio of current semester credits to average
      const avgCredits =
        completedCourses.length > 0
          ? completedCourses.reduce(
              (sum, c) => sum + (c.course?.credits_unit || 0),
              0,
            ) / completedCourses.length
          : 3;

      const historicalFeatures = {
        last_score: lastScore,
        mean_prev_score: meanPrevScore,
        score_trend: scoreTrend,
        score_stability: scoreStability,
        score_stability_cv: scoreStabilityCV,
        recent_improvement: recentImprovement,
        n_assessments: nAssessments,
      };

      this.logger.log(
        `Historical features for ${studentCode}:`,
        historicalFeatures,
      );

      // 6. Predict for each planned course
      for (const plannedCourse of plannedCourses) {
        try {
          // Skip if study_format is DEM (should already be filtered, but double check)
          if (plannedCourse.course?.study_format === 'DEM') {
            this.logger.log(
              `Skipping DEM course: ${plannedCourse.course?.course_code} (Demonstration/Lab course)`,
            );
            continue;
          }

          const studyLoad = plannedCourse.course?.credits_unit
            ? plannedCourse.course.credits_unit / avgCredits
            : 1.0;

          const features: PredictionFeatures = {
            semester_number: plannedCourse.academicTerm?.semester_number || 1,
            course_code: plannedCourse.course?.course_code || '',
            study_format: plannedCourse.course?.study_format || 'LEC',
            credits_unit: plannedCourse.course?.credits_unit || 3,
            ...historicalFeatures,
            study_load: studyLoad,
            ...externalFactors,
          };

          // Call ML service
          const predictedScore = await this.callMLService(features);

          // Save prediction to database
          await this.savePrediction({
            student_id: student.student_id,
            course_id: plannedCourse.course_id!,
            term_id: plannedCourse.term_id,
            predicted_score: predictedScore,
          });

          this.logger.log(
            `Predicted score for ${studentCode} - ${plannedCourse.course?.course_code}: ${predictedScore}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to predict for course ${plannedCourse.course?.course_code}:`,
            error.message,
          );
        }
      }

      this.logger.log(`Completed predictions for student: ${studentCode}`);
    } catch (error) {
      this.logger.error(
        `Error in triggerPredictionAfterUpload for ${studentCode}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Call ML service to get prediction
   */
  private async callMLService(features: PredictionFeatures): Promise<number> {
    try {
      const response = await axios.post<MLPredictionResponse>(
        `${this.mlServiceUrl}/predict`,
        features,
        {
          timeout: 30000, // 30 seconds timeout
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.predicted_score;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `ML Service error: ${error.response?.status} - ${error.response?.data?.detail || error.message}`,
        );
        throw new BadRequestException(
          `ML Service failed: ${error.response?.data?.detail || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Save prediction result to database
   */
  private async savePrediction(data: {
    student_id: number;
    course_id: number;
    term_id: number | null;
    predicted_score: number;
  }): Promise<void> {
    await this.prisma.predictionResult.upsert({
      where: {
        student_id_course_id_model_type_model_version: {
          student_id: data.student_id,
          course_id: data.course_id,
          model_type: 'student',
          model_version: 'xgboost_v1.0',
        },
      },
      update: {
        predicted_gpa: data.predicted_score,
        prediction_confidence: null,
        term_id: data.term_id,
        prediction_status: 'active',
        updated_at: new Date(),
      },
      create: {
        student_id: data.student_id,
        course_id: data.course_id,
        model_type: 'student',
        predicted_gpa: data.predicted_score,
        predicted_fail_warning: data.predicted_score < 4.0, // Warning if score < 4.0
        prediction_confidence: null,
        model_version: 'xgboost_v1.0',
        input_source: 'uploaded_file',
        term_id: data.term_id,
        prediction_status: 'active',
      },
    });
  }

  /**
   * Calculate linear trend (slope) of scores
   */
  private calculateScoreTrend(scores: number[]): number {
    if (scores.length < 2) return 0;

    const n = scores.length;
    const xMean = (n - 1) / 2; // Index mean
    const yMean = scores.reduce((sum, s) => sum + s, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (scores[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(scores: number[]): number {
    if (scores.length === 0) return 0;

    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;

    return Math.sqrt(variance);
  }

  /**
   * Get predictions for a student
   */
  async getPredictions(
    studentId: number,
    courseId?: number,
    modelType?: string,
  ) {
    const where: any = {
      student_id: studentId,
      prediction_status: 'active',
    };

    if (courseId) {
      where.course_id = courseId;
    }

    if (modelType) {
      where.model_type = modelType;
    } else {
      // Default to student model
      where.model_type = 'student';
    }

    const predictions = await this.prisma.predictionResult.findMany({
      where,
      include: {
        course: true,
        academicTerm: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return predictions.map((p) => ({
      prediction_id: p.prediction_id,
      student_id: p.student_id,
      course_id: p.course_id,
      course_code: p.course?.course_code || '',
      course_name: p.course?.course_name || '',
      predicted_gpa: Number(p.predicted_gpa),
      predicted_fail_warning: p.predicted_fail_warning || false,
      prediction_confidence: p.prediction_confidence
        ? Number(p.prediction_confidence)
        : null,
      model_type: p.model_type,
      model_version: p.model_version,
      term_id: p.term_id,
      academic_year: p.academicTerm?.academic_year || null,
      semester_number: p.academicTerm?.semester_number || null,
      created_at: p.created_at,
    }));
  }
}
