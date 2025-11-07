import { supabase, SUPABASE_URL } from './supabase';

export type InstitutionQuestionType = 'multiple_choice' | 'written';

export interface InstitutionSession {
  membershipId: string;
  role: 'owner' | 'manager' | 'teacher' | 'viewer';
  institution: {
    id: string;
    name: string;
    logo_url: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    status: string;
    is_active: boolean;
    created_at: string;
    student_invite_code?: string | null;
    student_quota?: number | null;
    approved_student_count?: number | null;
    teacher_invite_code?: string | null;
  };
  user: {
    id: string;
    email: string | null;
  };
}

export interface InstitutionAnnouncementRecord {
  id: string;
  institution_id: string;
  created_by: string | null;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  audience: 'students' | 'teachers' | 'all';
  publish_at: string;
  created_at: string;
  updated_at: string;
}

export interface InstitutionAssignmentRecord {
  id: string;
  institution_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  subject: string | null;
  due_date: string | null;
  resources: Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface InstitutionStudentPerformance {
  profile_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  joined_at: string | null;
  examsTaken: number;
  averageScore: number;
  lastExam?: {
    name: string | null;
    score: number | null;
    date: string | null;
  };
  recentResults: Array<{
    id: string;
    name: string | null;
    score: number | null;
    created_at: string;
  }>;
}

export interface InstitutionTeacherMember {
  id: string;
  institution_id: string;
  user_id: string;
  role: 'teacher';
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url?: string | null;
  };
}

