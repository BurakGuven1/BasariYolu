import { useState, useEffect } from 'react';
import { ArrowUp, Clock } from 'lucide-react';
import { getUpgradeHistory } from '../lib/subscriptionUpgrade';
import { useAuth } from '../hooks/useAuth';

export default function UpgradeHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user?.id]);

  const loadHistory = async () => {
    if (!user?.id) return;
    const data = await getUpgradeHistory(user.id);
    setHistory(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center shadow-sm">
        <ArrowUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Henüz paket değişikliği yapmadınız</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Paket Değişiklik Geçmişi</h3>
      </div>
      <div className="divide-y">
        {history.map((item) => (
          <div key={item.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <ArrowUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">
                    {item.from_plan?.display_name || 'Eski Paket'} → {item.to_plan?.display_name || 'Yeni Paket'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.from_billing_cycle === 'monthly' ? 'Aylık' : 'Yıllık'} → {item.to_billing_cycle === 'monthly' ? 'Aylık' : 'Yıllık'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(item.upgrade_date).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Ödenen</p>
                <p className="text-lg font-bold text-green-600">
                  {item.amount_paid.toFixed(2)}₺
                </p>
                {item.credit_amount > 0 && (
                  <p className="text-xs text-gray-500">
                    (Kredi: -{item.credit_amount.toFixed(2)}₺)
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}