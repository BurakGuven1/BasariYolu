import { useState } from 'react';
import { Star, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface FormulaCardProps {
  formula: {
    id: string;
    title: string;
    formula: string;
    explanation: string;
    example?: string;
    difficulty: string;
    frequency_score: number;
    tags: string[];
    category: string;
  };
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPractice: () => void;
}

export default function FormulaCard({ formula, isFavorite, onToggleFavorite, onPractice }: FormulaCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'kolay': return 'bg-green-100 text-green-700 border-green-300';
      case 'orta': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'zor': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getFrequencyBadge = (score: number) => {
    if (score >= 90) return { text: 'Çok Sık', color: 'bg-red-500' };
    if (score >= 70) return { text: 'Sık', color: 'bg-orange-500' };
    if (score >= 50) return { text: 'Orta', color: 'bg-yellow-500' };
    return { text: 'Az', color: 'bg-gray-500' };
  };

  const frequencyBadge = getFrequencyBadge(formula.frequency_score);

  return (
    <div className="relative group">
      {/* Flip Container */}
      <div 
        className="relative h-80 cursor-pointer"
        style={{ perspective: '1000px' }}
      >
        <div 
          className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
          onClick={() => {
            setIsFlipped(!isFlipped);
            if (!isFlipped) onPractice();
          }}
        >
          {/* Front Side */}
          <div 
            className="absolute w-full h-full backface-hidden bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <span className="text-xs text-gray-500 font-medium">{formula.category}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{formula.title}</h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite 
                    ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                <Star className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Formula Display */}
            <div className="flex items-center justify-center h-32 bg-blue-50 rounded-lg mb-4 overflow-auto">
              <div className="text-2xl text-center px-4">
                <InlineMath math={formula.formula} />
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {formula.tags.slice(0, 3).map((tag, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(formula.difficulty)}`}>
                  {formula.difficulty === 'kolay' ? '🟢 Kolay' : 
                   formula.difficulty === 'orta' ? '🟡 Orta' : '🔴 Zor'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${frequencyBadge.color}`}>
                  ⚡ {frequencyBadge.text}
                </span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                <span>Çevir</span>
              </div>
            </div>
          </div>

          {/* Back Side */}
          <div 
            className="absolute w-full h-full backface-hidden bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg p-6 text-white rotate-y-180"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="h-full flex flex-col">
              <h4 className="text-sm font-semibold mb-2 opacity-90">Açıklama</h4>
              <p className="text-base mb-4">{formula.explanation}</p>

              {formula.example && (
                <div className="mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExample(!showExample);
                    }}
                    className="flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors mb-2"
                  >
                    {showExample ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span>{showExample ? 'Örneği Gizle' : 'Örnek Göster'}</span>
                  </button>
                  
                  {showExample && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-sm">
                      {formula.example}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-white/20 text-xs opacity-75">
                Tekrar çevirmek için tıkla
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}