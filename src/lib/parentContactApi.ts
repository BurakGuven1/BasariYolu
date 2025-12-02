import { supabase } from './supabase';

export interface ParentContact {
  id?: string;
  institution_id: string;
  student_id: string;
  parent_name: string;
  phone?: string;
  email?: string;
  preferred_contact_method?: 'whatsapp' | 'email' | 'both';
  relation?: string;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Join'den gelen ekstra alanlar
  student?: {
    id: string;
    profile?: {
      full_name: string;
    };
  };
}

/**
 * Kuruma ait tüm veli kayıtlarını getir
 */
export const getInstitutionParents = async (
  institutionId: string
): Promise<{ data: ParentContact[] | null; error: any }> => {
  try {
    // First get parent contacts
    const { data: parentData, error: parentError } = await supabase
      .from('parent_contacts')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('is_active', true)
      .order('parent_name', { ascending: true });

    if (parentError) throw parentError;
    if (!parentData || parentData.length === 0) {
      return { data: [], error: null };
    }

    // Get student profiles for these parents
    const studentIds = parentData.map(p => p.student_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', studentIds);

    if (profileError) {
      console.warn('Could not fetch student profiles:', profileError);
    }

    // Merge student profile data with parent contacts
    const parentsWithStudents = parentData.map(parent => ({
      ...parent,
      student: {
        id: parent.student_id,
        profile: profiles?.find(p => p.id === parent.student_id) || null
      }
    }));

    return { data: parentsWithStudents as ParentContact[], error: null };
  } catch (error: any) {
    console.error('Error fetching institution parents:', error);
    return { data: null, error };
  }
};

/**
 * Belirli bir öğrencinin velilerini getir
 */
export const getStudentParents = async (
  studentId: string
): Promise<{ data: ParentContact[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('parent_contacts')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data as ParentContact[], error: null };
  } catch (error: any) {
    console.error('Error fetching student parents:', error);
    return { data: null, error };
  }
};

/**
 * Yeni veli kaydı oluştur
 */
