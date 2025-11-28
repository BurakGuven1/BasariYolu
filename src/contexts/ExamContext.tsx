import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuthContext } from './AuthContext';
import { supabase } from '../lib/supabase';

export interface ExamTemplate {
  id: string;
  name: string;
  exam_type: 'TYT' | 'AYT' | 'LGS' | 'custom';
  total_questions: number;
  duration_minutes: number;
  question_mapping: any[];
  subjects: string[];
  created_by?: string;
  institution_id?: string;
  is_public: boolean;
  created_at: string;
}

export interface ExamResult {
  id: string;
  student_id: string;
  template_id: string;
  exam_date: string;
  correct_count: number;
  wrong_count: number;
  empty_count: number;
  net_score: number;
  exam_score?: number;
  answers: any;
  template?: ExamTemplate;
  created_at: string;
}

interface ExamContextType {
  // Templates
  templates: ExamTemplate[];
  templatesLoading: boolean;
  loadTemplates: (institutionId?: string) => Promise<void>;
  getTemplate: (templateId: string) => ExamTemplate | undefined;
  createTemplate: (template: Partial<ExamTemplate>) => Promise<ExamTemplate>;
  updateTemplate: (templateId: string, updates: Partial<ExamTemplate>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;

  // Results
  results: ExamResult[];
  resultsLoading: boolean;
  loadResults: (studentId?: string, institutionId?: string) => Promise<void>;
  getResult: (resultId: string) => ExamResult | undefined;
  createResult: (result: Partial<ExamResult>) => Promise<ExamResult>;
  deleteResult: (resultId: string) => Promise<void>;

  // Cache management
  clearCache: () => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export function ExamProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();

  // Templates cache
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesLoadedFor, setTemplatesLoadedFor] = useState<string | null>(null);

  // Results cache
  const [results, setResults] = useState<ExamResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsLoadedFor, setResultsLoadedFor] = useState<string | null>(null);

  // Load templates
  const loadTemplates = useCallback(async (institutionId?: string) => {
    const cacheKey = institutionId || 'public';

    // Check if already loaded
    if (templatesLoadedFor === cacheKey && templates.length > 0) {
      return;
    }

    setTemplatesLoading(true);
    try {
      let query = supabase
        .from('exam_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (institutionId) {
        query = query.eq('institution_id', institutionId);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTemplates(data || []);
      setTemplatesLoadedFor(cacheKey);
    } catch (err: any) {
      console.error('Error loading templates:', err);
      throw err;
    } finally {
      setTemplatesLoading(false);
    }
  }, [templatesLoadedFor, templates.length]);

  // Get template by ID
  const getTemplate = useCallback((templateId: string) => {
    return templates.find(t => t.id === templateId);
  }, [templates]);

  // Create template
  const createTemplate = useCallback(async (template: Partial<ExamTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('exam_templates')
        .insert([{
          ...template,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error creating template:', err);
      throw err;
    }
  }, [user]);

  // Update template
  const updateTemplate = useCallback(async (templateId: string, updates: Partial<ExamTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('exam_templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => prev.map(t => t.id === templateId ? data : t));
    } catch (err: any) {
      console.error('Error updating template:', err);
      throw err;
    }
  }, []);

  // Delete template
  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('exam_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (err: any) {
      console.error('Error deleting template:', err);
      throw err;
    }
  }, []);

  // Load results
  const loadResults = useCallback(async (studentId?: string, institutionId?: string) => {
    const cacheKey = studentId || institutionId || 'all';

    // Check if already loaded
    if (resultsLoadedFor === cacheKey && results.length > 0) {
      return;
    }

    setResultsLoading(true);
    try {
      let query = supabase
        .from('external_exam_results')
        .select(`
          *,
          template:exam_templates(*)
        `)
        .order('exam_date', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      } else if (institutionId) {
        query = query.eq('institution_id', institutionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setResults(data || []);
      setResultsLoadedFor(cacheKey);
    } catch (err: any) {
      console.error('Error loading results:', err);
      throw err;
    } finally {
      setResultsLoading(false);
    }
  }, [resultsLoadedFor, results.length]);

  // Get result by ID
  const getResult = useCallback((resultId: string) => {
    return results.find(r => r.id === resultId);
  }, [results]);

  // Create result
  const createResult = useCallback(async (result: Partial<ExamResult>) => {
    try {
      const { data, error } = await supabase
        .from('external_exam_results')
        .insert([result])
        .select(`
          *,
          template:exam_templates(*)
        `)
        .single();

      if (error) throw error;

      setResults(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error creating result:', err);
      throw err;
    }
  }, []);

  // Delete result
  const deleteResult = useCallback(async (resultId: string) => {
    try {
      const { error } = await supabase
        .from('external_exam_results')
        .delete()
        .eq('id', resultId);

      if (error) throw error;

      setResults(prev => prev.filter(r => r.id !== resultId));
    } catch (err: any) {
      console.error('Error deleting result:', err);
      throw err;
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    setTemplates([]);
    setResults([]);
    setTemplatesLoadedFor(null);
    setResultsLoadedFor(null);
  }, []);

  const value: ExamContextType = {
    templates,
    templatesLoading,
    loadTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    results,
    resultsLoading,
    loadResults,
    getResult,
    createResult,
    deleteResult,
    clearCache,
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

export function useExam() {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error('useExam must be used within ExamProvider');
  }
  return context;
}
