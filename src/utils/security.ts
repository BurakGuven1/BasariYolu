import DOMPurify from 'dompurify';

type SanitizeOptions = Parameters<typeof DOMPurify.sanitize>[1];

const canSanitize = () => typeof window !== 'undefined';

const sanitize = (value: string, options?: SanitizeOptions) => {
  if (!value) return '';
  if (!canSanitize()) return value;
  return DOMPurify.sanitize(value, options);
};

const sanitizePlainText = (value: string) =>
  sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();

const sanitizeMarkdown = (value: string) =>
  sanitize(value, { USE_PROFILES: { html: true } }).trim();

const sanitizeTag = (value: string) =>
  sanitizePlainText(value).replace(/[^\\p{L}0-9-_\\s]/gu, '').trim();

export interface RawNoteData {
  title: string;
  content: string;
  subject?: string | null;
  tags?: string[];
  color?: string;
  is_favorite?: boolean;
  is_pinned?: boolean;
  last_edited_at?: string;
  [key: string]: unknown;
}

const allowedNoteKeys = new Set([
  'title',
  'content',
  'subject',
  'tags',
  'color',
  'is_favorite',
  'is_pinned',
  'last_edited_at'
]);

export const sanitizeNoteForStorage = (note: RawNoteData) => {
  const safeTags =
    Array.isArray(note.tags) ? note.tags.map(sanitizeTag).filter(Boolean) : [];

  const safeNote = {
    title: sanitizePlainText(note.title).slice(0, 160),
    content: sanitizeMarkdown(note.content),
    subject: note.subject ? sanitizePlainText(note.subject) : null,
    tags: safeTags,
    color: sanitizePlainText(note.color || '#3B82F6'),
    is_favorite: Boolean(note.is_favorite),
    is_pinned: Boolean(note.is_pinned),
    last_edited_at: note.last_edited_at || new Date().toISOString()
  };

  const filtered = Object.fromEntries(
    Object.entries(note).filter(([key]) => allowedNoteKeys.has(key))
  );

  return { ...safeNote, ...filtered, tags: safeNote.tags };
};

export const sanitizeNoteFromDb = (note: RawNoteData & { id: string }) => ({
  ...note,
  title: sanitizePlainText(note.title),
  content: sanitizeMarkdown(note.content),
  subject: note.subject ? sanitizePlainText(note.subject) : null,
  tags: Array.isArray(note.tags) ? note.tags.map(sanitizeTag).filter(Boolean) : [],
  color: sanitizePlainText(note.color || '#3B82F6')
});

export const sanitizeSearchQuery = (value: string) =>
  sanitizePlainText(value).toLowerCase();

export const sanitizeTagValue = (value: string) => sanitizeTag(value);
