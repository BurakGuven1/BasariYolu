import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import {
  InstitutionStudentRequest,
  listInstitutionStudentRequests,
  updateInstitutionStudentRequestStatus,
} from '../lib/institutionStudentApi';

interface InstitutionStudentApprovalPanelProps {
  institutionId: string;
}

export default function InstitutionStudentApprovalPanel({ institutionId }: InstitutionStudentApprovalPanelProps) {
  const [requests, setRequests] = useState<InstitutionStudentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listInstitutionStudentRequests(institutionId);
      setRequests(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Öğrenci listesi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [institutionId]);

  const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
    setUpdatingId(requestId);
    try {
      await updateInstitutionStudentRequestStatus(requestId, status);
      await loadRequests();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'İşlem tamamlanamadı');
    } finally {
      setUpdatingId(null);
    }
  };

  const pending = requests.filter((req) => req.status === 'pending');
  const approved = requests.filter((req) => req.status === 'approved');
  const rejected = requests.filter((req) => req.status === 'rejected');

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-500">Kurum Öğrenci Girişi</p>
          <h2 className="text-lg font-semibold text-gray-900">Öğrenci onayları</h2>
          <p className="text-xs text-gray-500">
            Davet koduyla kayıt olan öğrencileri kurum onayı sonrası içeri alabilirsiniz.
          </p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-800"
        >
          Yenile
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Öğrenciler yükleniyor...</p>
      ) : (
        <div className="mt-4 space-y-5">
          <RequestGroup
            title="Onay bekleyenler"
            emptyText="Şu anda onay bekleyen öğrenci bulunmuyor."
            requests={pending}
            onApprove={(id) => handleAction(id, 'approved')}
            onReject={(id) => handleAction(id, 'rejected')}
            updatingId={updatingId}
          />

          <RequestGroup
            title="Onaylanan öğrenciler"
            emptyText="Henüz onaylanmış öğrenci yok."
            requests={approved}
            variant="approved"
          />

          <RequestGroup
            title="Reddedilen başvurular"
            emptyText="Reddedilen başvuru bulunmuyor."
            requests={rejected}
            variant="rejected"
          />
        </div>
      )}
    </div>
  );
}

interface RequestGroupProps {
  title: string;
  requests: InstitutionStudentRequest[];
  emptyText: string;
  variant?: 'approved' | 'rejected';
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  updatingId?: string | null;
}

function RequestGroup({
  title,
  requests,
  emptyText,
  variant,
  onApprove,
  onReject,
  updatingId,
}: RequestGroupProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
          {requests.length}
        </span>
      </div>
      {requests.length === 0 ? (
        <p className="mt-2 text-xs text-gray-500">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {requests.map((request) => (
            <li
              key={request.id}
              className="rounded-xl border border-gray-100 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{request.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {request.email} • {request.phone || 'Telefon belirtilmedi'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Kayıt: {new Date(request.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>

                {variant ? (
                  <StatusChip variant={variant} />
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={updatingId === request.id}
                      onClick={() => onReject?.(request.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reddet
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === request.id}
                      onClick={() => onApprove?.(request.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-600 hover:border-green-300 hover:text-green-700 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Onayla
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusChip({ variant }: { variant: 'approved' | 'rejected' }) {
  if (variant === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
        <Check className="h-3.5 w-3.5" />
        Onaylandı
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
      <X className="h-3.5 w-3.5" />
      Reddedildi
    </span>
  );
}
