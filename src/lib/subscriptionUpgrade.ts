import { supabase } from './supabase';

interface UpgradeCalculation {
  currentPlanPrice: number;
  newPlanPrice: number;
  daysUsed: number;
  daysRemaining: number;
  totalDays: number;
  creditAmount: number;
  amountToPay: number;
  discountPercentage: number;
}

interface UpgradeParams {
  userId: string;
  newPlanId: string;
  newBillingCycle: 'monthly' | 'yearly';
}

/**
 * Kalan gün kredisi hesapla
 */
export const calculateProration = async (
  userId: string,
  newPlanId: string,
  newBillingCycle: 'monthly' | 'yearly'
): Promise<UpgradeCalculation | null> => {
  try {
    // 1. Mevcut subscription'ı al
    const { data: currentSub, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !currentSub) {
      console.error('Current subscription not found:', subError);
      return null;
    }

    // 2. Yeni plan bilgisini al
    const { data: newPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', newPlanId)
      .single();

    if (planError || !newPlan) {
      console.error('New plan not found:', planError);
      return null;
    }

    // 3. Tarih hesaplamaları
    const today = new Date();
    const periodStart = new Date(currentSub.current_period_start);
    const periodEnd = new Date(currentSub.current_period_end);

    const totalDays = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUsed = Math.ceil(
      (today.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.max(0, totalDays - daysUsed);

    // 4. Fiyat hesaplamaları
    const currentPlanPrice = currentSub.billing_cycle === 'monthly'
      ? parseFloat(currentSub.plan.monthly_price)
      : parseFloat(currentSub.plan.yearly_price);

    const newPlanPrice = newBillingCycle === 'monthly'
      ? parseFloat(newPlan.monthly_price)
      : parseFloat(newPlan.yearly_price);

    // 5. Kredi hesapla (kalan günler oranında)
    const creditAmount = (currentPlanPrice / totalDays) * daysRemaining;

    // 6. Ödenecek miktar
    const amountToPay = Math.max(0, newPlanPrice - creditAmount);

    // 7. İndirim yüzdesi
    const discountPercentage = ((creditAmount / newPlanPrice) * 100);

    return {
      currentPlanPrice,
      newPlanPrice,
      daysUsed,
      daysRemaining,
      totalDays,
      creditAmount: parseFloat(creditAmount.toFixed(2)),
      amountToPay: parseFloat(amountToPay.toFixed(2)),
      discountPercentage: parseFloat(discountPercentage.toFixed(1))
    };
  } catch (error) {
    console.error('Error calculating proration:', error);
    return null;
  }
};

/**
 * Upgrade işlemini gerçekleştir
 */
export const upgradeSubscription = async ({
  userId,
  newPlanId,
  newBillingCycle
}: UpgradeParams): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Proration hesapla
    const calculation = await calculateProration(userId, newPlanId, newBillingCycle);
    
    if (!calculation) {
      return { success: false, error: 'Hesaplama yapılamadı' };
    }

    // 2. Mevcut subscription'ı al
    const { data: currentSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!currentSub) {
      return { success: false, error: 'Aktif abonelik bulunamadı' };
    }

    // 3. Upgrade history kaydet
    const { error: historyError } = await supabase
      .from('subscription_upgrades')
      .insert({
        user_id: userId,
        from_plan_id: currentSub.plan_id,
        to_plan_id: newPlanId,
        from_billing_cycle: currentSub.billing_cycle,
        to_billing_cycle: newBillingCycle,
        credit_amount: calculation.creditAmount,
        amount_paid: calculation.amountToPay,
        original_price: calculation.newPlanPrice
      });

    if (historyError) {
      console.error('History insert error:', historyError);
    }

    // 4. Subscription'ı güncelle
    const today = new Date();
    const newPeriodEnd = new Date(today);
    
    if (newBillingCycle === 'monthly') {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    } else {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    }

    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        plan_id: newPlanId,
        billing_cycle: newBillingCycle,
        current_period_start: today.toISOString(),
        current_period_end: newPeriodEnd.toISOString(),
        upgrade_credit: calculation.creditAmount,
        discount_applied: calculation.creditAmount,
        original_price: calculation.newPlanPrice,
        proration_date: today.toISOString(),
        updated_at: today.toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (updateError) {
      console.error('Subscription update error:', updateError);
      return { success: false, error: 'Abonelik güncellenemedi' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Upgrade error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Downgrade işlemini gerçekleştir (period sonunda)
 */
export const scheduleDowngrade = async ({
  userId,
  newPlanId,
  newBillingCycle
}: UpgradeParams): Promise<{ success: boolean; error?: string }> => {
  try {
    // Downgrade'i hemen yapmak yerine period sonuna zamanla
    const { data: currentSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!currentSub) {
      return { success: false, error: 'Aktif abonelik bulunamadı' };
    }

    // scheduled_plan_change alanına kaydet (yeni alan eklemen gerekebilir)
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        scheduled_plan_id: newPlanId,
        scheduled_billing_cycle: newBillingCycle,
        scheduled_change_date: currentSub.current_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      return { success: false, error: 'Downgrade zamanlanamadı' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Upgrade geçmişini getir
 */
export const getUpgradeHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('subscription_upgrades')
    .select(`
      *,
      from_plan:from_plan_id(name, display_name),
      to_plan:to_plan_id(name, display_name)
    `)
    .eq('user_id', userId)
    .order('upgrade_date', { ascending: false });

  if (error) {
    console.error('Error fetching upgrade history:', error);
    return [];
  }

  return data || [];
};