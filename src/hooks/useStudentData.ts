import { useQuery } from '@tanstack/react-query';
import {
  getStudentData,
  getExamResults,
  getHomeworks,
  getClassAssignmentsForStudent,
  getClassAnnouncementsForStudent,
  getClassExamResultsForStudent,
} from '../lib/supabase';
import { getStudentClasses } from '../lib/teacherApi';

const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const useStudentData = (userId?: string) => {
  const studentQuery = useQuery({
    queryKey: ['student', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await getStudentData(userId);
      return data ?? null;
    },
    enabled: Boolean(userId),
    staleTime: CACHE_STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const studentId = studentQuery.data?.id;

  const examResultsQuery = useQuery({
    queryKey: ['examResults', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data } = await getExamResults(studentId);
      return data ?? [];
    },
    enabled: Boolean(studentId),
    staleTime: CACHE_STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const homeworksQuery = useQuery({
    queryKey: ['homeworks', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data } = await getHomeworks(studentId);
      return data ?? [];
    },
    enabled: Boolean(studentId),
    staleTime: CACHE_STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const classesQuery = useQuery({
    queryKey: ['studentClasses', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data } = await getStudentClasses(studentId);
      return data ?? [];
    },
    enabled: Boolean(studentId),
    staleTime: CACHE_STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const classAssignmentsQuery = useQuery({
    queryKey: ['classAssignments', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data } = await getClassAssignmentsForStudent(studentId);
      return data ?? [];
    },
    enabled: Boolean(studentId),
    staleTime: CACHE_STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const classAnnouncementsQuery = useQuery({
    queryKey: ['classAnnouncements', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data } = await getClassAnnouncementsForStudent(studentId);
      return data ?? [];
    },
    enabled: Boolean(studentId),
    staleTime: CACHE_STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const classExamResultsQuery = useQuery({
    queryKey: ['classExamResults', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data } = await getClassExamResultsForStudent(studentId);
      return data ?? [];
    },
    enabled: Boolean(studentId),
    staleTime: CACHE_STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const loading =
    studentQuery.isLoading ||
    studentQuery.isFetching ||
    (studentQuery.data === undefined && !studentQuery.isError) ||
    examResultsQuery.isLoading ||
    homeworksQuery.isLoading ||
    classesQuery.isLoading ||
    classAssignmentsQuery.isLoading ||
    classAnnouncementsQuery.isLoading ||
    classExamResultsQuery.isLoading;

  const refetch = () =>
    Promise.all([
      studentQuery.refetch(),
      examResultsQuery.refetch(),
      homeworksQuery.refetch(),
      classesQuery.refetch(),
      classAssignmentsQuery.refetch(),
      classAnnouncementsQuery.refetch(),
      classExamResultsQuery.refetch(),
    ]);

  return {
    studentData: studentQuery.data ?? null,
    examResults: examResultsQuery.data ?? [],
    homeworks: homeworksQuery.data ?? [],
    studentClasses: classesQuery.data ?? [],
    classAssignments: classAssignmentsQuery.data ?? [],
    classAnnouncements: classAnnouncementsQuery.data ?? [],
    classExamResults: classExamResultsQuery.data ?? [],
    loading,
    error: studentQuery.error,
    refetch,
  };
};
