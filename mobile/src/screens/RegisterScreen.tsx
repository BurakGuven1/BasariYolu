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
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ArrowLeft, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react-native';
import {
  signUp,
  createProfile,
  createStudentRecord,
  createParentRecord,
} from '../lib/supabase';

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

type RegisterType = 'student' | 'parent';

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [registerType, setRegisterType] = useState<RegisterType>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Student fields
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentPasswordConfirm, setStudentPasswordConfirm] = useState('');
  const [studentGrade, setStudentGrade] = useState('');

  // Parent fields
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentPasswordConfirm, setParentPasswordConfirm] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  const validateStudentForm = () => {
    if (!studentName || !studentEmail || !studentPassword || !studentPasswordConfirm) {
      setError('Lütfen tüm alanları doldurun');
      return false;
    }

    if (!studentEmail.includes('@')) {
      setError('Geçerli bir email adresi girin');
      return false;
    }

    if (studentPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return false;
    }

    if (studentPassword !== studentPasswordConfirm) {
      setError('Şifreler eşleşmiyor');
      return false;
    }

    if (studentGrade && (parseInt(studentGrade) < 1 || parseInt(studentGrade) > 12)) {
      setError('Sınıf 1 ile 12 arasında olmalıdır');
      return false;
    }

    return true;
  };

  const validateParentForm = () => {
    if (!parentName || !parentEmail || !parentPassword || !parentPasswordConfirm) {
      setError('Lütfen tüm alanları doldurun');
      return false;
    }

    if (!parentEmail.includes('@')) {
      setError('Geçerli bir email adresi girin');
      return false;
    }

    if (parentPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return false;
    }

    if (parentPassword !== parentPasswordConfirm) {
      setError('Şifreler eşleşmiyor');
      return false;
    }

    return true;
  };

  const handleStudentRegister = async () => {
    if (!validateStudentForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Sign up user
      const { data, error: signUpError } = await signUp(studentEmail, studentPassword);

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Bu email adresi zaten kayıtlı');
        } else {
          setError('Kayıt başarısız. Lütfen tekrar deneyin.');
        }
        return;
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await createProfile({
          id: data.user.id,
          email: studentEmail,
          full_name: studentName,
          user_type: 'student',
        });

        if (profileError) {
          setError('Profil oluşturulamadı');
          return;
        }

        // Generate unique invite code
        const inviteCode = `STU${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Create student record
        const { error: studentError } = await createStudentRecord({
          user_id: data.user.id,
          profile_id: data.user.id,
          grade: studentGrade ? parseInt(studentGrade) : null,
          invite_code: inviteCode,
        });

        if (studentError) {
          setError('Öğrenci kaydı oluşturulamadı');
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleParentRegister = async () => {
    if (!validateParentForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Sign up user
      const { data, error: signUpError } = await signUp(parentEmail, parentPassword);

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Bu email adresi zaten kayıtlı');
        } else {
          setError('Kayıt başarısız. Lütfen tekrar deneyin.');
        }
        return;
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await createProfile({
          id: data.user.id,
          email: parentEmail,
          full_name: parentName,
          user_type: 'parent',
        });

        if (profileError) {
          setError('Profil oluşturulamadı');
          return;
        }

        // Create parent record
        const { error: parentError } = await createParentRecord({
          user_id: data.user.id,
          phone: parentPhone || null,
        });

        if (parentError) {
          setError('Veli kaydı oluşturulamadı');
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    if (registerType === 'student') {
      handleStudentRegister();
    } else {
      handleParentRegister();
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
              <Text className="text-3xl font-bold text-gray-900 mb-2">Kayıt Ol</Text>
              <Text className="text-base text-gray-600">
                Yeni hesap oluşturarak başlayın
              </Text>
            </View>

            {/* Register Type Selector */}
            <View className="flex-row bg-gray-100 rounded-xl p-1 mb-6">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${
                  registerType === 'student' ? 'bg-white' : ''
                }`}
                onPress={() => setRegisterType('student')}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-center">
                  <User
                    size={20}
                    color={registerType === 'student' ? '#6366f1' : '#6b7280'}
                  />
                  <Text
                    className={`ml-2 font-semibold ${
                      registerType === 'student' ? 'text-indigo-600' : 'text-gray-600'
                    }`}
                  >
                    Öğrenci
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${
                  registerType === 'parent' ? 'bg-white' : ''
                }`}
                onPress={() => setRegisterType('parent')}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-center">
                  <User
                    size={20}
                    color={registerType === 'parent' ? '#6366f1' : '#6b7280'}
                  />
                  <Text
                    className={`ml-2 font-semibold ${
                      registerType === 'parent' ? 'text-indigo-600' : 'text-gray-600'
                    }`}
                  >
                    Veli
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Success Message */}
            {success ? (
              <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex-row items-start">
                <CheckCircle size={20} color="#10b981" />
                <View className="ml-2 flex-1">
                  <Text className="text-green-700 font-semibold mb-1">
                    Kayıt Başarılı!
                  </Text>
                  <Text className="text-green-600">
                    Giriş sayfasına yönlendiriliyorsunuz...
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Error Message */}
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex-row items-start">
                <AlertCircle size={20} color="#ef4444" />
                <Text className="text-red-700 ml-2 flex-1">{error}</Text>
              </View>
            ) : null}

            {/* Student Register Form */}
            {registerType === 'student' && (
              <View className="mb-6">
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                    <User size={20} color="#9ca3af" />
                    <TextInput
                      className="flex-1 py-4 px-3 text-base text-gray-900"
                      placeholder="Ahmet Yılmaz"
                      value={studentName}
                      onChangeText={setStudentName}
                      editable={!loading}
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                    <Mail size={20} color="#9ca3af" />
                    <TextInput
                      className="flex-1 py-4 px-3 text-base text-gray-900"
                      placeholder="ogrenci@email.com"
                      value={studentEmail}
                      onChangeText={setStudentEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Sınıf (Opsiyonel)
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                    <User size={20} color="#9ca3af" />
                    <TextInput
                      className="flex-1 py-4 px-3 text-base text-gray-900"
                      placeholder="Örn: 9"
                      value={studentGrade}
                      onChangeText={setStudentGrade}
                      keyboardType="number-pad"
                      editable={!loading}
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Şifre</Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                    <Lock size={20} color="#9ca3af" />
                    <TextInput
                      className="flex-1 py-4 px-3 text-base text-gray-900"
                      placeholder="••••••••"
                      value={studentPassword}
                      onChangeText={setStudentPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Şifre Tekrar
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                    <Lock size={20} color="#9ca3af" />
                    <TextInput
                      className="flex-1 py-4 px-3 text-base text-gray-900"
                      placeholder="••••••••"
                      value={studentPasswordConfirm}
                      onChangeText={setStudentPasswordConfirm}
                      secureTextEntry
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Parent Register Form */}
            {registerType === 'parent' && (
              <View className="mb-6">
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                    <User size={20} color="#9ca3af" />
                    <TextInput
                      className="flex-1 py-4 px-3 text-base text-gray-900"
                      placeholder="Ayşe Demir"
                      value={parentName}
                      onChangeText={setParentName}
                      editable={!loading}
                    />
                  </View>
                </View>

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

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Telefon (Opsiyonel)
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                    <User size={20} color="#9ca3af" />
                    <TextInput
                      className="flex-1 py-4 px-3 text-base text-gray-900"
                      placeholder="05XX XXX XX XX"
                      value={parentPhone}
                      onChangeText={setParentPhone}
                      keyboardType="phone-pad"
                      editable={!loading}
                    />
                  </View>
                </View>

                <View className="mb-4">
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

                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Şifre Tekrar
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                    <Lock size={20} color="#9ca3af" />
                    <TextInput
                      className="flex-1 py-4 px-3 text-base text-gray-900"
                      placeholder="••••••••"
                      value={parentPasswordConfirm}
                      onChangeText={setParentPasswordConfirm}
                      secureTextEntry
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Register Button */}
            <TouchableOpacity
              className={`rounded-xl py-4 px-6 mb-6 ${
                loading ? 'bg-indigo-400' : 'bg-indigo-600 active:bg-indigo-700'
              }`}
              onPress={handleRegister}
              disabled={loading || success}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center text-lg font-semibold">
                  Kayıt Ol
                </Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View className="flex-row items-center justify-center mb-6">
              <Text className="text-gray-600 text-base">Zaten hesabınız var mı? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={loading || success}
              >
                <Text className="text-indigo-600 text-base font-semibold">Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
