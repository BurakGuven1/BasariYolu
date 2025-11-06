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
  };
  user: {
    id: string;
    email: string | null;
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
          created_at
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





