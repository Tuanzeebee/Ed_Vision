import { Connection } from 'mongoose';
import { StudentGradeSchema } from './schemas/student-grade.schema';
import { GradeStructureSchema } from '../../mongodb/schemas/grade-structure.schema';

export const predictionProviders = [
  {
    provide: 'STUDENT_GRADE_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('StudentGrade', StudentGradeSchema),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'GRADE_STRUCTURE_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('GradeStructure', GradeStructureSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
 