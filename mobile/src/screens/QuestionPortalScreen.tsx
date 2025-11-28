import React, { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { chatWithOpenAI } from '../lib/openai';
import { useAuth } from '../contexts/AuthContext';

type QuestionItem = {
  id: string;
  title: string;
  body: string;
  answer?: string;
  createdAt: string;
};

export function QuestionPortalScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Uyarı', 'Soru başlığı gerekli');
      return;
    }
    setLoading(true);
    const newItem: QuestionItem = {
      id: `${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };
    setQuestions((prev) => [newItem, ...prev]);
    setTitle('');
    setBody('');

    // AI'dan ilk yanıtı çek (isteğe bağlı)
    try {
      const answer = await chatWithOpenAI([
        { role: 'system', content: 'Lütfen lise/üniversite sınav seviyesinde kısa bir çözüm öner.' },
        { role: 'user', content: `${newItem.title}\n${newItem.body}` },
      ]);
      setQuestions((prev) =>
        prev.map((q) => (q.id === newItem.id ? { ...q, answer } : q)),
      );
    } catch (err: any) {
      console.warn('AI cevap hatası', err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Soru Portalı</Text>
          <Text style={styles.subtitle}>
            {user?.email ?? 'Misafir'} olarak soru paylaş ve yanıtları gör.
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Soru başlığı"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Soru detayları (isteğe bağlı)"
            placeholderTextColor="#94A3B8"
            value={body}
            onChangeText={setBody}
            multiline
          />
          <Button title={loading ? 'Gönderiliyor...' : 'Soru Ekle'} onPress={handleSubmit} />
        </View>

        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.qTitle}>{item.title}</Text>
              {item.body ? <Text style={styles.qBody}>{item.body}</Text> : null}
              <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString('tr-TR')}</Text>
              {item.answer ? (
                <View style={styles.answerBox}>
                  <Text style={styles.answerLabel}>AI Yanıtı</Text>
                  <Text style={styles.answer}>{item.answer}</Text>
                </View>
              ) : (
                <Text style={styles.waiting}>Yanıt bekleniyor...</Text>
              )}
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { padding: 16, gap: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: '#475569' },
  form: { paddingHorizontal: 16, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  textarea: { height: 100, textAlignVertical: 'top' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 6,
  },
  qTitle: { fontWeight: '700', color: '#0F172A', fontSize: 16 },
  qBody: { color: '#475569' },
  meta: { color: '#94A3B8', fontSize: 12 },
  answerBox: { marginTop: 6, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', gap: 4 },
  answerLabel: { fontWeight: '700', color: '#0F172A' },
  answer: { color: '#334155' },
  waiting: { color: '#94A3B8', fontSize: 12 },
});