export type InstitutionTeacherInviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface InstitutionTeacherInvite {
  id: string;
  institution_id: string;
  created_by: string | null;
  email: string;
  full_name: string | null;
  invite_code: string;
  status: InstitutionTeacherInviteStatus;
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddInstitutionTeacherPayload {
  email: string;
  fullName?: string;
}

export type AddInstitutionTeacherResult =
  | {
      status: 'linked';
      membership: InstitutionTeacherMember;
    }
  | {
      status: 'invited';
      invite: InstitutionTeacherInvite;
    };

export interface TeacherInstitutionMembership {
  id: string;
  user_id: string;
  role: InstitutionSession['role'];
  institution: {
    id: string;
    name: string;
    logo_url: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    status: string;
    is_active: boolean;
    created_at: string;
    student_invite_code?: string | null;
    teacher_invite_code?: string | null;
    student_quota?: number | null;
    approved_student_count?: number | null;
  };
}

export type InstitutionTeacherTaskStatus = 'pending' | 'in_progress' | 'completed';

export interface InstitutionTeacherTaskInput {
  teacherUserId: string;
  title: string;
  description?: string;
  dueDate?: string;
}

export interface InstitutionTeacherTask {
  id: string;
  institution_id: string;
  teacher_user_id: string;
  assigned_by: string | null;
  title: string;
  description: string | null;
  status: InstitutionTeacherTaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type InstitutionTeacherRequestStatus = 'pending' | 'approved' | 'rejected';

export interface InstitutionTeacherRequest {
  id: string;
  institution_id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  source: 'code' | 'invite';
  invite_code: string | null;
  status: InstitutionTeacherRequestStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  institution?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

interface RegisterInstitutionPayload {
  fullName: string;
  email: string;
  password: string;
  institutionName: string;
  contactPhone?: string;
  logoFile: File;
}

const INSTITUTION_LOGO_BUCKET = 'institution-logos';
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const generateInviteCode = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().split('-')[0].toUpperCase();
  }
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const buildPublicLogoUrl = (path: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/${INSTITUTION_LOGO_BUCKET}/${path}`;

const uploadInstitutionLogo = async (file: File, ownerId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(INSTITUTION_LOGO_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  return buildPublicLogoUrl(fileName);
};

export const registerInstitutionAccount = async ({
  fullName,
  email,
  password,
  institutionName,
  contactPhone,
  logoFile,
}: RegisterInstitutionPayload): Promise<InstitutionSession> => {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        user_type: 'institution_owner',
      },
    },
  });

  if (signUpError) {
    throw signUpError;
  }

  const user = signUpData.user;

  if (!user) {
    throw new Error('Kullanici olusturulamadi. Lutfen tekrar deneyin.');
  }

  console.log('[Institution] signUp success user:', user.id);

  const logoUrl = await uploadInstitutionLogo(logoFile, user.id);

  const { data: institution, error: institutionError } = await supabase
    .from('institutions')
    .insert([
      {
        name: institutionName,
        logo_url: logoUrl,
        contact_email: email,
        contact_phone: contactPhone || null,
        created_by: user.id,
      },
    ])
    .select('*')
    .single();

  if (institutionError) {
    console.error('[Institution] institution insert error:', institutionError);
    throw institutionError;
  }

  console.log('[Institution] institution inserted:', institution?.id);

  const { data: membership, error: membershipError } = await supabase
    .from('institution_members')
    .insert([
      {
        institution_id: institution.id,
        user_id: user.id,
        role: 'owner',
      },
    ])
    .select('id, role')
    .single();

  if (membershipError) {
    console.error('[Institution] membership insert error:', membershipError);
    throw membershipError;
  }

  console.log('[Institution] membership inserted:', membership?.id);

  const session: InstitutionSession = {
    membershipId: membership.id,
    role: membership.role as InstitutionSession['role'],
    institution: {
      id: institution.id,
      name: institution.name,
      logo_url: institution.logo_url,
      contact_email: institution.contact_email,
      contact_phone: institution.contact_phone,
      status: institution.status,
      is_active: institution.is_active,
      created_at: institution.created_at,
      student_invite_code: institution.student_invite_code ?? null,
      teacher_invite_code: institution.teacher_invite_code ?? null,
      student_quota: institution.student_quota ?? 0,
      approved_student_count: institution.approved_student_count ?? 0,
    },
    user: {
      id: user.id,
      email: user.email ?? null,
    },
  };

  return session;
};

export const loginInstitutionAccount = async (email: string, password: string): Promise<InstitutionSession> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    console.error('[Institution] login: user not returned from auth');
    throw new Error('Kullanici bulunamadi.');
  }

  console.log('[Institution] login auth user:', data.user.id);

  const context = await getInstitutionSessionForUser(data.user.id);

  if (!context) {
    console.warn('[Institution] login: no institution context found');
    await supabase.auth.signOut();
    throw new Error('Bu kullaniciya bagli bir kurum kaydi bulunamadi.');
  }

  console.log('[Institution] login context:', context);

  return context;
};

export const getInstitutionSessionForUser = async (userId: string): Promise<InstitutionSession | null> => {
  const { data, error } = await supabase
    .from('institution_members')
    .select(
      `
        id,
        role,
        institution:institutions (
          id,
          name,
          logo_url,
          contact_email,
          contact_phone,
          status,
          is_active,
          created_at,
          student_invite_code,
          teacher_invite_code,
          student_quota,
          approved_student_count
        )
      `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .maybeSingle();

  if (error) {
    console.error('[Institution] getInstitutionSessionForUser error:', error);
    throw error;
  }

  if (!data || !data.institution) {
  console.warn('[Institution] getInstitutionSessionForUser no data for user', userId);
  return null;
}

console.log('[Institution] getInstitutionSessionForUser raw payload:', data);
const institutionRecord = Array.isArray(data.institution)
  ? data.institution[0]
  : data.institution;

return {
  membershipId: data.id,
  role: data.role as InstitutionSession['role'],
  institution: institutionRecord,
    user: {
      id: userId,
      email: (await supabase.auth.getUser()).data.user?.email ?? null,
    },
  };
};

export const refreshInstitutionSession = async (): Promise<InstitutionSession | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return getInstitutionSessionForUser(user.id);
};

export interface InstitutionAnnouncementInput {
  title: string;
  content: string;
  type?: 'info' | 'success' | 'warning' | 'urgent';
  audience?: 'students' | 'teachers' | 'all';
  publish_at?: string;
}

export const listInstitutionAnnouncements = async (
  institutionId: string,
): Promise<InstitutionAnnouncementRecord[]> => {
  const { data, error } = await supabase
    .from('institution_announcements')
    .select('*')
    .eq('institution_id', institutionId)
    .order('publish_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as InstitutionAnnouncementRecord[]) ?? [];
};

export const createInstitutionAnnouncement = async (
  institutionId: string,
  userId: string,
  payload: InstitutionAnnouncementInput,
): Promise<InstitutionAnnouncementRecord> => {
  const insertPayload = {
    institution_id: institutionId,
    created_by: userId,
    type: payload.type ?? 'info',
    audience: payload.audience ?? 'students',
    publish_at: payload.publish_at ?? new Date().toISOString(),
    title: payload.title,
    content: payload.content,
  };

  const { data, error } = await supabase
    .from('institution_announcements')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as InstitutionAnnouncementRecord;
};

export const updateInstitutionAnnouncement = async (
  announcementId: string,
  updates: Partial<InstitutionAnnouncementInput>,
): Promise<InstitutionAnnouncementRecord> => {
  const { data, error } = await supabase
    .from('institution_announcements')
    .update(updates)
    .eq('id', announcementId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as InstitutionAnnouncementRecord;
};

export const deleteInstitutionAnnouncement = async (announcementId: string) => {
  const { error } = await supabase.from('institution_announcements').delete().eq('id', announcementId);
  if (error) {
    throw error;
  }
};

export interface InstitutionAssignmentInput {
  title: string;
  description?: string;
  subject?: string;
  due_date?: string;
  resources?: Array<{ label: string; url: string }>;
  status?: 'active' | 'completed' | 'archived';
}

export const listInstitutionAssignments = async (
  institutionId: string,
): Promise<InstitutionAssignmentRecord[]> => {
  const { data, error } = await supabase
    .from('institution_assignments')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as InstitutionAssignmentRecord[]) ?? [];
};

export const createInstitutionAssignment = async (
  institutionId: string,
  userId: string,
  payload: InstitutionAssignmentInput,
): Promise<InstitutionAssignmentRecord> => {
  const insertPayload = {
    institution_id: institutionId,
    created_by: userId,
    title: payload.title,
    description: payload.description ?? null,
    subject: payload.subject ?? null,
    due_date: payload.due_date ?? null,
    resources: payload.resources ?? [],
    status: payload.status ?? 'active',
  };

  const { data, error } = await supabase
    .from('institution_assignments')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as InstitutionAssignmentRecord;
};

export const updateInstitutionAssignment = async (
  assignmentId: string,
  updates: Partial<InstitutionAssignmentInput>,
): Promise<InstitutionAssignmentRecord> => {
  const { data, error } = await supabase
    .from('institution_assignments')
    .update({
      ...updates,
      resources: updates.resources ?? undefined,
    })
    .eq('id', assignmentId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as InstitutionAssignmentRecord;
};

export const deleteInstitutionAssignment = async (assignmentId: string) => {
  const { error } = await supabase.from('institution_assignments').delete().eq('id', assignmentId);
  if (error) {
    throw error;
  }
};

export const fetchInstitutionStudentPerformance = async (
  institutionId: string,
): Promise<InstitutionStudentPerformance[]> => {
  const [{ data: profiles, error: profilesError }, { data: results, error: resultsError }, { data: blueprints }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, phone, institution_joined_at, institution_student, institution_id')
        .eq('institution_student', true)
        .eq('institution_id', institutionId),
      supabase
        .from('institution_exam_results')
        .select('*')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false }),
      supabase
        .from('institution_exam_blueprints')
        .select('id, name')
        .eq('institution_id', institutionId),
    ]);

  if (profilesError) {
    throw profilesError;
  }
  if (resultsError) {
    throw resultsError;
  }

  const blueprintMap = new Map<string, string>(
    (blueprints ?? []).map((bp: { id: string; name: string }) => [bp.id, bp.name]),
  );

  const groupedResults = new Map<string, InstitutionExamResult[]>();
  (results as InstitutionExamResult[] | null)?.forEach((result) => {
    if (!result.user_id) return;
    if (!groupedResults.has(result.user_id)) {
      groupedResults.set(result.user_id, []);
    }
    groupedResults.get(result.user_id)?.push(result);
  });

  const performance: InstitutionStudentPerformance[] =
    profiles?.map((profile: any) => {
      const entries = groupedResults.get(profile.id) ?? [];
      const examsTaken = entries.length;
      const averageScore =
        examsTaken === 0
          ? 0
          : Number(
              (
                entries.reduce((sum, result) => sum + (result.score ?? 0), 0) /
                Math.max(entries.length, 1)
              ).toFixed(1),
            );
      const lastExam = entries[0];
      const lastExamData = lastExam
        ? {
            name: lastExam.exam_blueprint_id ? blueprintMap.get(lastExam.exam_blueprint_id) ?? null : null,
            score: lastExam.score ?? null,
            date: lastExam.created_at ?? null,
          }
        : undefined;

      const recentResults = entries.slice(0, 5).map((entry) => ({
        id: entry.id,
        name: entry.exam_blueprint_id ? blueprintMap.get(entry.exam_blueprint_id) ?? null : null,
        score: entry.score ?? null,
        created_at: entry.created_at,
      }));

      return {
        profile_id: profile.id,
        user_id: profile.id,
        full_name: profile.full_name ?? null,
        email: profile.email ?? null,
        phone: profile.phone ?? null,
        joined_at: profile.institution_joined_at ?? null,
        examsTaken,
        averageScore,
        lastExam: lastExamData,
        recentResults,
      };
    }) ?? [];

  performance.sort((a, b) => b.examsTaken - a.examsTaken);
  return performance;
};

export const listInstitutionTeachers = async (institutionId: string): Promise<InstitutionTeacherMember[]> => {
  const { data, error } = await supabase
    .from('institution_members')
    .select(
      `
        id,
        institution_id,
        user_id,
        role,
        profile:profiles!institution_members_user_id_fkey (
          full_name,
          email,
          phone,
          avatar_url
        )
      `,
    )
    .eq('institution_id', institutionId)
    .eq('role', 'teacher')
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data as InstitutionTeacherMember[]) ?? [];
};

export const listTeacherInstitutions = async (userId: string): Promise<TeacherInstitutionMembership[]> => {
  const { data, error } = await supabase
    .from('institution_members')
    .select(
      `
        id,
        user_id,
        role,
        institution:institutions (
          id,
          name,
          logo_url,
          contact_email,
          contact_phone,
          status,
          is_active,
          created_at,
          student_invite_code,
          teacher_invite_code,
          student_quota,
          approved_student_count
        )
      `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data as TeacherInstitutionMembership[]) ?? []).filter((item) => Boolean(item.institution));
};

export const listInstitutionTeacherTasks = async (
  institutionId: string,
): Promise<InstitutionTeacherTask[]> => {
  const { data, error } = await supabase
    .from('institution_teacher_tasks')
    .select('*')
    .eq('institution_id', institutionId)
    .order('status', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as InstitutionTeacherTask[]) ?? [];
};

export const listTeacherInstitutionTasks = async (
  institutionId: string,
  teacherUserId: string,
): Promise<InstitutionTeacherTask[]> => {
  const { data, error } = await supabase
    .from('institution_teacher_tasks')
    .select('*')
    .eq('institution_id', institutionId)
    .eq('teacher_user_id', teacherUserId)
    .order('status', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as InstitutionTeacherTask[]) ?? [];
};

export const createInstitutionTeacherTask = async (
  institutionId: string,
  assignedBy: string,
  payload: InstitutionTeacherTaskInput,
): Promise<InstitutionTeacherTask> => {
  const insertPayload = {
    institution_id: institutionId,
    teacher_user_id: payload.teacherUserId,
    assigned_by: assignedBy,
    title: payload.title,
    description: payload.description ?? null,
    due_date: payload.dueDate ?? null,
  };

  const { data, error } = await supabase
    .from('institution_teacher_tasks')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as InstitutionTeacherTask;
};

export const updateInstitutionTeacherTaskStatus = async (
  taskId: string,
  status: InstitutionTeacherTaskStatus,
): Promise<InstitutionTeacherTask> => {
  const { data, error } = await supabase
    .from('institution_teacher_tasks')
    .update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as InstitutionTeacherTask;
};

export const deleteInstitutionTeacherTask = async (taskId: string) => {
  const { error } = await supabase.from('institution_teacher_tasks').delete().eq('id', taskId);
  if (error) {
    throw error;
  }
};

export const listInstitutionTeacherInvites = async (
  institutionId: string,
): Promise<InstitutionTeacherInvite[]> => {
  const { data, error } = await supabase
    .from('institution_teacher_invites')
    .select('*')
    .eq('institution_id', institutionId)
    .in('status', ['pending', 'accepted'])
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as InstitutionTeacherInvite[]) ?? [];
};

export const addInstitutionTeacherMember = async (
  institutionId: string,
  currentUserId: string,
  payload: AddInstitutionTeacherPayload,
): Promise<AddInstitutionTeacherResult> => {
  const email = normalizeEmail(payload.email);
  const fullName = payload.fullName?.trim() || null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .eq('email', email)
    .maybeSingle();

  if (profile?.id) {
    const { data: existingMembership, error: membershipLookupError } = await supabase
      .from('institution_members')
      .select('id, institution_id, role')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (membershipLookupError) {
      throw membershipLookupError;
    }

    if (existingMembership) {
      if (existingMembership.institution_id === institutionId && existingMembership.role === 'teacher') {
        throw new Error('Bu öğretmen zaten kurumunuza bağlı.');
      }
      if (existingMembership.role === 'teacher') {
        throw new Error('Bu öğretmen farklı bir kuruma bağlı.');
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from('institution_members')
      .insert({
        institution_id: institutionId,
        user_id: profile.id,
        role: 'teacher',
      })
      .select(
        `
          id,
          institution_id,
          user_id,
          role,
          profile:profiles!institution_members_user_id_fkey (
            full_name,
            email,
            phone,
            avatar_url
          )
        `,
      )
      .single();

    if (insertError) {
      throw insertError;
    }

    await supabase
      .from('profiles')
      .update({
        institution_id: institutionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    return {
      status: 'linked',
      membership: inserted as InstitutionTeacherMember,
    };
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + 14);

  const invitePayload = {
    institution_id: institutionId,
    created_by: currentUserId,
    email,
    full_name: fullName,
    invite_code: generateInviteCode(),
    expires_at: expires.toISOString(),
  };

  const { data: invite, error: inviteError } = await supabase
    .from('institution_teacher_invites')
    .insert(invitePayload)
    .select('*')
    .single();

  if (inviteError) {
    throw inviteError;
  }

  return {
    status: 'invited',
    invite: invite as InstitutionTeacherInvite,
  };
};

export const removeInstitutionTeacher = async (membershipId: string) => {
  const { data: membership, error: fetchError } = await supabase
    .from('institution_members')
    .select('user_id, role')
    .eq('id', membershipId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!membership || membership.role !== 'teacher') {
    throw new Error('Öğretmen kaydı bulunamadı.');
  }

  const { error: deleteError } = await supabase
    .from('institution_members')
    .delete()
    .eq('id', membershipId)
    .eq('role', 'teacher');

  if (deleteError) {
    throw deleteError;
  }

  await supabase
    .from('profiles')
    .update({
      institution_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', membership.user_id);
};

export const revokeInstitutionTeacherInvite = async (inviteId: string) => {
  const { error } = await supabase
    .from('institution_teacher_invites')
    .update({
      status: 'revoked',
      updated_at: new Date().toISOString(),
    })
    .eq('id', inviteId)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }
};

export const acceptInstitutionTeacherInvite = async (inviteCode: string) => {
  const { data, error } = await supabase.rpc('accept_institution_teacher_invite', {
    p_invite_code: inviteCode,
  });

  if (error) {
    throw error;
  }

  const payload = Array.isArray(data) ? data[0] : data;

  if (!payload) {
    throw new Error('Başvuru kaydedilemedi.');
  }

  return {
    requestId: payload.request_id as string,
    institutionId: payload.institution_id as string,
    status: payload.status as InstitutionTeacherRequestStatus,
  };
};

export const listInstitutionTeacherRequests = async (
  institutionId: string,
): Promise<InstitutionTeacherRequest[]> => {
  const { data, error } = await supabase
    .from('institution_teacher_requests')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as InstitutionTeacherRequest[]) ?? [];
};

export const listTeacherInstitutionRequests = async (userId: string): Promise<InstitutionTeacherRequest[]> => {
  const { data, error } = await supabase
    .from('institution_teacher_requests')
    .select(
      `
        *,
        institution:institutions (
          id,
          name,
          logo_url
        )
      `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as InstitutionTeacherRequest[]) ?? [];
};

export const approveInstitutionTeacherRequest = async (requestId: string) => {
  const { data, error } = await supabase.rpc('approve_institution_teacher_request', {
    p_request_id: requestId,
  });

  if (error) {
    throw error;
  }

  return data;
};

export const rejectInstitutionTeacherRequest = async (requestId: string, reason?: string) => {
  const { error } = await supabase.rpc('reject_institution_teacher_request', {
    p_request_id: requestId,
    p_reason: reason ?? null,
  });

  if (error) {
    throw error;
  }
};


