import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ArrowLeft, Mail, Lock, User, AlertCircle } from 'lucide-react-native';
import { signIn, getProfile, getStudentData, getParentData } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

type LoginType = 'student' | 'parent';

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [loginType, setLoginType] = useState<LoginType>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setParentUser } = useAuth();

  const handleStudentLogin = async () => {
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    if (!email.includes('@')) {
      setError('Geçerli bir email adresi girin');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await signIn(email, password);

      if (signInError) {
        setError('Giriş başarısız. Email veya şifre hatalı.');
        return;
      }

      if (data.user) {
        const { data: profile, error: profileError } = await getProfile(data.user.id);

        if (profileError || !profile) {
          setError('Profil bilgileri alınamadı');
          return;
        }

        if (profile.user_type !== 'student') {
          setError('Bu hesap bir öğrenci hesabı değil');
          await signIn(email, password); // Sign out
          return;
        }

        // Successfully logged in as student
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleParentLogin = async () => {
    if (!parentEmail || !parentPassword) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    if (!parentEmail.includes('@')) {
      setError('Geçerli bir email adresi girin');
      return;
    }

    if (parentPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await signIn(parentEmail, parentPassword);

      if (signInError) {
        setError('Giriş başarısız. Email veya şifre hatalı.');
        return;
      }

      if (data.user) {
        const { data: profile, error: profileError } = await getProfile(data.user.id);

        if (profileError || !profile) {
          setError('Profil bilgileri alınamadı');
          return;
        }

        if (profile.user_type !== 'parent') {
          setError('Bu hesap bir veli hesabı değil');
          return;
        }

        // Get parent data with connected students
        const { data: parentData, error: parentError } = await getParentData(data.user.id);

        if (parentError || !parentData) {
          setError('Veli bilgileri alınamadı');
          return;
        }

        // Set parent user in context
        setParentUser({
          id: data.user.id,
          email: data.user.email,
          full_name: profile.full_name,
          connectedStudents: parentData.parent_student_connections || [],
        });
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (loginType === 'student') {
      handleStudentLogin();
    } else {
      handleParentLogin();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 items-center justify-center"
            >
              <ArrowLeft size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <View className="px-6">
            {/* Title */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900 mb-2">Giriş Yap</Text>
              <Text className="text-base text-gray-600">
                Hesabınıza giriş yaparak devam edin
              </Text>
            </View>

            {/* Login Type Selector */}
            <View className="flex-row bg-gray-100 rounded-xl p-1 mb-6">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${
                  loginType === 'student' ? 'bg-white' : ''
                }`}
                onPress={() => setLoginType('student')}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-center">
                  <User
                    size={20}
                    color={loginType === 'student' ? '#6366f1' : '#6b7280'}
                  />
                  <Text
                    className={`ml-2 font-semibold ${
                      loginType === 'student' ? 'text-indigo-600' : 'text-gray-600'
                    }`}
                  >
                    Öğrenci
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${
                  loginType === 'parent' ? 'bg-white' : ''
                }`}
                onPress={() => setLoginType('parent')}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-center">
                  <User size={20} color={loginType === 'parent' ? '#6366f1' : '#6b7280'} />
                  <Text
                    className={`ml-2 font-semibold ${
                      loginType === 'parent' ? 'text-indigo-600' : 'text-gray-600'
                    }`}
                  >
                    Veli
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex-row items-start">
                <AlertCircle size={20} color="#ef4444" />
                <Text className="text-red-700 ml-2 flex-1">{error}</Text>
              </View>
            ) : null}

            {/* Student Login Form */}
            {loginType === 'student' && (
              <View className="mb-6">
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                    <Mail size={20} color="#9ca3af" />
                    <TextInput
                      className="flex-1 py-4 px-3 text-base text-gray-900"
                      placeholder="ornek@email.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Şifre</Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                    <Lock size={20} color="#9ca3af" />
                    <TextInput
                      className="flex-1 py-4 px-3 text-base text-gray-900"
                      placeholder="••••••••"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Parent Login Form */}
            {loginType === 'parent' && (
              <View className="mb-6">
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                    <Mail size={20} color="#9ca3af" />
                    <TextInput
                      className="flex-1 py-4 px-3 text-base text-gray-900"
                      placeholder="veli@email.com"
                      value={parentEmail}
                      onChangeText={setParentEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Şifre</Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                    <Lock size={20} color="#9ca3af" />
                    <TextInput
                      className="flex-1 py-4 px-3 text-base text-gray-900"
                      placeholder="••••••••"
                      value={parentPassword}
                      onChangeText={setParentPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              className={`rounded-xl py-4 px-6 mb-6 ${
                loading ? 'bg-indigo-400' : 'bg-indigo-600 active:bg-indigo-700'
              }`}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center text-lg font-semibold">
                  Giriş Yap
                </Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View className="flex-row items-center justify-center">
              <Text className="text-gray-600 text-base">Hesabınız yok mu? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
              >
                <Text className="text-indigo-600 text-base font-semibold">Kayıt Ol</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
