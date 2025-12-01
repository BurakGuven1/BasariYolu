import type { InstitutionExamBlueprint } from './institutionQuestionApi';
import { supabase } from './supabase';

export type InstitutionStudentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface InstitutionStudentRequest {
  id: string;
  institution_id: string;
  user_id: string;
  invite_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: InstitutionStudentRequestStatus;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  student_profile_id?: string | null;
  subscription_id?: string | null;
  created_at: string;
  updated_at: string;
  institution?: {
    id: string;
    name: string;
    student_quota: number;
    approved_student_count: number;
  };
}

export interface InstitutionExamAnswerRecord {
  questionType: string;
  choiceId?: string | null;
  choiceLabel?: string | null;
  answerText?: string | null;
  isCorrect: boolean;
}

export interface InstitutionExamResult {
  id: string;
  institution_id: string;
  student_id: string | null;
  user_id: string;
  exam_blueprint_id: string | null;
  question_ids: string[];
  answers: Record<string, InstitutionExamAnswerRecord>;
  correct_count: number;
  wrong_count: number;
  empty_count: number;
  score: number | null;
  started_at: string | null;
  completed_at: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface InstitutionAnnouncement {
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

export interface InstitutionAssignment {
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

export interface SubmitInstitutionExamResultPayload {
  institutionId: string;
  examBlueprintId: string;
  userId: string;
  studentId?: string;
  questionIds: string[];
  answers: Record<string, InstitutionExamAnswerRecord>;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  score: number;
  durationSeconds?: number | null;
  metadata?: Record<string, any>;
}

interface InstitutionInviteInfo {
  id: string;
  name: string;
  student_quota: number;
  approved_student_count: number;
}

export interface InstitutionStudentSignupPayload {
  inviteCode: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export async function submitInstitutionStudentSignup({
  inviteCode,
  fullName,
  email,
  phone,
  password,
}: InstitutionStudentSignupPayload) {
  const normalizedInviteCode = inviteCode.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedFullName = fullName.trim();
  const normalizedPhone = phone?.trim() || null;

  const { data: institution, error: institutionError } = await supabase
    .from('institutions')
    .select('id, name, student_quota, approved_student_count')
    .eq('student_invite_code', normalizedInviteCode)
    .maybeSingle();

  if (institutionError) {
    throw institutionError;
  }

  if (!institution) {
    throw new Error('Geçersiz davet kodu.');
  }

  if (institution.student_quota > 0 && institution.approved_student_count >= institution.student_quota) {
    throw new Error(
      'Kurumunuz mevcut kontenjanı doldurdu. Kontenjan artırımı için destek@basariyolum.com adresine yazabilirsiniz.',
    );
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: normalizedFullName,
        phone: normalizedPhone,
        user_type: 'institution_student',
        institution_id: institution.id,
      },
    },
  });

  if (signUpError) {
    throw signUpError;
  }

  const user = signUpData.user;

  if (!user) {
    throw new Error('Kullanıcı kaydı tamamlanamadı. Lütfen tekrar deneyin.');
  }

  const { error: requestError } = await supabase.from('institution_student_requests').insert([
    {
      institution_id: institution.id,
      user_id: user.id,
      invite_code: normalizedInviteCode,
      full_name: normalizedFullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      status: 'pending',
    },
  ]);

  if (requestError) {
    throw requestError;
  }

  await supabase.auth.signOut();

  return {
    institution: institution as InstitutionInviteInfo,
  };
}

export async function listInstitutionStudentRequests(
  institutionId: string,
  status?: InstitutionStudentRequestStatus | 'all',
): Promise<InstitutionStudentRequest[]> {
  let query = supabase
    .from('institution_student_requests')
    .select(
      `
      *,
      institution:institutions(id, name, student_quota, approved_student_count)
    `,
    )
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: true });

  const statusFilter: InstitutionStudentRequestStatus | undefined =
    status && status !== 'all' ? status : undefined;

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data as InstitutionStudentRequest[]) ?? [];
}

