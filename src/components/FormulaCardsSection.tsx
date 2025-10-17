import { useState, useEffect } from 'react';
import { Search, Star, BookOpen, Grid3x3, List } from 'lucide-react';
import FormulaCard from './FormulaCard';
import { supabase } from '../lib/supabase';

interface FormulaCardsSectionProps {
  studentId: string;
}

export default function FormulaCardsSection({ studentId }: FormulaCardsSectionProps) {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'frequency' | 'difficulty' | 'alphabetical'>('frequency');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const subjects = [
    'TYT Matematik', 'TYT Fizik', 'TYT Kimya', 'TYT Biyoloji',
    'AYT Matematik', 'AYT Fizik', 'AYT Kimya', 'AYT Biyoloji',
    'LGS Matematik', 'LGS Fen'
  ];

  useEffect(() => {
    loadFormulas();
    loadFavorites();
  }, [selectedSubject, sortBy]);

  const loadFormulas = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('formula_cards')
        .select('*');

      if (selectedSubject !== 'all') {
        query = query.eq('subject', selectedSubject);
      }

      // Sorting
      if (sortBy === 'frequency') {
        query = query.order('frequency_score', { ascending: false });
      } else if (sortBy === 'difficulty') {
        query = query.order('difficulty', { ascending: true });
      } else {
        query = query.order('title', { ascending: true });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setFormulas(data || []);
    } catch (error) {
      console.error('Error loading formulas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const { data } = await supabase
        .from('user_formula_favorites')
        .select('formula_id')
        .eq('student_id', studentId);

      if (data) {
        setFavorites(new Set(data.map(f => f.formula_id)));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (formulaId: string) => {
    try {
      if (favorites.has(formulaId)) {
        await supabase
          .from('user_formula_favorites')
          .delete()
          .eq('student_id', studentId)
          .eq('formula_id', formulaId);
        
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(formulaId);
          return newSet;
        });
      } else {
        await supabase
          .from('user_formula_favorites')
          .insert([{ student_id: studentId, formula_id: formulaId }]);
        
        setFavorites(prev => new Set(prev).add(formulaId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handlePractice = async (formulaId: string) => {
    try {
      await supabase
        .from('user_formula_practice')
        .insert([{ student_id: studentId, formula_id: formulaId }]);
    } catch (error) {
      console.error('Error logging practice:', error);
    }
  };

  // Filtering
  const filteredFormulas = formulas.filter(formula => {
    if (showFavoritesOnly && !favorites.has(formula.id)) return false;
    if (selectedCategory !== 'all' && formula.category !== selectedCategory) return false;
    if (searchQuery && !formula.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !formula.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    return true;
  });

  const categories = Array.from(new Set(formulas.map(f => f.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8" />
          <h2 className="text-3xl font-bold">Formül Kartları</h2>
        </div>
        <p className="text-purple-100">
          Sınavda en çok çıkan formülleri flashcard tarzında öğren ve pratik yap
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span>{formulas.length} Formül</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <span>{favorites.size} Favori</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span>Profesyonel Paket Özelliği</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Formül ara..."
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

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={selectedSubject === 'all'}
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="frequency">Sıklığa Göre</option>
            <option value="difficulty">Zorluk Seviyesi</option>
            <option value="alphabetical">A-Z</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFavoritesOnly
                ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            <span>Favorilerim</span>
          </button>

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
        {filteredFormulas.length} formül bulundu
      </div>

      {/* Formula Cards Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredFormulas.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Formül bulunamadı</p>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        }`}>
          {filteredFormulas.map(formula => (
            <FormulaCard
              key={formula.id}
              formula={formula}
              isFavorite={favorites.has(formula.id)}
              onToggleFavorite={() => toggleFavorite(formula.id)}
              onPractice={() => handlePractice(formula.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}