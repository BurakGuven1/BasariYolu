import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Star, Pin, Tag, Edit, Trash2, MoreVertical, Calendar, BookOpen } from 'lucide-react';

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    content: string;
    subject: string;
    tags: string[];
    color: string;
    is_favorite: boolean;
    is_pinned: boolean;
    last_edited_at: string;
    created_at: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onTogglePin: () => void;
}

export default function NoteCard({ note, onEdit, onDelete, onToggleFavorite, onTogglePin }: NoteCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Truncate content for preview
  const previewContent = note.content.length > 150 
    ? note.content.substring(0, 150) + '...' 
    : note.content;

  return (
    <div 
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border-l-4 overflow-hidden group relative"
      style={{ borderLeftColor: note.color }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100" style={{ background: `${note.color}10` }}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {note.is_pinned && (
                <Pin className="h-4 w-4 fill-current" style={{ color: note.color }} />
              )}
              <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                {note.title}
              </h3>
            </div>
            {note.subject && (
              <span 
                className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  background: `${note.color}20`,
                  color: note.color
                }}
              >
                <BookOpen className="h-3 w-3 inline mr-1" />
                {note.subject}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                note.is_favorite
                  ? 'text-yellow-600 bg-yellow-100'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Star className={`h-4 w-4 ${note.is_favorite ? 'fill-current' : ''}`} />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[150px]">
                    <button
                      onClick={() => {
                        onEdit();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                      Düzenle
                    </button>
                    <button
                      onClick={() => {
                        onTogglePin();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                    >
                      <Pin className="h-4 w-4" />
                      {note.is_pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                    </button>
                    <button
                      onClick={() => {
                        onDelete();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Sil
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {note.tags.slice(0, 3).map((tag, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs flex items-center gap-1"
              >
                <Tag className="h-3 w-3" />
                #{tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content Preview */}
      <div className="p-4">
        <div 
          className="prose prose-sm max-w-none cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <MDEditor.Markdown 
            source={expanded ? note.content : previewContent}
            style={{ 
              background: 'transparent',
              color: 'inherit'
            }}
          />
        </div>
        
        {note.content.length > 150 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm font-medium mt-2 hover:underline"
            style={{ color: note.color }}
          >
            {expanded ? 'Daha az göster' : 'Devamını oku'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{new Date(note.last_edited_at).toLocaleDateString('tr-TR')}</span>
        </div>
        <button
          onClick={onEdit}
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          Düzenle →
        </button>
      </div>
    </div>
  );
}