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
  _message: string,
  _metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string; messageId?: string }> => {
  try {

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
 * Email gönder (Supabase Edge Function ile gerçek SMTP)
 */
export const sendEmail = async (
  email: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string; messageId?: string }> => {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Geçersiz email adresi" };
    }


    // notificationApi.ts içinde:
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        subject,
        html: htmlBody
      }
    });

    if (error) {
      console.error("❌ Email sending failed:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      messageId: data?.messageId || `email_${Date.now()}`
    };

  } catch (err: any) {
    console.error("Error sending email:", err);
    return { success: false, error: err.message };
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
 * HTML Email Template Generator - BaşarıYolu Marka Renkleri
 */
const generateAttendanceEmailHTML = (
  parentName: string,
  studentName: string,
  date: string,
  lesson: string,
  status: 'absent' | 'late' | 'excused',
  notes?: string
): string => {
  const statusConfig = {
    absent: {
      icon: '🚫',
      text: 'Devamsızlık',
      color: '#ef4444',
      bgColor: '#fee2e2'
    },
    late: {
      icon: '⏰',
      text: 'Geç Kalma',
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    excused: {
      icon: '📋',
      text: 'Mazeretli',
      color: '#3b82f6',
      bgColor: '#dbeafe'
    }
  };

  const config = statusConfig[status];
  const formattedDate = new Date(date).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devamsızlık Bildirimi - BaşarıYolu</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 600px;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                📚 BaşarıYolu
              </h1>
              <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px; font-weight: 500;">
                Yoklama Bildirimi
              </p>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <div style="background-color: ${config.bgColor}; border-left: 4px solid ${config.color}; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: ${config.color}; font-size: 18px; font-weight: 700;">
                  ${config.icon} ${config.text} Bildirimi
                </p>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 40px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Sayın <strong>${parentName}</strong>,
              </p>
            </td>
          </tr>

          <!-- Message Content -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Öğrenci:</span>
                      <strong style="color: #1f2937; font-size: 16px; display: block; margin-top: 4px;">
                        ${studentName}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Ders:</span>
                      <strong style="color: #1f2937; font-size: 16px; display: block; margin-top: 4px;">
                        ${lesson}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Tarih:</span>
                      <strong style="color: #1f2937; font-size: 16px; display: block; margin-top: 4px;">
                        ${formattedDate}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Durum:</span>
                      <strong style="color: ${config.color}; font-size: 16px; display: block; margin-top: 4px;">
                        ${config.text}
                      </strong>
                    </td>
                  </tr>
                  ${notes ? `
                  <tr>
                    <td style="padding: 12px 0 8px 0;">
                      <div style="background-color: #fef3c7; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 6px;">
                        <span style="color: #92400e; font-size: 13px; font-weight: 600;">📝 Not:</span>
                        <p style="margin: 6px 0 0 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                          ${notes}
                        </p>
                      </div>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center;">
              <a href="https://basariyolum.com/dashboard"
                 style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">
                📊 Panele Git
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; text-align: center;">
                Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
                <strong style="color: #4f46e5;">BaşarıYolu</strong> • Eğitimde Dijital Dönüşüm
              </p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                <a href="https://basariyolum.com" style="color: #4f46e5; text-decoration: none;">basariyolum.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
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

    // Öğrencinin velilerini al (tüm veli kayıtlarını kontrol et)
    const { data: allParents } = await supabase
      .from('parent_contacts')
      .select('*')
      .eq('student_id', studentId);
    // Kurum ve aktif filtreli veli kayıtları
    const { data: parents, error: parentsError } = await supabase
      .from('parent_contacts')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('student_id', studentId)
      .eq('is_active', true);

    if (parentsError) throw parentsError;

    if (!parents || parents.length === 0) {
      console.warn('⚠️ Veli kaydı bulunamadı!');
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
      // Plain text mesaj (WhatsApp için)
      const plainMessage = `
Sayın ${parent.parent_name},

Öğrenciniz ${studentName} ${attendanceData.date} tarihinde ${attendanceData.lesson || 'derse'} ${
        attendanceData.status === 'absent' ? 'devamsızlık yaptı' :
        attendanceData.status === 'late' ? 'geç kaldı' :
        'mazeretli'
      }.

${attendanceData.notes ? `Not: ${attendanceData.notes}` : ''}

Bilgilerinize sunarız.
      `.trim();

      // HTML mesaj (Email için)
      const htmlMessage = generateAttendanceEmailHTML(
        parent.parent_name,
        studentName,
        attendanceData.date,
        attendanceData.lesson || 'Ders',
        attendanceData.status as 'absent' | 'late' | 'excused',
        attendanceData.notes
      );

      // WhatsApp (günde 1 mesaj kısıtlaması var)
      if ((parent.preferred_contact_method === 'whatsapp' || parent.preferred_contact_method === 'both') && parent.phone) {
        // Bugün WhatsApp mesajı gönderilmiş mi kontrol et
        const { data: todayWhatsApp } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('student_id', studentId)
          .eq('notification_type', 'attendance')
          .eq('method', 'whatsapp')
          .gte('created_at', `${attendanceData.date}T00:00:00`)
          .lte('created_at', `${attendanceData.date}T23:59:59`);

        if (todayWhatsApp && todayWhatsApp.length > 0) {
        } else {
          const result = await sendWhatsAppMessage(parent.phone, plainMessage);

          // Log the notification
          await logNotification({
            institution_id: institutionId,
            parent_contact_id: parent.id,
            student_id: studentId,
            notification_type: 'attendance',
            method: 'whatsapp',
            recipient: parent.phone,
            message: plainMessage,
            status: result.success ? 'sent' : 'failed',
            error_message: result.error,
            sent_at: result.success ? new Date().toISOString() : undefined,
            metadata: { attendance_data: attendanceData }
          });

          if (result.success) sent++;
          else failed++;
        }
      }

      // Email (Her zaman gönder, günlük limit yok)
      if (parent.email) {

        const result = await sendEmail(
          parent.email,
          `${studentName} - ${attendanceData.status === 'absent' ? 'Devamsızlık' : attendanceData.status === 'late' ? 'Geç Kalma' : 'Mazeretli'} Bildirimi`,
          htmlMessage
        );

        // Log the notification
        await logNotification({
          institution_id: institutionId,
          parent_contact_id: parent.id,
          student_id: studentId,
          notification_type: 'attendance',
          method: 'email',
          recipient: parent.email,
          message: plainMessage,
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
    const { data, error } = await supabase.functions.invoke('SmtpSend', {
      body: { announcement_id: announcementId }
    });

    if (error) {
      console.error('❌ Notification error:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Failed to send notification:', error);
    return { success: false, error: error.message || error };
  }
};
