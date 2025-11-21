import { supabase } from './supabase';

/**
 * Analytics types and interfaces
 */

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AnalyticsFilters {
  dateRange?: DateRange;
  subject?: string;
  examBlueprintId?: string;
}

export interface PerformanceTrend {
  date: string;
  averageScore: number;
  totalExams: number;
  studentsCount: number;
}

export interface SubjectPerformance {
  subject: string;
  averageScore: number;
  totalExams: number;
  correctRate: number;
}

export interface StudentAnalytics {
  id: string;
  fullName: string;
  email: string;
  totalExams: number;
  averageScore: number;
  correctRate: number;
  lastExamDate: string | null;
  trend: 'improving' | 'declining' | 'stable';
}

export interface TeacherActivity {
  teacherId: string;
  teacherName: string;
  examsCreated: number;
  questionsCreated: number;
  averageExamDifficulty: string;
  studentsAssigned: number;
}

export interface AnalyticsSummary {
  totalStudents: number;
  totalTeachers: number;
  totalExamsCompleted: number;
  averageScore: number;
  activeStudentsThisWeek: number;
  completionRate: number;
}

/**
 * Get analytics summary for institution
 */
export async function getInstitutionAnalyticsSummary(
  institutionId: string,
  filters?: AnalyticsFilters
): Promise<AnalyticsSummary> {
  try {
    // Build date filter
    let examQuery = supabase
      .from('institution_exam_results')
      .select('*, student:institution_student_requests!institution_exam_results_student_id_fkey(id)')
      .eq('institution_id', institutionId);

    if (filters?.dateRange) {
      examQuery = examQuery
        .gte('completed_at', filters.dateRange.startDate)
        .lte('completed_at', filters.dateRange.endDate);
    }

    const [studentsResult, teachersResult, examsResult] = await Promise.all([
      supabase
        .from('institution_student_requests')
        .select('id', { count: 'exact' })
        .eq('institution_id', institutionId)
        .eq('status', 'approved'),

      supabase
        .from('institution_members')
        .select('id', { count: 'exact' })
        .eq('institution_id', institutionId)
        .in('role', ['teacher', 'owner', 'manager']),

      examQuery,
    ]);

    const totalStudents = studentsResult.count || 0;
    const totalTeachers = teachersResult.count || 0;
    const exams = examsResult.data || [];
    const totalExamsCompleted = exams.length;

    // Calculate average score
    const validScores = exams.filter(e => e.score !== null).map(e => e.score);
    const averageScore = validScores.length > 0
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
      : 0;

    // Calculate active students this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const activeStudentsThisWeek = new Set(
      exams
        .filter(e => e.completed_at && new Date(e.completed_at) >= oneWeekAgo)
        .map(e => e.student_id)
        .filter(Boolean)
    ).size;

    // Calculate completion rate (students who completed at least one exam)
    const studentsWithExams = new Set(exams.map(e => e.student_id).filter(Boolean)).size;
    const completionRate = totalStudents > 0 ? (studentsWithExams / totalStudents) * 100 : 0;

    return {
      totalStudents,
      totalTeachers,
      totalExamsCompleted,
      averageScore: parseFloat(averageScore.toFixed(2)),
      activeStudentsThisWeek,
      completionRate: parseFloat(completionRate.toFixed(2)),
    };
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    throw error;
  }
}

/**
 * Get performance trends over time
 */
