import { supabase } from './supabase';

export type NotificationType = 'attendance' | 'exam_result' | 'announcement' | 'schedule' | 'general';
export type NotificationMethod = 'whatsapp' | 'email' | 'sms';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered';

export interface NotificationLog {
  id?: string;
  institution_id: string;
  parent_contact_id?: string;
  student_id?: string;
  notification_type: NotificationType;
  method: NotificationMethod;
  recipient: string;
  message: string;
  status?: NotificationStatus;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at?: string;
}

/**
 * WhatsApp mesajı gönder (mock - Twilio entegrasyonu için hazır)
 */
export const sendWhatsAppMessage = async (
  phone: string,
  message: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string; messageId?: string }> => {
  try {
    console.log('📱 WhatsApp Message (MOCK):', { phone, message });

    // Telefon numarası formatı kontrolü
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return { success: false, error: 'Geçersiz telefon numarası' };
    }

    // Mock success - Gerçek entegrasyon için Twilio/Fonnte API kullan
    return {
      success: true,
      messageId: `mock_whatsapp_${Date.now()}`
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Email gönder (Supabase SMTP kullanılabilir)
 */
export const sendEmail = async (
  email: string,
  subject: string,
  body: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string; messageId?: string }> => {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Geçersiz email adresi' };
    }

    console.log('📧 Email (MOCK):', { email, subject });

    // Mock success
    return {
      success: true,
      messageId: `mock_email_${Date.now()}`
    };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Log notification to database
 */
const logNotification = async (
  notificationData: Omit<NotificationLog, 'id' | 'created_at'>
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('notification_logs')
      .insert([{
        ...notificationData,
        created_by: user?.id
      }]);
  } catch (error) {
    console.error('Error logging notification:', error);
    // Don't throw - logging failure shouldn't break the notification flow
  }
};

/**
 * Devamsızlık bildirimi gönder
 */
export const sendAttendanceNotification = async (
  institutionId: string,
  studentId: string,
  attendanceData: {
    date: string;
    status: string;
    lesson?: string;
    notes?: string;
  }
): Promise<{ data: { sent: number; failed: number }; error: any }> => {
  try {
    // Öğrencinin velilerini al
    const { data: parents, error: parentsError } = await supabase
      .from('parent_contacts')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('student_id', studentId)
      .eq('is_active', true);

    if (parentsError) throw parentsError;

    if (!parents || parents.length === 0) {
      return {
        data: { sent: 0, failed: 0 },
        error: { message: 'Veli kaydı bulunamadı' }
      };
    }

    // Öğrenci adını al (directly from profiles table)
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', studentId)
      .maybeSingle();

    const studentName = studentProfile?.full_name || 'Öğrenci';

    let sent = 0;
    let failed = 0;

    // Her veli için bildirim gönder
    for (const parent of parents) {
      const message = `
Sayın ${parent.parent_name},

Öğrenciniz ${studentName} ${attendanceData.date} tarihinde ${attendanceData.lesson || 'derse'} ${
        attendanceData.status === 'absent' ? 'devamsızlık yaptı' :
        attendanceData.status === 'late' ? 'geç kaldı' :
        'mazeretli'
      }.

${attendanceData.notes ? `Not: ${attendanceData.notes}` : ''}

Bilgilerinize sunarız.
      `.trim();

      // WhatsApp
      if ((parent.preferred_contact_method === 'whatsapp' || parent.preferred_contact_method === 'both') && parent.phone) {
        const result = await sendWhatsAppMessage(parent.phone, message);

        // Log the notification
        await logNotification({
          institution_id: institutionId,
          parent_contact_id: parent.id,
          student_id: studentId,
          notification_type: 'attendance',
          method: 'whatsapp',
          recipient: parent.phone,
          message: message,
          status: result.success ? 'sent' : 'failed',
          error_message: result.error,
          sent_at: result.success ? new Date().toISOString() : undefined,
          metadata: { attendance_data: attendanceData }
        });

        if (result.success) sent++;
        else failed++;
      }

      // Email
      if ((parent.preferred_contact_method === 'email' || parent.preferred_contact_method === 'both') && parent.email) {
        const result = await sendEmail(
          parent.email,
          `${studentName} - Devamsızlık Bildirimi`,
          message.replace(/\n/g, '<br>')
        );

        // Log the notification
        await logNotification({
          institution_id: institutionId,
          parent_contact_id: parent.id,
          student_id: studentId,
          notification_type: 'attendance',
          method: 'email',
          recipient: parent.email,
          message: message,
          status: result.success ? 'sent' : 'failed',
          error_message: result.error,
          sent_at: result.success ? new Date().toISOString() : undefined,
          metadata: { attendance_data: attendanceData }
        });

        if (result.success) sent++;
        else failed++;
      }
    }

    return { data: { sent, failed }, error: null };
  } catch (error: any) {
    console.error('Error sending attendance notification:', error);
    return { data: { sent: 0, failed: 0 }, error };
  }
};

/**
 * Duyuru bildirimi (eski fonksiyon - korundu)
 */
export const sendAnnouncementNotification = async (announcementId: string) => {
  try {
    console.log('📧 Triggering notification for announcement:', announcementId);

    const { data, error } = await supabase.functions.invoke('SmtpSend', {
      body: { announcement_id: announcementId }
    });

    if (error) {
      console.error('❌ Notification error:', error);
      throw error;
    }

    console.log('✅ Notification sent successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Failed to send notification:', error);
    return { success: false, error: error.message || error };
  }
};
