import React, { useState, useEffect } from 'react';
import { Users, Plus, Upload, Download, Edit2, Trash2, Phone, Mail, Search, AlertCircle, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react';
import {
  getInstitutionParents,
  createParentContact,
  updateParentContact,
  deleteParentContact,
  importParentsFromCSV,
  parseParentCSV,
  downloadParentCSVTemplate,
  ParentContact,
  BulkParentImport
} from '../lib/parentContactApi';

interface InstitutionParentsPanelProps {
  institutionId: string;
}

export default function InstitutionParentsPanel({ institutionId }: InstitutionParentsPanelProps) {
  const [parents, setParents] = useState<ParentContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingParent, setEditingParent] = useState<ParentContact | null>(null);

  useEffect(() => {
    loadParents();
  }, [institutionId]);

  const loadParents = async () => {
    setLoading(true);
    try {
      const { data, error } = await getInstitutionParents(institutionId);
      if (error) throw error;
      setParents(data || []);
    } catch (error) {
      console.error('Error loading parents:', error);
      alert('Veli listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredParents = parents.filter(parent =>
    parent.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    parent.student?.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    parent.phone?.includes(searchQuery) ||
    parent.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteParent = async (parentId: string) => {
    if (!confirm('Bu veli kaydını silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await deleteParentContact(parentId);
      if (error) throw error;
      alert('Veli kaydı silindi');
      loadParents();
    } catch (error: any) {
      console.error('Error deleting parent:', error);
      alert('Silme hatası: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Veli Yönetimi</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Toplam {parents.length} veli kaydı
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => downloadParentCSVTemplate()}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Şablon İndir</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Excel Yükle</span>
          </button>
          <button
            onClick={() => {
              setEditingParent(null);
              setShowAddModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Veli Ekle</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Veli adı, öğrenci adı, telefon veya email ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Parents Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredParents.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz veli kaydı yok'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Veli Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Öğrenci
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İletişim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tercih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Yakınlık
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredParents.map((parent) => (
                  <tr key={parent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {parent.parent_name}
                      </div>
                      {parent.notes && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {parent.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {parent.student?.profile?.full_name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {parent.phone && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Phone className="w-4 h-4 mr-2" />
                            {parent.phone}
                          </div>
                        )}
                        {parent.email && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Mail className="w-4 h-4 mr-2" />
                            {parent.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        parent.preferred_contact_method === 'whatsapp'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : parent.preferred_contact_method === 'email'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {parent.preferred_contact_method === 'whatsapp' ? 'WhatsApp' :
                         parent.preferred_contact_method === 'email' ? 'Email' : 'Her İkisi'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {parent.relation || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingParent(parent);
                          setShowAddModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-3"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteParent(parent.id!)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddEditParentModal
          institutionId={institutionId}
          parent={editingParent}
          onClose={() => {
            setShowAddModal(false);
            setEditingParent(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingParent(null);
            loadParents();
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportParentsModal
          institutionId={institutionId}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            loadParents();
          }}
        />
      )}
    </div>
  );
}

// Add/Edit Parent Modal Component
interface AddEditParentModalProps {
  institutionId: string;
  parent: ParentContact | null;
  onClose: () => void;
  onSuccess: () => void;
}

function AddEditParentModal({ institutionId, parent, onClose, onSuccess }: AddEditParentModalProps) {
  const [formData, setFormData] = useState({
    parent_name: parent?.parent_name || '',
    student_id: parent?.student_id || '',
    phone: parent?.phone || '',
    email: parent?.email || '',
    preferred_contact_method: parent?.preferred_contact_method || 'whatsapp',
    relation: parent?.relation || '',
    notes: parent?.notes || ''
  });
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    // Kurum öğrencilerini yükle (basitleştirilmiş)
    setLoadingStudents(false);
    // TODO: Implement proper student loading
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (parent?.id) {
        // Update
        const { error } = await updateParentContact(parent.id, formData);
        if (error) throw error;
        alert('Veli bilgileri güncellendi');
      } else {
        // Create
        const { error } = await createParentContact({
          ...formData,
          institution_id: institutionId
        });
        if (error) throw error;
        alert('Veli kaydı oluşturuldu');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error saving parent:', error);
      alert('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {parent ? 'Veli Düzenle' : 'Yeni Veli Ekle'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Veli Ad Soyad *
              </label>
              <input
                type="text"
                value={formData.parent_name}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="05XX XXX XX XX"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                İletişim Tercihi
              </label>
              <select
                value={formData.preferred_contact_method}
                onChange={(e) => setFormData({ ...formData, preferred_contact_method: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="both">Her İkisi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Yakınlık
              </label>
              <input
                type="text"
                value={formData.relation}
                onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                placeholder="Anne, Baba, Vasi, vb."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notlar
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : (parent ? 'Güncelle' : 'Ekle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Import Parents Modal Component
interface ImportParentsModalProps {
  institutionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function ImportParentsModal({ institutionId, onClose, onSuccess }: ImportParentsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const parsedData = parseParentCSV(text);

      const { data, error } = await importParentsFromCSV(institutionId, parsedData);
      if (error) throw error;

      setResult(data!);

      if (data!.failed === 0) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      alert('İçe aktarma hatası: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Excel/CSV ile Toplu Veli Ekleme
        </h3>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Adımlar:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>"Şablon İndir" butonu ile örnek Excel dosyasını indirin</li>
                <li>Veli bilgilerini doldurun</li>
                <li>Doldurduğunuz dosyayı buradan yükleyin</li>
              </ol>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CSV/Excel Dosyası Seç
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          {result && (
            <div className={`rounded-lg p-4 ${
              result.failed === 0
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex items-start space-x-3">
                {result.failed === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Başarılı: {result.success} | Başarısız: {result.failed}
                  </p>
                  {result.errors.length > 0 && (
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      <p className="font-medium mb-1">Hatalar:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {result.errors.length > 5 && (
                          <li>... ve {result.errors.length - 5} hata daha</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {result?.failed === 0 ? 'Kapat' : 'İptal'}
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {importing ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
