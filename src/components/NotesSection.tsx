import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Star, Pin, BookOpen, Grid3x3, List } from 'lucide-react';
import NoteCard from './NoteCard';
import NoteEditor from './NoteEditor';
import { supabase } from '../lib/supabase';
import {
  sanitizeNoteForStorage,
  sanitizeNoteFromDb,
  sanitizeSearchQuery
} from '../utils/security';

interface NotesSectionProps {
  studentId: string;
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

type FilterType = 'all' | 'favorite' | 'pinned';
type ViewMode = 'grid' | 'list';

export default function NotesSection({ studentId }: NotesSectionProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_notes')
        .select('*')
        .eq('student_id', studentId)
        .order('is_pinned', { ascending: false })
        .order('last_edited_at', { ascending: false });

      if (error) throw error;
      const safeNotes = (data ?? []).map(sanitizeNoteFromDb);
      setNotes(safeNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    loadNotes();
  }, [studentId, loadNotes]);

  const handleSaveNote = useCallback(
    async (noteData: any) => {
      try {
        const safePayload = sanitizeNoteForStorage(noteData);

        if (editingNote) {
          const { error } = await supabase
            .from('student_notes')
            .update(safePayload)
            .eq('id', editingNote.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('student_notes')
            .insert([{ ...safePayload, student_id: studentId }]);

          if (error) throw error;
        }

        setShowEditor(false);
        setEditingNote(null);
        loadNotes();
        alert(editingNote ? 'Not guncellendi!' : 'Not olusturuldu!');
      } catch (error) {
        console.error('Error saving note:', error);
        alert('Not kaydedilirken hata olustu');
      }
    },
    [editingNote, loadNotes, studentId]
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      if (!confirm('Bu notu silmek istediginizden emin misiniz?')) return;

      try {
        const { error } = await supabase
          .from('student_notes')
          .delete()
          .eq('id', noteId);

        if (error) throw error;
        loadNotes();
        alert('Not silindi');
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Not silinirken hata olustu');
      }
    },
    [loadNotes]
  );

  const handleToggleFavorite = useCallback(
    async (note: any) => {
      try {
        const { error } = await supabase
          .from('student_notes')
          .update({ is_favorite: !note.is_favorite })
          .eq('id', note.id);

        if (error) throw error;
        loadNotes();
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    },
    [loadNotes]
  );

  const handleTogglePin = useCallback(
    async (note: any) => {
      try {
        const { error } = await supabase
          .from('student_notes')
          .update({ is_pinned: !note.is_pinned })
          .eq('id', note.id);

        if (error) throw error;
        loadNotes();
      } catch (error) {
        console.error('Error toggling pin:', error);
      }
    },
    [loadNotes]
  );

  const allTags = useMemo(
    () => Array.from(new Set(notes.flatMap(note => note.tags ?? []))),
    [notes]
  );

  const sanitizedQuery = useMemo(() => sanitizeSearchQuery(searchQuery), [searchQuery]);

  const filteredNotes = useMemo(() => {
    const subjectFilter = selectedSubject.toLowerCase();
    const tagFilter = selectedTag.toLowerCase();

    return notes.filter(note => {
      if (
        sanitizedQuery &&
        !note.title.toLowerCase().includes(sanitizedQuery) &&
        !note.content.toLowerCase().includes(sanitizedQuery)
      ) {
        return false;
      }

      if (filterType === 'favorite' && !note.is_favorite) {
        return false;
      }

      if (filterType === 'pinned' && !note.is_pinned) {
        return false;
      }

      if (subjectFilter !== 'all') {
        if (!note.subject || note.subject.toLowerCase() !== subjectFilter) {
          return false;
        }
      }

      if (tagFilter !== 'all') {
        if (!note.tags?.some((tag: string) => tag.toLowerCase() === tagFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [notes, sanitizedQuery, filterType, selectedSubject, selectedTag]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notlar</h2>
          <p className="text-gray-600">
            Calisma notlarini duzenle, favori olarak isaretle ve sabitle.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingNote(null);
            setShowEditor(true);
          }}
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Yeni Not
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Baslik, icerik veya etiket ara"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="flex-1 min-w-[160px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Tum dersler</option>
            {SUBJECTS.map(subject => (
              <option key={subject} value={subject.toLowerCase()}>
                {subject}
              </option>
            ))}
          </select>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="flex-1 min-w-[160px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Tum etiketler</option>
            {allTags.map(tag => (
              <option key={tag} value={tag.toLowerCase()}>
                #{tag}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Tum notlar</option>
            <option value="favorite">Favoriler</option>
            <option value="pinned">Sabitlenenler</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType(filterType === 'favorite' ? 'all' : 'favorite')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              filterType === 'favorite'
                ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Star className={`h-4 w-4 ${filterType === 'favorite' ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">Favoriler</span>
          </button>
          <button
            onClick={() => setFilterType(filterType === 'pinned' ? 'all' : 'pinned')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              filterType === 'pinned'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Pin className={`h-4 w-4 ${filterType === 'pinned' ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">Sabitlenenler</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Grid3x3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        {filteredNotes.length} not bulundu
        {sanitizedQuery && ` "${sanitizedQuery}" icin`}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {sanitizedQuery || selectedSubject !== 'all' || selectedTag !== 'all' || filterType !== 'all'
              ? 'Arama kriterlerinize uygun not bulunamadi'
              : 'Henuz not eklemediniz'}
          </p>
          {!sanitizedQuery && selectedSubject === 'all' && selectedTag === 'all' && filterType === 'all' && (
            <button
              onClick={() => {
                setEditingNote(null);
                setShowEditor(true);
              }}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Ilk notunu olustur
            </button>
          )}
        </div>
      ) : (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => {
                setEditingNote(note);
                setShowEditor(true);
              }}
              onDelete={() => handleDeleteNote(note.id)}
              onToggleFavorite={() => handleToggleFavorite(note)}
              onTogglePin={() => handleTogglePin(note)}
            />
          ))}
        </div>
      )}

      {showEditor && (
        <NoteEditor
          note={editingNote}
          onSave={handleSaveNote}
          onClose={() => {
            setShowEditor(false);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
}
