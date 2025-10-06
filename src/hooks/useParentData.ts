import { useState, useEffect } from 'react';
import { getParentData, getExamResults, getHomeworks, getStudySession, supabase } from '../lib/supabase';

export const useParentData = (userId: string | undefined) => {
  const [parentData, setParentData] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    console.log('=== useParentData fetchData called ===');
    console.log('userId:', userId);
    
    if (!userId) {
      console.log('No userId provided');
      setLoading(false);
      return;
    }

    try {
      // Check if this is a temporary parent login
      if (userId.startsWith('parent_')) {
        console.log('=== TEMPORARY PARENT LOGIN DETECTED ===');
        
        // Get from localStorage
        const tempUser = JSON.parse(localStorage.getItem('tempParentUser') || '{}');
        console.log('Temp user from localStorage:', tempUser);
        
        if (tempUser.connectedStudents && tempUser.connectedStudents.length > 0) {
          console.log('=== PROCESSING CONNECTED STUDENTS ===');
          console.log('Connected students count:', tempUser.connectedStudents.length);
          
          // The data should already be complete from LoginModal
          const childrenWithData = tempUser.connectedStudents.map((student: any, index: number) => {
            console.log(`=== PROCESSING STUDENT ${index + 1} ===`);
            console.log('Student ID:', student.id);
            console.log('Student name:', student.profiles?.full_name);
            console.log('Exam results:', student.exam_results?.length || 0);
            console.log('Homeworks:', student.homeworks?.length || 0);
            console.log('Study sessions:', student.study_sessions?.length || 0);
            console.log('Weekly goal:', student.weekly_study_goal);
            
            return {
              ...student,
              // Ensure arrays exist
              exam_results: student.exam_results || [],
              homeworks: student.homeworks || [],
              study_sessions: student.study_sessions || [],
              weekly_study_goal: student.weekly_study_goal,
              // Ensure profile data is properly structured
              profiles: student.profiles || {
                full_name: student.full_name || 'Öğrenci',
                email: student.email || ''
              }
            };
          });
          
          console.log('=== FINAL CHILDREN DATA ===');
          console.log('Children count:', childrenWithData.length);
          childrenWithData.forEach((child, index) => {
            console.log(`Child ${index + 1}:`, {
              id: child.id,
              name: child.profiles?.full_name,
              exam_results_count: child.exam_results?.length || 0,
              homeworks_count: child.homeworks?.length || 0,
              study_sessions_count: child.study_sessions?.length || 0,
              exam_results_sample: child.exam_results?.slice(0, 2),
              homeworks_sample: child.homeworks?.slice(0, 2)
            });
          });
          
          setChildren(childrenWithData);
        } else {
          console.log('No connected students found in temp user');
          setChildren([]);
        }
        setLoading(false);
        return;
      }

      // Regular parent login (not used currently but kept for future)
      console.log('=== REGULAR PARENT LOGIN ===');
      const { data: parent } = await getParentData(userId);
      setParentData(parent);

      if (parent?.parent_student_connections) {
        const childrenWithData = await Promise.all(
          parent.parent_student_connections.map(async (connection: any) => {
            const student = connection.students;
            
            const { data: examResults, error: examError } = await getExamResults(student.id);
            if (examError) {
              console.error('Error fetching exam results:', examError);
            }
            
            const { data: homeworks, error: homeworkError } = await getHomeworks(student.id);
            if (homeworkError) {
              console.error('Error fetching homeworks:', homeworkError);
            }

            const { data: studySessions, error: studyError } = await getStudySession(student.id);
            if (studyError) {
              console.error('Error fetching study sessions:', studyError);
            }
            
            return {
              ...student,
              exam_results: examResults || [],
              homeworks: homeworks || [],
              study_sessions: studySessions || []
            };
          })
        );
        
        setChildren(childrenWithData);
      } else {
        setChildren([]);
      }
    } catch (error) {
      console.error('Error fetching parent data:', error);
      setChildren([]);
    } finally {
      setLoading(false);
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