export async function getPerformanceTrends(
  institutionId: string,
  filters?: AnalyticsFilters
): Promise<PerformanceTrend[]> {
  try {
    let query = supabase
      .from('institution_exam_results')
      .select('completed_at, score, student_id')
      .eq('institution_id', institutionId)
      .not('completed_at', 'is', null)
      .not('score', 'is', null)
      .order('completed_at', { ascending: true });

    if (filters?.dateRange) {
      query = query
        .gte('completed_at', filters.dateRange.startDate)
        .lte('completed_at', filters.dateRange.endDate);
    }

    const { data: exams, error } = await query;

    if (error) throw error;
    if (!exams || exams.length === 0) return [];

    // Group by date (YYYY-MM-DD)
    const groupedByDate = exams.reduce((acc, exam) => {
      const date = exam.completed_at!.split('T')[0]; // Get date part only
      if (!acc[date]) {
        acc[date] = {
          scores: [],
          students: new Set(),
          count: 0,
        };
      }
      acc[date].scores.push(exam.score);
      acc[date].students.add(exam.student_id);
      acc[date].count++;
      return acc;
    }, {} as Record<string, { scores: number[]; students: Set<string>; count: number }>);

    // Convert to array and calculate averages
    return Object.entries(groupedByDate)
      .map(([date, data]) => ({
        date,
        averageScore: parseFloat((data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length).toFixed(2)),
        totalExams: data.count,
        studentsCount: data.students.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching performance trends:', error);
    throw error;
  }
}

/**
 * Get subject performance breakdown
 */
export async function getSubjectPerformance(
  institutionId: string,
  filters?: AnalyticsFilters
): Promise<SubjectPerformance[]> {
  try {
    let query = supabase
      .from('institution_exam_results')
      .select(`
        score,
        correct_count,
        wrong_count,
        empty_count,
        blueprint:institution_exam_blueprints!institution_exam_results_exam_blueprint_id_fkey(subject)
      `)
      .eq('institution_id', institutionId)
      .not('score', 'is', null);

    if (filters?.dateRange) {
      query = query
        .gte('completed_at', filters.dateRange.startDate)
        .lte('completed_at', filters.dateRange.endDate);
    }

    const { data: exams, error } = await query;

    if (error) throw error;
    if (!exams || exams.length === 0) return [];

    // Group by subject
    const groupedBySubject = exams.reduce((acc, exam: any) => {
      const subject = exam.blueprint?.subject || 'Belirtilmemiş';
      if (!acc[subject]) {
        acc[subject] = {
          scores: [],
          correct: 0,
          total: 0,
        };
      }
      acc[subject].scores.push(exam.score);
      acc[subject].correct += exam.correct_count || 0;
      acc[subject].total += (exam.correct_count || 0) + (exam.wrong_count || 0) + (exam.empty_count || 0);
      return acc;
    }, {} as Record<string, { scores: number[]; correct: number; total: number }>);

    // Convert to array
    return Object.entries(groupedBySubject)
      .map(([subject, data]) => ({
        subject,
        averageScore: parseFloat((data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length).toFixed(2)),
        totalExams: data.scores.length,
        correctRate: data.total > 0 ? parseFloat(((data.correct / data.total) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
  } catch (error) {
    console.error('Error fetching subject performance:', error);
    throw error;
  }
}

/**
 * Get student analytics with rankings
 */
export async function getStudentAnalytics(
  institutionId: string,
  filters?: AnalyticsFilters,
  limit = 50
): Promise<StudentAnalytics[]> {
  try {
    // Get students
    const { data: students, error: studentsError } = await supabase
      .from('institution_student_requests')
      .select('id, full_name, email')
      .eq('institution_id', institutionId)
      .eq('status', 'approved')
      .limit(limit);

    if (studentsError) throw studentsError;
    if (!students || students.length === 0) return [];

    // Get exam results
    const studentIds = students.map(s => s.id);
    let query = supabase
      .from('institution_exam_results')
      .select('student_id, score, correct_count, wrong_count, empty_count, completed_at')
      .eq('institution_id', institutionId)
      .in('student_id', studentIds)
      .not('score', 'is', null)
      .order('completed_at', { ascending: true });

    if (filters?.dateRange) {
      query = query
        .gte('completed_at', filters.dateRange.startDate)
        .lte('completed_at', filters.dateRange.endDate);
    }

    const { data: exams, error: examsError } = await query;
    if (examsError) throw examsError;

    // Process each student
    const analytics: StudentAnalytics[] = students.map(student => {
      const studentExams = exams?.filter(e => e.student_id === student.id) || [];
      const totalExams = studentExams.length;
      const scores = studentExams.map(e => e.score);
      const averageScore = totalExams > 0
        ? scores.reduce((sum, s) => sum + s, 0) / totalExams
        : 0;

      // Calculate correct rate
      const totalCorrect = studentExams.reduce((sum, e) => sum + (e.correct_count || 0), 0);
      const totalQuestions = studentExams.reduce((sum, e) =>
        sum + (e.correct_count || 0) + (e.wrong_count || 0) + (e.empty_count || 0), 0
      );
      const correctRate = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      // Calculate trend (compare last 3 exams with previous 3)
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (totalExams >= 6) {
        const recentScores = scores.slice(-3);
        const previousScores = scores.slice(-6, -3);
        const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / 3;
        const previousAvg = previousScores.reduce((sum, s) => sum + s, 0) / 3;
        const diff = recentAvg - previousAvg;
        if (diff > 5) trend = 'improving';
        else if (diff < -5) trend = 'declining';
      }

      // Get last exam date
      const lastExamDate = totalExams > 0 && studentExams[totalExams - 1].completed_at
        ? studentExams[totalExams - 1].completed_at
        : null;

      return {
        id: student.id,
        fullName: student.full_name,
        email: student.email,
        totalExams,
        averageScore: parseFloat(averageScore.toFixed(2)),
        correctRate: parseFloat(correctRate.toFixed(2)),
        lastExamDate,
        trend,
      };
    });

    // Sort by average score descending
    return analytics.sort((a, b) => b.averageScore - a.averageScore);
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    throw error;
  }
}

/**
 * Get teacher activity metrics
 */
export async function getTeacherActivity(
  institutionId: string
): Promise<TeacherActivity[]> {
  try {
    // Get teachers
    const { data: teachers, error: teachersError } = await supabase
      .from('institution_members')
      .select(`
        user_id,
        user:profiles!institution_members_user_id_fkey(full_name)
      `)
      .eq('institution_id', institutionId)
      .in('role', ['teacher', 'owner', 'manager']);

    if (teachersError) throw teachersError;
    if (!teachers || teachers.length === 0) return [];

    const teacherIds = teachers.map(t => t.user_id);

    // Get exams created by teachers
    const { data: blueprints, error: blueprintsError } = await supabase
      .from('institution_exam_blueprints')
      .select('created_by, subject')
      .eq('institution_id', institutionId)
      .in('created_by', teacherIds);

    if (blueprintsError) throw blueprintsError;

    // Get questions created by teachers
    const { data: questions, error: questionsError } = await supabase
      .from('institution_questions')
      .select('created_by, difficulty')
      .eq('institution_id', institutionId)
      .in('created_by', teacherIds);

    if (questionsError) throw questionsError;

    // Process each teacher
    const activities: TeacherActivity[] = teachers.map((teacher: any) => {
      const teacherBlueprints = blueprints?.filter(b => b.created_by === teacher.user_id) || [];
      const teacherQuestions = questions?.filter(q => q.created_by === teacher.user_id) || [];

      // Calculate average difficulty
      const difficulties = teacherQuestions.map(q => q.difficulty);
      const difficultyMap = { easy: 1, medium: 2, hard: 3 };
      const avgDifficultyScore = difficulties.length > 0
        ? difficulties.reduce((sum, d) => sum + (difficultyMap[d as keyof typeof difficultyMap] || 2), 0) / difficulties.length
        : 2;
      const avgDifficulty = avgDifficultyScore < 1.5 ? 'Kolay' : avgDifficultyScore < 2.5 ? 'Orta' : 'Zor';

      return {
        teacherId: teacher.user_id,
        teacherName: teacher.user?.full_name || 'Bilinmiyor',
        examsCreated: teacherBlueprints.length,
        questionsCreated: teacherQuestions.length,
        averageExamDifficulty: avgDifficulty,
        studentsAssigned: 0, // TODO: Implement student assignment tracking
      };
    });

    return activities.sort((a, b) => b.examsCreated - a.examsCreated);
  } catch (error) {
    console.error('Error fetching teacher activity:', error);
    throw error;
  }
}
