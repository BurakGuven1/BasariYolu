import { useCallback, useState } from 'react';
import { buildCustomTest, QuestionRecord, QuestionRequest } from '../lib/questionBank';

export interface QuestionRequestConfig extends QuestionRequest {
  id: string;
}

const createRequestId = () => crypto.randomUUID();

export function useQuestionBuilder(initialRequests: QuestionRequest[] = []) {
  const [requests, setRequests] = useState<QuestionRequestConfig[]>(
    initialRequests.map((req) => ({ ...req, id: createRequestId() })),
  );
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRequest = useCallback((request: QuestionRequest) => {
    setRequests((prev) => [...prev, { ...request, id: createRequestId() }]);
  }, []);

  const updateRequest = useCallback((id: string, request: QuestionRequest) => {
    setRequests((prev) =>
      prev.map((item) => (item.id === id ? { ...request, id } : item)),
    );
  }, []);

  const removeRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearRequests = useCallback(() => setRequests([]), []);

  const generateTest = useCallback(async () => {
    if (!requests.length) return [];
    setLoading(true);
    setError(null);
    try {
      const result = await buildCustomTest(requests);
      setQuestions(result);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Test oluşturulurken bir hata oluştu';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [requests]);

  return {
    requests,
    addRequest,
    updateRequest,
    removeRequest,
    clearRequests,
    generateTest,
    questions,
    loading,
    error,
  };
}
