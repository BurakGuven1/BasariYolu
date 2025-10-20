import { useState, useEffect } from 'react';
import { Plus, Search, Star, Pin, BookOpen, Grid3x3, List } from 'lucide-react';
import NoteCard from './NoteCard';
import NoteEditor from './NoteEditor';
import { supabase } from '../lib/supabase';

interface NotesSectionProps {
  studentId: string;
}

export default function NotesSection({ studentId }: NotesSectionProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'favorite' | 'pinned'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const subjects = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Edebiyat', 'Tarih', 'Coğrafya', 'Felsefe', 'İngilizce', 'Genel'];

  useEffect(() => {
    loadNotes();
  }, [studentId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_notes')
        .select('*')
        .eq('student_id', studentId)
        .order('is_pinned', { ascending: false })
        .order('last_edited_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (noteData: any) => {
    try {
      if (editingNote) {
        // Update existing note
        const { error } = await supabase
          .from('student_notes')
          .update(noteData)
          .eq('id', editingNote.id);

        if (error) throw error;
      } else {
        // Create new note
        const { error } = await supabase
          .from('student_notes')
          .insert([{ ...noteData, student_id: studentId }]);

        if (error) throw error;
      }

      setShowEditor(false);
      setEditingNote(null);
      loadNotes();
      alert(editingNote ? 'Not güncellendi!' : 'Not oluşturuldu!');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Not kaydedilirken hata oluştu');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) return;

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
      alert('Not silinirken hata oluştu');
    }
  };

  const handleToggleFavorite = async (note: any) => {
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
  };

  const handleTogglePin = async (note: any) => {
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
  };

  // Get all unique tags
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags || [])));

  // Filter notes
  const filteredNotes = notes.filter(note => {
    if (searchQuery && !note.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !note.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedSubject !== 'all' && note.subject !== selectedSubject) return false;
    if (selectedTag !== 'all' && !note.tags.includes(selectedTag)) return false;
    if (filterType === 'favorite' && !note.is_favorite) return false;
    if (filterType === 'pinned' && !note.is_pinned) return false;
    return true;
  });

  // Statistics
  const stats = {
    total: notes.length,
    favorites: notes.filter(n => n.is_favorite).length,
    pinned: notes.filter(n => n.is_pinned).length,
    subjects: new Set(notes.filter(n => n.subject).map(n => n.subject)).size
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-8 w-8" />
              <h2 className="text-3xl font-bold">Not Defterim</h2>
            </div>
            <p className="text-purple-100">
              Markdown destekli not editörü ile notlarını organize et
            </p>
          </div>
          <button
            onClick={() => {
              setEditingNote(null);
              setShowEditor(true);
            }}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors font-semibold flex items-center gap-2 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Yeni Not
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-purple-100">Toplam Not</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl font-bold">{stats.favorites}</div>
            <div className="text-sm text-purple-100">Favoriler</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl font-bold">{stats.pinned}</div>
            <div className="text-sm text-purple-100">Sabitlenmiş</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl font-bold">{stats.subjects}</div>
            <div className="text-sm text-purple-100">Ders</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Not ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Tüm Dersler</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>

          {/* Tag Filter */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Tüm Etiketler</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>#{tag}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Tümü</option>
            <option value="favorite">⭐ Favoriler</option>
            <option value="pinned">📌 Sabitlenmiş</option>
          </select>
        </div>

        {/* Quick Filters and View Mode */}
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
              <span className="text-sm font-medium">Sabitlenmiş</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Grid3x3 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {filteredNotes.length} not bulundu
        {searchQuery && ` "${searchQuery}" için`}
      </div>

      {/* Notes Grid/List */}
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
            {searchQuery || selectedSubject !== 'all' || selectedTag !== 'all' || filterType !== 'all'
              ? 'Arama kriterlerinize uygun not bulunamadı'
              : 'Henüz not eklemediniz'}
          </p>
          {!searchQuery && selectedSubject === 'all' && selectedTag === 'all' && filterType === 'all' && (
            <button
              onClick={() => {
                setEditingNote(null);
                setShowEditor(true);
              }}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              İlk Notunu Oluştur
            </button>
          )}
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        }`}>
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

      {/* Note Editor Modal */}
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