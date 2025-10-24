import { supabase } from './supabase';

export const sendAnnouncementNotification = async (announcementId: string) => {
  try {
    console.log('📧 Triggering notification for announcement:', announcementId);

    const { data, error } = await supabase.functions.invoke('send-notification', {
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