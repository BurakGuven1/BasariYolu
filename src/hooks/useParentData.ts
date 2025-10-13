import { useState, useEffect, useRef } from 'react';
import { 
  getParentData, 
  getExamResults, 
  getHomeworks, 
  getStudySession 
} from '../lib/supabase';

export const useParentData = (userId: string | undefined) => {
  const [parentData, setParentData] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const lastUserId = useRef<string | undefined>(undefined);
  const isFetching = useRef(false);

  const fetchData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Aynı userId için tekrar fetch yapma
    if (lastUserId.current === userId || isFetching.current) {
      return;
    }

    lastUserId.current = userId;
    isFetching.current = true;
    setLoading(true);

    try {
      console.log('👨‍👩‍👧 Fetching parent data for:', userId);

      // Temporary parent login
      if (userId.startsWith('parent_')) {
        const tempUser = JSON.parse(localStorage.getItem('tempParentUser') || '{}');
        
        if (tempUser.connectedStudents && tempUser.connectedStudents.length > 0) {
          const childrenWithData = tempUser.connectedStudents.map((student: any) => ({
            ...student,
            exam_results: student.exam_results || [],
            homeworks: student.homeworks || [],
            study_sessions: student.study_sessions || [],
            weekly_study_goal: student.weekly_study_goal,
            profiles: student.profiles || {
              full_name: student.full_name || 'Öğrenci',
              email: student.email || ''
            }
          }));
          
          console.log('✅ Parent data loaded:', childrenWithData.length, 'children');
          setChildren(childrenWithData);
        } else {
          setChildren([]);
        }
      } else {
        // Regular parent login
        const { data: parent } = await getParentData(userId);
        setParentData(parent);

        if (parent?.parent_student_connections) {
          const childrenWithData = await Promise.all(
            parent.parent_student_connections.map(async (connection: any) => {
              const student = connection.students;
              
              const [examResults, homeworks, studySessions] = await Promise.all([
                getExamResults(student.id),
                getHomeworks(student.id),
                getStudySession(student.id)
              ]);
              
              return {
                ...student,
                exam_results: examResults.data || [],
                homeworks: homeworks.data || [],
                study_sessions: studySessions.data || []
              };
            })
          );
          
          setChildren(childrenWithData);
        } else {
          setChildren([]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching parent data:', error);
      setChildren([]);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  return {
    parentData,
    children,
    loading,
    refetch: fetchData
  };
};