import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { X, Save, Tag, Palette, Star, Pin, BookOpen } from 'lucide-react';

interface NoteEditorProps {
  note?: any;
  onSave: (noteData: any) => void;
  onClose: () => void;
}

const subjects = [
  'Matematik',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Türkçe',
  'Edebiyat',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'İngilizce',
  'Genel'
];

const colors = [
  { name: 'Mavi', value: '#3B82F6' },
  { name: 'Yeşil', value: '#10B981' },
  { name: 'Sarı', value: '#F59E0B' },
  { name: 'Kırmızı', value: '#EF4444' },
  { name: 'Mor', value: '#8B5CF6' },
  { name: 'Pembe', value: '#EC4899' },
  { name: 'Turuncu', value: '#F97316' },
  { name: 'Gri', value: '#6B7280' }
];

export default function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [subject, setSubject] = useState(note?.subject || '');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState(note?.color || '#3B82F6');
  const [isFavorite, setIsFavorite] = useState(note?.is_favorite || false);
  const [isPinned, setIsPinned] = useState(note?.is_pinned || false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Lütfen not başlığı girin');
      return;
    }

    const noteData = {
      title: title.trim(),
      content: content,
      subject: subject || null,
      tags: tags,
      color: color,
      is_favorite: isFavorite,
      is_pinned: isPinned,
      last_edited_at: new Date().toISOString()
    };

    onSave(noteData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200" style={{ background: `${color}15` }}>
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: color }}
            >
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {note ? 'Notu Düzenle' : 'Yeni Not'}
              </h2>
              <p className="text-sm text-gray-600">Markdown destekli not editörü</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Not Başlığı *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: İntegral Formülleri"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
              style={{ borderColor: color }}
            />
          </div>

          {/* Settings Row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ders
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Ders Seç</option>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Quick Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hızlı İşlemler
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isFavorite
                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">Favori</span>
                </button>
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isPinned
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Pin className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">Sabitle</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Etiketler
            </label>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Etiket ekle (Enter'a bas)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Ekle
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2 font-medium"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Color */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Not Rengi
            </label>
            <div className="flex gap-3">
                {colors.map(c => (
                <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={`w-12 h-12 rounded-lg transition-all hover:scale-110 ${
                    color === c.value ? 'scale-110' : ''
                    }`}
                    style={{ 
                    background: c.value,
                    boxShadow: color === c.value ? `0 0 0 4px ${c.value}40` : 'none', // ✅ ringColor yerine boxShadow
                    transform: color === c.value ? 'scale(1.1)' : 'scale(1)'
                    }}
                    title={c.name}
                >
                    {color === c.value && (
                    <span className="text-white text-xl font-bold">✓</span>
                    )}
                </button>
                ))}
            </div>
        </div>

          {/* Markdown Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Not İçeriği
            </label>
            <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: color }}>
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                height={400}
                preview="live"
                hideToolbar={false}
                enableScroll={true}
                visibleDragbar={false}
                textareaProps={{
                  placeholder: '# Başlık\n\n**Kalın metin** - Ctrl+B\n\n*İtalik metin* - Ctrl+I\n\n- Liste öğesi\n\n1. Numaralı liste\n\n> Alıntı\n\n```javascript\nkod bloğu\n```\n\n[Link](https://example.com)\n\n![Resim](url)'
                }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
              <span>💡 İpucu: Markdown ile yazın</span>
              <span>📝 Canlı önizleme aktif</span>
              <span>⌨️ Ctrl+B = Kalın, Ctrl+I = İtalik</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {note ? (
              <span>Son düzenleme: {new Date(note.last_edited_at).toLocaleString('tr-TR')}</span>
            ) : (
              <span>Yeni not oluşturuluyor</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
              style={{ background: color }}
            >
              <Save className="h-4 w-4" />
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}