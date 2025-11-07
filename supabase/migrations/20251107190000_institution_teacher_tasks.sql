/*
  # Institution Teacher Tasks

  - Store tasks assigned from institution managers to teachers
  - Allow institution staff to manage tasks, teachers to read/update their assignments
*/

-- Helper for updated_at
CREATE OR REPLACE FUNCTION public.set_institution_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.institution_teacher_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  teacher_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_tasks_institution
  ON public.institution_teacher_tasks (institution_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_teacher_tasks_teacher
  ON public.institution_teacher_tasks (teacher_user_id, status, due_date);

DROP TRIGGER IF EXISTS trg_teacher_tasks_updated_at ON public.institution_teacher_tasks;
CREATE TRIGGER trg_teacher_tasks_updated_at
BEFORE UPDATE ON public.institution_teacher_tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_institution_task_updated_at();

ALTER TABLE public.institution_teacher_tasks ENABLE ROW LEVEL SECURITY;

-- Managers manage tasks
DROP POLICY IF EXISTS "Institution staff manage teacher tasks" ON public.institution_teacher_tasks;
CREATE POLICY "Institution staff manage teacher tasks"
ON public.institution_teacher_tasks
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_teacher_tasks.institution_id
      AND im.user_id = auth.uid()
      AND im.role IN ('owner', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_teacher_tasks.institution_id
      AND im.user_id = auth.uid()
      AND im.role IN ('owner', 'manager')
  )
);

-- Assigned teacher can update their tasks (status only)
DROP POLICY IF EXISTS "Assigned teacher update tasks" ON public.institution_teacher_tasks;
CREATE POLICY "Assigned teacher update tasks"
ON public.institution_teacher_tasks
FOR UPDATE
USING (auth.uid() = teacher_user_id)
WITH CHECK (auth.uid() = teacher_user_id);

-- Members + assigned teachers can read
DROP POLICY IF EXISTS "Institution members read teacher tasks" ON public.institution_teacher_tasks;
CREATE POLICY "Institution members read teacher tasks"
ON public.institution_teacher_tasks
FOR SELECT
USING (
  auth.uid() = teacher_user_id
  OR EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_teacher_tasks.institution_id
      AND im.user_id = auth.uid()
  )
);
