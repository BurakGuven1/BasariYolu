export const OPENAI_API_KEY =
  process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';

type VisionContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export type ChatMessageInput = {
  role: 'user' | 'assistant' | 'system';
  content: string | VisionContent[];
};

export const chatWithOpenAI = async (messages: ChatMessageInput[]) => {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key missing');

  const hasImage = messages.some((m) => Array.isArray(m.content));
  const formattedMessages = messages.map((m) => {
    if (Array.isArray(m.content)) {
      const parts = m.content.map((part) =>
        part.type === 'text'
          ? { type: 'text', text: part.text }
          : { type: 'image_url', image_url: { url: part.image_url?.url ?? '' } }
      );
      return { role: m.role, content: parts };
    }
    return { role: m.role, content: m.content };
  });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: hasImage ? 'gpt-4o' : 'gpt-4o-mini',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
};
