import { useState, useEffect, useRef } from 'react';
import { 
  getStudentData, 
  getExamResults, 
  getHomeworks, 
  getAIRecommendations,
  getClassAssignmentsForStudent,
  getClassAnnouncementsForStudent,
  getClassExamResultsForStudent
} from '../lib/supabase';
import { getStudentClasses } from '../lib/teacherApi';

export const useStudentData = (userId: string | undefined) => {
  const [studentData, setStudentData] = useState<any>(null);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [studentClasses, setStudentClasses] = useState<any[]>([]);
  const [classAssignments, setClassAssignments] = useState<any[]>([]);
  const [classAnnouncements, setClassAnnouncements] = useState<any[]>([]);
  const [classExamResults, setClassExamResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const lastUserId = useRef<string | undefined>(undefined);
  const isFetching = useRef(false);

  const fetchStudentData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Aynı userId için tekrar fetch yapma
    if (lastUserId.current === userId && !isFetching.current) {
      return;
    }

    // Zaten fetch yapılıyorsa bekle
    if (isFetching.current) {
      return;
    }

    lastUserId.current = userId;
    isFetching.current = true;
    setLoading(true);

    try {
      console.log('📊 Fetching student data for:', userId);
      
      const { data: student } = await getStudentData(userId);
      setStudentData(student);

      if (student) {
        const [exams, homeworkList, classes, assignments, announcements, examResults] = await Promise.all([
          getExamResults(student.id),
          getHomeworks(student.id),
          getStudentClasses(student.id),
          getClassAssignmentsForStudent(student.id),
          getClassAnnouncementsForStudent(student.id),
          getClassExamResultsForStudent(student.id)
        ]);

        setExamResults(exams.data || []);
        setHomeworks(homeworkList.data || []);
        setStudentClasses(classes.data || []);
        setClassAssignments(assignments.data || []);
        setClassAnnouncements(announcements.data || []);
        setClassExamResults(examResults.data || []);
        
        console.log('✅ Student data loaded');
      }
    } catch (error) {
      console.error('❌ Error fetching student data:', error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [userId]);

  return {
    studentData,
    examResults,
    homeworks,
    studentClasses,
    classAssignments,
    classAnnouncements,
    classExamResults,
    loading,
    refetch: fetchStudentData
  };
};