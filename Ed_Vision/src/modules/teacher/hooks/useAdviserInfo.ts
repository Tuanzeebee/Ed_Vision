import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../services/api/fetch';

export interface AdviserClass {
  assignmentId: number;
  classId: number;
  classCode: string;
  cohortYear: number;
  status: string | null;
  programId: number | null;
  programName: string | null;
  studentCount: number;
  assignedDate: string | null;
  endedDate: string | null;
  note: string | null;
}

interface AdviserCheckResponse {
  isAdviser: boolean;
  classCount: number;
}

/**
 * Hook to check if instructor is an adviser and get their assigned classes
 */
export function useAdviserInfo(instructorId: number | null) {
  const [isAdviser, setIsAdviser] = useState<boolean | null>(null);
  const [adviserClasses, setAdviserClasses] = useState<AdviserClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdviserInfo = useCallback(async () => {
    if (!instructorId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if instructor is an adviser
      const checkResult: AdviserCheckResponse = await apiFetch(
        `/instructor-availability/${instructorId}/is-adviser`
      );

      setIsAdviser(checkResult.isAdviser);

      if (checkResult.isAdviser) {
        // Get list of adviser classes
        const classes: AdviserClass[] = await apiFetch(
          `/instructor-availability/${instructorId}/adviser-classes`
        );
        setAdviserClasses(classes);

        // Auto-select first class if available
        if (classes.length > 0 && !selectedClassId) {
          setSelectedClassId(classes[0].classId);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Không thể kiểm tra thông tin cố vấn';
      setError(errorMessage);
      setIsAdviser(false);
    } finally {
      setLoading(false);
    }
  }, [instructorId, selectedClassId]);

  useEffect(() => {
    fetchAdviserInfo();
  }, [fetchAdviserInfo]);

  return {
    isAdviser,
    adviserClasses,
    selectedClassId,
    setSelectedClassId,
    loading,
    error,
    refetch: fetchAdviserInfo,
  };
}