export const createParentContact = async (
  parentData: Omit<ParentContact, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: ParentContact | null; error: any }> => {
  try {
    // Validasyon
    if (!parentData.phone && !parentData.email) {
      return {
        data: null,
        error: { message: 'Telefon veya email bilgisi zorunludur' }
      };
    }

    if (!parentData.student_id || parentData.student_id.trim() === '') {
      return {
        data: null,
        error: { message: 'Öğrenci seçimi zorunludur' }
      };
    }

    if (!parentData.parent_name || parentData.parent_name.trim() === '') {
      return {
        data: null,
        error: { message: 'Veli adı zorunludur' }
      };
    }

    const { data, error } = await supabase
      .from('parent_contacts')
      .insert([{
        ...parentData,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return { data: data as ParentContact, error: null };
  } catch (error: any) {
    console.error('Error creating parent contact:', error);
    return { data: null, error };
  }
};

/**
 * Veli kaydını güncelle
 */
export const updateParentContact = async (
  parentId: string,
  updates: Partial<ParentContact>
): Promise<{ data: ParentContact | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('parent_contacts')
      .update(updates)
      .eq('id', parentId)
      .select()
      .single();

    if (error) throw error;

    return { data: data as ParentContact, error: null };
  } catch (error: any) {
    console.error('Error updating parent contact:', error);
    return { data: null, error };
  }
};

/**
 * Veli kaydını sil (soft delete)
 */
export const deleteParentContact = async (
  parentId: string
): Promise<{ data: boolean; error: any }> => {
  try {
    const { error } = await supabase
      .from('parent_contacts')
      .update({ is_active: false })
      .eq('id', parentId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error deleting parent contact:', error);
    return { data: false, error };
  }
};

/**
 * Excel/CSV'den toplu veli ekleme
 */
export interface BulkParentImport {
  parent_name: string;
  student_name: string; // Öğrenci adı (eşleştirme için)
  phone?: string;
  email?: string;
  preferred_contact_method?: 'whatsapp' | 'email' | 'both';
  relation?: string;
  notes?: string;
}

export const importParentsFromCSV = async (
  institutionId: string,
  parents: BulkParentImport[]
): Promise<{
  data: { success: number; failed: number; errors: string[] } | null;
  error: any;
}> => {
  try {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Kurumun öğrencilerini al (isim eşleştirmesi için)
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        profile:profiles!students_profile_id_fkey(full_name)
      `)
      .in('id', await getInstitutionStudentIds(institutionId));

    if (studentsError) throw studentsError;

    const studentMap = new Map(
      students.map(s => [
        s.profile?.full_name?.toLowerCase().trim(),
        s.id
      ])
    );

    for (const parent of parents) {
      try {
        // Öğrenci ID'sini bul
        const studentId = studentMap.get(parent.student_name.toLowerCase().trim());

        if (!studentId) {
          results.failed++;
          results.errors.push(`${parent.student_name}: Öğrenci bulunamadı`);
          continue;
        }

        // Telefon veya email kontrolü
        if (!parent.phone && !parent.email) {
          results.failed++;
          results.errors.push(`${parent.parent_name}: Telefon veya email gerekli`);
          continue;
        }

        // Veli ekle
        const { error } = await supabase
          .from('parent_contacts')
          .insert([{
            institution_id: institutionId,
            student_id: studentId,
            parent_name: parent.parent_name.trim(),
            phone: parent.phone?.trim() || null,
            email: parent.email?.trim()?.toLowerCase() || null,
            preferred_contact_method: parent.preferred_contact_method || 'whatsapp',
            relation: parent.relation?.trim() || null,
            notes: parent.notes?.trim() || null,
            is_active: true
          }]);

        if (error) {
          // Duplicate key hatası kontrol et
          if (error.code === '23505') {
            results.failed++;
            results.errors.push(`${parent.parent_name}: Zaten kayıtlı`);
          } else {
            throw error;
          }
        } else {
          results.success++;
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push(`${parent.parent_name}: ${err.message}`);
      }
    }

    return { data: results, error: null };
  } catch (error: any) {
    console.error('Error importing parents:', error);
    return { data: null, error };
  }
};

/**
 * Kurumun öğrenci ID'lerini getir (yardımcı fonksiyon)
 */
async function getInstitutionStudentIds(institutionId: string): Promise<string[]> {
  const { data: classes } = await supabase
    .from('classes')
    .select('id')
    .eq('institution_id', institutionId);

  if (!classes || classes.length === 0) return [];

  const classIds = classes.map(c => c.id);

  const { data: classStudents } = await supabase
    .from('class_students')
    .select('student_id')
    .in('class_id', classIds)
    .eq('status', 'active');

  return classStudents?.map(cs => cs.student_id) || [];
}

/**
 * CSV dosyasını parse et
 */
export const parseParentCSV = (csvContent: string): BulkParentImport[] => {
  const lines = csvContent.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV dosyası boş veya geçersiz');
  }

  // Header'ı atla
  const dataLines = lines.slice(1);

  return dataLines.map(line => {
    // CSV parse (basit - comma separated)
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));

    return {
      parent_name: values[0] || '',
      student_name: values[1] || '',
      phone: values[2] || undefined,
      email: values[3] || undefined,
      preferred_contact_method: (values[4] as any) || 'whatsapp',
      relation: values[5] || undefined,
      notes: values[6] || undefined
    };
  });
};

/**
 * Örnek CSV template indir
 */
export const downloadParentCSVTemplate = () => {
  const template = `Veli Ad Soyad,Öğrenci Ad Soyad,Telefon,Email,İletişim Tercihi,Yakınlık,Notlar
Ahmet Yılmaz,Mehmet Yılmaz,05321234567,ahmet@email.com,whatsapp,Baba,
Ayşe Demir,Fatma Demir,05339876543,ayse@email.com,email,Anne,Özel durumu var
`;

  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'veli_listesi_sablonu.csv';
  link.click();
};
