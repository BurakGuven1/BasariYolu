import { useEffect, useRef, useState } from 'react';
import {
  getParentData,
  getExamResults,
  getHomeworks,
  getStudySession,
} from '../lib/supabase';
import { useParentSession } from '../contexts/ParentSessionContext';

export const useParentData = (userId?: string) => {
  const { parentUser } = useParentSession();
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

    if (lastUserId.current === userId || isFetching.current) {
      return;
    }

    lastUserId.current = userId;
    isFetching.current = true;
    setLoading(true);

    try {
      if (userId.startsWith('parent_')) {
        if (parentUser) {
          const tempChildren = (parentUser.connectedStudents || []).map((student: any) => ({
            ...student,
            exam_results: student.exam_results || [],
            homeworks: student.homeworks || [],
            study_sessions: student.study_sessions || [],
            weekly_study_goal: student.weekly_study_goal,
            profiles: student.profiles || {
              full_name: student.full_name || 'Öğrenci',
              email: student.email || '',
            },
          }));
          setParentData(parentUser);
          setChildren(tempChildren);
        } else {
          setParentData(null);
          setChildren([]);
        }
        return;
      }

      const { data: parent } = await getParentData(userId);
      setParentData(parent);

      if (parent?.parent_student_connections) {
        const childrenWithData = await Promise.all(
          parent.parent_student_connections.map(async (connection: any) => {
            const student = connection.students;

            const [examResults, homeworks, studySessions] = await Promise.all([
              getExamResults(student.id),
              getHomeworks(student.id),
              getStudySession(student.id),
            ]);

            return {
              ...student,
              exam_results: examResults.data || [],
              homeworks: homeworks.data || [],
              study_sessions: studySessions.data || [],
            };
          }),
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
      isFetching.current = false;
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, parentUser]);

  return {
    parentData,
    children,
    loading,
    refetch: fetchData,
  };
};
