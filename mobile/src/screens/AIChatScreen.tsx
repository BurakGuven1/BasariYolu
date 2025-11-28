import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../components/ui/Button';
import { chatWithOpenAI, ChatMessageInput } from '../lib/openai';
import { useAuth } from '../contexts/AuthContext';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  imageUri?: string;
  imageDataUrl?: string;
};

const systemPrompt =
  'Sen sınav hazırlık asistanısın. Kısa, anlaşılır, adım adım açıklamalar yap ve gerektiğinde formülleri açıkla.';

export function AIChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{
    uri: string;
    dataUrl: string;
  } | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';
      setAttachedImage({
        uri: asset.uri,
        dataUrl: `data:${mime};base64,${asset.base64}`,
      });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Kamera izni olmadan fotoğraf çekemezsiniz.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';
      setAttachedImage({
        uri: asset.uri,
        dataUrl: `data:${mime};base64,${asset.base64}`,
      });
    }
  };

  const toOpenAIMessages = (history: ChatMessage[], latest: ChatMessage): ChatMessageInput[] => {
    const allMessages = [...history, latest];
    return [
      { role: 'system', content: systemPrompt },
      ...allMessages.map((m) => {
        if (m.imageDataUrl) {
          const parts = [];
          if (m.content.trim()) {
            parts.push({ type: 'text' as const, text: m.content });
          }
          parts.push({
            type: 'image_url' as const,
            image_url: { url: m.imageDataUrl },
          });
          return { role: m.role, content: parts };
        }
        return { role: m.role, content: m.content };
      }),
    ];
  };

  const sendMessage = async () => {
    if (!input.trim() && !attachedImage) return;

    const now = new Date().toISOString();
    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: 'user',
      content: input.trim() || (attachedImage ? 'Bu fotoğrafı çöz.' : ''),
      createdAt: now,
      imageUri: attachedImage?.uri,
      imageDataUrl: attachedImage?.dataUrl,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachedImage(null);
    setLoading(true);

    try {
      const answer = await chatWithOpenAI(toOpenAIMessages(messages, userMsg));
      const aiMsg: ChatMessage = {
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: answer,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      Alert.alert('Hata', err?.message ?? 'AI yanıtı alınamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Yapay Zeka</Text>
            <Text style={styles.subtitle}>
              {user?.email ?? 'Misafir'} olarak soru sor, fotoğraf yükle.
            </Text>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === 'assistant' ? styles.bubbleAI : styles.bubbleUser,
              ]}
            >
              <Text style={styles.bubbleText}>{item.content}</Text>
              {item.imageUri && (
                <Image source={{ uri: item.imageUri }} style={styles.bubbleImage} />
              )}
              <Text style={styles.meta}>
                {new Date(item.createdAt).toLocaleTimeString('tr-TR')}
              </Text>
            </View>
          )}
          ListFooterComponent={
            loading ? (
              <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                  <View style={[styles.typingDot, { animationDelay: '200ms' }]} />
                  <View style={[styles.typingDot, { animationDelay: '400ms' }]} />
                </View>
                <Text style={styles.typingText}>AI düşünüyor...</Text>
              </View>
            ) : null
          }
        />

        {attachedImage && (
          <View style={styles.attachmentPreview}>
            <Image source={{ uri: attachedImage.uri }} style={styles.previewImage} />
            <Pressable onPress={() => setAttachedImage(null)}>
              <Text style={styles.removeText}>Kaldır</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.actionRow}>
          <Pressable style={styles.iconButton} onPress={pickImage}>
            <Text style={styles.iconText}>🖼️</Text>
            <Text style={styles.iconLabel}>Galeriden</Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={takePhoto}>
            <Text style={styles.iconText}>📷</Text>
            <Text style={styles.iconLabel}>Kamera</Text>
          </Pressable>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Sorunu yaz veya fotoğraf ekle..."
            placeholderTextColor="#94A3B8"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <Button title={loading ? '...' : 'Gönder'} onPress={sendMessage} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { padding: 16, gap: 4, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: '#475569' },
  bubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '90%',
    gap: 8,
  },
  bubbleUser: {
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-end',
  },
  bubbleAI: {
    backgroundColor: '#F8FAFC',
    alignSelf: 'flex-start',
  },
  bubbleText: { color: '#0F172A' },
  meta: { color: '#94A3B8', fontSize: 11 },
  bubbleImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  iconButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  iconText: { fontSize: 18 },
  iconLabel: { color: '#334155', fontWeight: '600', marginTop: 4 },
  attachmentPreview: {
    marginHorizontal: 12,
    marginBottom: 8,
    gap: 6,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  removeText: {
    color: '#DC2626',
    fontWeight: '700',
    textAlign: 'right',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
  },
  typingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
  },
});
