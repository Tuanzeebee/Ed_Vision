import { Connection } from 'mongoose';
import { StudentGradeSchema } from './schemas/student-grade.schema';

export const predictionProviders = [
  {
    provide: 'STUDENT_GRADE_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('StudentGrade', StudentGradeSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
