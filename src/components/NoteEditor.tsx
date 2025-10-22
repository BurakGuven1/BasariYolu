import { useEffect, useMemo, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { X, Save, Tag, Palette, Star, Pin, BookOpen } from 'lucide-react';
import {
  sanitizeNoteForStorage,
  sanitizeNoteFromDb,
  sanitizeTagValue
} from '../utils/security';

interface NoteEditorProps {
  note?: any;
  onSave: (noteData: any) => void;
  onClose: () => void;
}

const SUBJECTS = [
  'Matematik',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Turkce',
  'Edebiyat',
  'Tarih',
  'Cografya',
  'Felsefe',
  'Ingilizce',
  'Genel'
];

const COLORS = [
  { name: 'Mavi', value: '#3B82F6' },
  { name: 'Yesil', value: '#10B981' },
  { name: 'Sari', value: '#F59E0B' },
  { name: 'Kirmizi', value: '#EF4444' },
  { name: 'Mor', value: '#8B5CF6' },
  { name: 'Pembe', value: '#EC4899' },
  { name: 'Turuncu', value: '#F97316' },
  { name: 'Gri', value: '#6B7280' }
];

export default function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
  const safeNote = useMemo(() => (note ? sanitizeNoteFromDb(note) : undefined), [note]);

  const [title, setTitle] = useState(safeNote?.title ?? '');
  const [content, setContent] = useState(safeNote?.content ?? '');
  const [subject, setSubject] = useState(safeNote?.subject ?? '');
  const [tags, setTags] = useState<string[]>(safeNote?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState(safeNote?.color ?? COLORS[0].value);
  const [isFavorite, setIsFavorite] = useState<boolean>(safeNote?.is_favorite ?? false);
  const [isPinned, setIsPinned] = useState<boolean>(safeNote?.is_pinned ?? false);

  useEffect(() => {
    if (safeNote) {
      setTitle(safeNote.title ?? '');
      setContent(safeNote.content ?? '');
      setSubject(safeNote.subject ?? '');
      setTags(safeNote.tags ?? []);
      setColor(safeNote.color ?? COLORS[0].value);
      setIsFavorite(Boolean(safeNote.is_favorite));
      setIsPinned(Boolean(safeNote.is_pinned));
    } else {
      setTitle('');
      setContent('');
      setSubject('');
      setTags([]);
      setColor(COLORS[0].value);
      setIsFavorite(false);
      setIsPinned(false);
    }
    setTagInput('');
  }, [safeNote]);

  const handleAddTag = () => {
    const value = sanitizeTagValue(tagInput);
    if (value && !tags.includes(value)) {
      setTags(prev => [...prev, value]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Lutfen not basligini girin');
      return;
    }

    const noteData = sanitizeNoteForStorage({
      title: title.trim(),
      content,
      subject: subject || null,
      tags,
      color,
      is_favorite: isFavorite,
      is_pinned: isPinned,
      last_edited_at: new Date().toISOString()
    });

    onSave(noteData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div
          className="flex items-center justify-between p-6 border-b border-gray-200"
          style={{ background: `${color}15` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: color }}
            >
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {note ? 'Notu Duzenle' : 'Yeni Not'}
              </h2>
              <p className="text-sm text-gray-600">Markdown destekli not editoru</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Not Basligi *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Orn: Integral formulleri"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
              style={{ borderColor: color }}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ders
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seciniz</option>
                {SUBJECTS.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Ozellikler
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFavorite(prev => !prev)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    isFavorite
                      ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                  Favori
                </button>
                <button
                  type="button"
                  onClick={() => setIsPinned(prev => !prev)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    isPinned
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Pin className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
                  Sabitle
                </button>
              </div>
            </div>
          </div>

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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Etiket ekle (Enter'a bas)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddTag}
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Ekle
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2 font-medium"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      type="button"
                      className="hover:text-blue-900 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Not Rengi
            </label>
            <div className="flex gap-3 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  type="button"
                  className={`w-12 h-12 rounded-lg transition-all hover:scale-110 ${
                    color === c.value ? 'scale-110' : ''
                  }`}
                  style={{
                    background: c.value,
                    boxShadow: color === c.value ? `0 0 0 4px ${c.value}40` : 'none'
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Not Icerigi
            </label>
            <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: color }}>
              <MDEditor
                value={content}
                onChange={(val) => setContent(val ?? '')}
                height={400}
                preview="live"
                hideToolbar={false}
                enableScroll
                visibleDragbar={false}
                textareaProps={{
                  placeholder:
                    '# Baslik\n\n**Kalın metin** - Ctrl+B\n\n*Italic metin* - Ctrl+I\n\n- Liste oge\n\n1. Numarali liste\n\n> Alinti\n\n```javascript\nkod blogu\n```\n\n[Link](https://example.com)\n\n![Resim](url)'
                }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-4 flex-wrap">
              <span>Markdown destekli editor</span>
              <span>Canli onizleme aktif</span>
              <span>Ctrl+B = Kalin, Ctrl+I = Italik</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Iptal
            </button>
            <button
              onClick={handleSave}
              type="button"
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