export async function updateInstitutionStudentRequestStatus(
  requestId: string,
  status: InstitutionStudentRequestStatus,
  options?: { rejectionReason?: string },
) {
  const payload: Record<string, any> = {
    status,
    rejection_reason: status === 'rejected' ? options?.rejectionReason ?? 'Kurum tarafından reddedildi' : null,
    approved_by: status === 'approved' ? (await supabase.auth.getUser()).data.user?.id ?? null : null,
  };

  const { data, error } = await supabase
    .from('institution_student_requests')
    .update(payload)
    .eq('id', requestId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  if (data) {
    await syncInstitutionStudentStatus(data as InstitutionStudentRequest);
  }
}

export async function fetchInstitutionStudentStatus(userId: string) {
  const { data, error } = await supabase
    .from('institution_student_requests')
    .select(
      `
      *,
      institution:institutions(id, name, student_invite_code, student_quota, approved_student_count)
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as InstitutionStudentRequest | null;
}

export async function fetchInstitutionStudentPortalData(
  institutionId: string,
  userId: string,
): Promise<{
  blueprints: InstitutionExamBlueprint[];
  results: InstitutionExamResult[];
  announcements: InstitutionAnnouncement[];
  assignments: InstitutionAssignment[];
}> {
  const { data: blueprints, error: blueprintError } = await supabase
    .from('institution_exam_blueprints')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false });

  if (blueprintError) {
    throw blueprintError;
  }

  const results: InstitutionExamResult[] = [];

  if (userId) {
    const { data: resultData, error: resultError } = await supabase
      .from('institution_exam_results')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (resultError) {
      throw resultError;
    }

    if (Array.isArray(resultData)) {
      results.push(
        ...resultData.map((row) => ({
          ...(row as InstitutionExamResult),
          answers: (row as InstitutionExamResult).answers ?? {},
        })),
      );
    }
  }

  const { data: announcementsData, error: announcementsError } = await supabase
    .from('institution_announcements')
    .select('*')
    .eq('institution_id', institutionId)
    .order('publish_at', { ascending: false })
    .limit(20);

  if (announcementsError) {
    throw announcementsError;
  }

  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from('institution_assignments')
    .select('*')
    .eq('institution_id', institutionId)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(20);

  if (assignmentsError) {
    throw assignmentsError;
  }

  return {
    blueprints: (blueprints as InstitutionExamBlueprint[]) ?? [],
    results,
    announcements: (announcementsData as InstitutionAnnouncement[]) ?? [],
    assignments: (assignmentsData as InstitutionAssignment[]) ?? [],
  };
}

export async function submitInstitutionExamResult(
  payload: SubmitInstitutionExamResultPayload,
): Promise<InstitutionExamResult> {
  const normalizedScore = Number(payload.score.toFixed(2));
  const metadata = { ...(payload.metadata ?? {}) };

  if (typeof payload.durationSeconds === 'number') {
    metadata.duration_seconds = payload.durationSeconds;
  }

  const insertPayload = {
    institution_id: payload.institutionId,
    user_id: payload.userId,
    student_id: payload.studentId ?? null,
    exam_blueprint_id: payload.examBlueprintId,
    question_ids: payload.questionIds,
    answers: payload.answers,
    correct_count: payload.correctCount,
    wrong_count: payload.wrongCount,
    empty_count: payload.emptyCount,
    score: normalizedScore,
    completed_at: new Date().toISOString(),
    metadata,
  };

  const { data, error } = await supabase
    .from('institution_exam_results')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as InstitutionExamResult;
}

const ADVANCED_PLAN_SLUGS = ['advanced', 'gelismis', 'advanced_plan', 'gelismis_plan'];
let cachedAdvancedPlanId: string | null = null;

async function getAdvancedPlanId(): Promise<string> {
  if (cachedAdvancedPlanId) {
    return cachedAdvancedPlanId;
  }

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('id, name, display_name')
    .in('name', ADVANCED_PLAN_SLUGS)
    .limit(1);

  if (error) {
    throw error;
  }

  let planId: string | null = data?.[0]?.id ?? null;

  if (!planId) {
    const { data: displayMatch } = await supabase
      .from('subscription_plans')
      .select('id, display_name')
      .ilike('display_name', '%gelis%')
      .limit(1);

    planId = displayMatch?.[0]?.id ?? null;
  }

  if (!planId) {
    const { data: fallback } = await supabase
      .from('subscription_plans')
      .select('id')
      .order('monthly_price', { ascending: false })
      .limit(1);

    planId = fallback?.[0]?.id ?? null;
  }

  if (!planId) {
    throw new Error('Gelismis plan bulunamadi. Lutfen abonelik planlarinizi kontrol edin.');
  }

  cachedAdvancedPlanId = planId;
  return planId;
}


async function ensureProfileRecord(request: InstitutionStudentRequest) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, institution_joined_at')
    .eq('id', request.user_id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (profile) {
    return profile;
  }

  const nowIso = new Date().toISOString();
  const insertPayload: Record<string, any> = {
    id: request.user_id,
    full_name: request.full_name,
    email: request.email,
    role: 'student',
    updated_at: nowIso,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert([insertPayload])
    .select('id, institution_joined_at')
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted;
}

async function ensureStudentRecord(request: InstitutionStudentRequest) {
  const { data: existing, error: existingError } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', request.user_id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from('students')
    .insert({
      user_id: request.user_id,
      profile_id: request.user_id,
      grade: 12,
      school_name: 'Kurum Ogrencisi',
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function setInstitutionProfileFlags(params: {
  userId: string;
  institutionId: string | null;
  expiresAt: string | null;
  active: boolean;
  currentJoinDate?: string | null;
}) {
  const { userId, institutionId, expiresAt, active, currentJoinDate } = params;
  const nowIso = new Date().toISOString();

  const updatePayload: Record<string, any> = {
    institution_student: active,
    institution_id: active ? institutionId : null,
    institution_subscription_expires_at: active ? expiresAt : null,
    updated_at: nowIso,
  };

  updatePayload.institution_joined_at = active ? currentJoinDate ?? nowIso : null;

  const { error } = await supabase.from('profiles').update(updatePayload).eq('id', userId);
  if (error) {
    throw error;
  }
}

async function ensureInstitutionSubscription(request: InstitutionStudentRequest) {
  const planId = await getAdvancedPlanId();
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', request.user_id)
    .eq('payment_provider', 'institution')
    .eq('status', 'active')
    .maybeSingle();

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        plan_id: planId,
        billing_cycle: 'yearly',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        payment_provider: 'institution',
        payment_id: request.id,
        status: 'active',
        trial_end_date: null,
        updated_at: now.toISOString(),
      })
      .eq('id', existing.id)
      .select('id')
      .single();

    if (updateError) {
      throw updateError;
    }

    return { subscriptionId: updated.id, expiresAt: periodEnd.toISOString() };
  }

  const { data: inserted, error: insertError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: request.user_id,
      plan_id: planId,
      status: 'active',
      billing_cycle: 'yearly',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      payment_provider: 'institution',
      payment_id: request.id,
    })
    .select('id')
    .single();

  if (insertError) {
    throw insertError;
  }

  return { subscriptionId: inserted.id, expiresAt: periodEnd.toISOString() };
}

async function revokeInstitutionSubscription(request: InstitutionStudentRequest) {
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'expired',
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', request.user_id)
    .eq('payment_provider', 'institution');
}

async function syncInstitutionStudentStatus(request: InstitutionStudentRequest) {
  if (!request) {
    return;
  }

  if (request.status === 'approved') {
    const profile = await ensureProfileRecord(request);
    await ensureStudentRecord(request);
    const { subscriptionId, expiresAt } = await ensureInstitutionSubscription(request);

    await setInstitutionProfileFlags({
      userId: request.user_id,
      institutionId: request.institution_id,
      expiresAt,
      active: true,
      currentJoinDate: profile?.institution_joined_at ?? null,
    });

    await supabase
      .from('institution_student_requests')
      .update({
        subscription_id: subscriptionId,
        student_profile_id: request.user_id,
      })
      .eq('id', request.id);
  } else {
    await revokeInstitutionSubscription(request);
    await setInstitutionProfileFlags({
      userId: request.user_id,
      institutionId: null,
      expiresAt: null,
      active: false,
    });

    await supabase
      .from('institution_student_requests')
      .update({
        subscription_id: null,
      })
      .eq('id', request.id);
  }
}


