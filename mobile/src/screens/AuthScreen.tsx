import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { supabase } from '../lib/supabase';
import { packages } from '../data/packages';

type Role = 'student' | 'parent' | 'teacher' | 'institution';

const ROLES: Array<{ id: Role; label: string; mode: 'login' | 'register' | 'code' }> = [
  { id: 'student', label: 'Öğrenci', mode: 'login' },
  { id: 'parent', label: 'Veli (Davet Kodu)', mode: 'code' },
  { id: 'teacher', label: 'Öğretmen', mode: 'login' },
  { id: 'institution', label: 'Kurum', mode: 'login' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({ navigation }: Props) {
  const { signIn, signUp, setUserManually } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<Role>('student');
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [packageType, setPackageType] = useState<'basic' | 'advanced' | 'professional'>('basic');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const resetFields = () => {
    setEmail('');
    setPassword('');
    setInviteCode('');
    setFullName('');
    setGrade('');
    setSchoolName('');
    setClassCode('');
    setPackageType('basic');
    setBillingCycle('monthly');
  };

  const handleParentLogin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Hata', 'Davet kodu gerekli');
      return;
    }
    setLoading(true);
    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('id, invite_code, user_id, profiles(full_name,email)')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single();

      if (error || !student) {
        throw new Error('Geçersiz davet kodu');
      }

      setUserManually({
        id: `parent-${student.id}`,
        email: student.profiles?.email ?? null,
        userType: 'parent',
      });
      navigation.replace('Parent');
      resetFields();
    } catch (err: any) {
      Alert.alert('Hata', err?.message ?? 'Veli girişi başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'E-posta ve şifre gerekli');
      return;
    }

    // Öğrenci kaydı için ek alanlar
    if (role === 'student' && mode === 'register') {
      if (!fullName.trim() || !grade || !schoolName.trim()) {
        Alert.alert('Hata', 'Ad soyad, sınıf ve okul gerekli');
        return;
      }
    }

    // Öğretmen/kurum kayıt olamaz, sadece giriş
    if ((role === 'teacher' || role === 'institution') && mode === 'register') {
      Alert.alert('Uyarı', `${ROLES.find((r) => r.id === role)?.label} için kayıt sadece yönetici tarafından yapılır. Lütfen giriş yapın.`);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password, role);
      } else {
        await signUp(email, password, role);
        // metadata güncelle
        await supabase.auth.updateUser({ data: { userType: role, full_name: fullName } });
        // basit profil kaydı
        const { data: userResp } = await supabase.auth.getUser();
        const uid = userResp.user?.id;
        if (uid) {
          await supabase.from('profiles').upsert({
            id: uid,
            email,
            role,
            full_name: fullName,
            package_type: packageType,
            billing_cycle: billingCycle,
            grade,
            school_name: schoolName,
          });

          // student tablosu
          if (role === 'student') {
            const { error: studentError } = await supabase.from('students').upsert({
              user_id: uid,
              grade: parseInt(grade, 10),
              school_name: schoolName,
            });
            if (studentError) throw studentError;

            // sınıf kodu varsa doğrula ve ekle
            if (classCode.trim()) {
              const { data: classData, error: classErr } = await supabase
                .from('classes')
                .select('id,status,current_students,student_capacity')
                .eq('invite_code', classCode.trim().toUpperCase())
                .maybeSingle();

              if (classErr || !classData) {
                Alert.alert('Uyarı', 'Sınıf kodu bulunamadı, sınıfa eklenmeden devam edildi.');
              } else if (classData.status !== 'active') {
                Alert.alert('Uyarı', 'Sınıf aktif değil, sınıfa eklenmeden devam edildi.');
              } else if (
                typeof classData.current_students === 'number' &&
                typeof classData.student_capacity === 'number' &&
                classData.current_students >= classData.student_capacity
              ) {
                Alert.alert('Uyarı', 'Sınıf dolu, sınıfa eklenmeden devam edildi.');
              } else {
                const { data: studentRow } = await supabase
                  .from('students')
                  .select('id')
                  .eq('user_id', uid)
                  .maybeSingle();

                if (studentRow?.id) {
                  await supabase.from('class_students').insert([
                    { class_id: classData.id, student_id: studentRow.id, status: 'active' },
                  ]);
                }
              }
            }
          }
        }
      }
      const target =
        role === 'teacher'
          ? 'Teacher'
          : role === 'institution'
            ? 'Institution'
            : 'Student';
      navigation.replace(target);
      resetFields();
    } catch (error: any) {
      Alert.alert('Hata', error?.message ?? 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const currentRoleMode = ROLES.find((r) => r.id === role)?.mode ?? 'login';
  const showRegisterToggle = role === 'student';

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === packageType),
    [packageType],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.box}>
          <Text style={styles.title}>Giriş / Kayıt</Text>
          <Text style={styles.caption}>Rolünü seç ve ilgili yöntemle devam et.</Text>

          <View style={styles.roles}>
            {ROLES.map((r) => (
              <Button
                key={r.id}
                title={r.label}
                variant={role === r.id ? 'primary' : 'secondary'}
                onPress={() => {
                  setRole(r.id);
                  setMode(r.mode === 'register' ? 'register' : 'login');
                }}
                style={{ flex: 1 }}
              />
            ))}
          </View>

          {role === 'parent' ? (
            <>
              <Input
                label="Davet Kodu"
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Örn: ABCD-1234"
              />
              <Button title={loading ? 'İşleniyor...' : 'Veli Girişi'} onPress={handleParentLogin} />
            </>
          ) : (
            <>
              {mode === 'register' && role === 'student' && (
                <>
                  <Input label="Ad Soyad" value={fullName} onChangeText={setFullName} placeholder="Adınız Soyadınız" />
                  <Input label="Okul" value={schoolName} onChangeText={setSchoolName} placeholder="Okul adı" />
                  <Input label="Sınıf (5-12)" value={grade} onChangeText={setGrade} placeholder="Örn: 11" />
                  <Input
                    label="Sınıf Kodu (opsiyonel)"
                    value={classCode}
                    onChangeText={setClassCode}
                    placeholder="ABCD-1234"
                  />
                  <Text style={styles.sectionTitle}>Paket Seçimi</Text>
                  <View style={styles.roles}>
                    {['basic', 'advanced', 'professional'].map((p) => (
                      <Button
                        key={p}
                        title={p === 'basic' ? 'Temel' : p === 'advanced' ? 'Gelişmiş' : 'Profesyonel'}
                        variant={packageType === p ? 'primary' : 'secondary'}
                        onPress={() => setPackageType(p as any)}
                        style={{ flex: 1 }}
                      />
                    ))}
                  </View>
                  <Text style={styles.sectionTitle}>Ödeme Döngüsü</Text>
                  <View style={styles.roles}>
                    {['monthly', 'yearly'].map((b) => (
                      <Button
                        key={b}
                        title={b === 'monthly' ? 'Aylık' : 'Yıllık'}
                        variant={billingCycle === b ? 'primary' : 'secondary'}
                        onPress={() => setBillingCycle(b as any)}
                        style={{ flex: 1 }}
                      />
                    ))}
                  </View>
                  {selectedPackage && (
                    <View style={styles.packageBox}>
                      <Text style={styles.packageTitle}>{selectedPackage.name}</Text>
                      <Text style={styles.packagePrice}>
                        {billingCycle === 'monthly'
                          ? `₺${selectedPackage.monthlyPrice}/ay`
                          : `₺${selectedPackage.yearlyPrice}/yıl`}
                      </Text>
                      <Text style={styles.packageSubtitle}>Öne çıkanlar</Text>
                      {selectedPackage.features.slice(0, 3).map((feat) => (
                        <Text key={feat} style={styles.packageFeature}>
                          • {feat}
                        </Text>
                      ))}
                    </View>
                  )}
                </>
              )}

              <Input label="E-posta" value={email} onChangeText={setEmail} placeholder="mail@example.com" />
              <Input
                label="Şifre"
                value={password}
                onChangeText={setPassword}
                placeholder="•••••••"
                secureTextEntry
              />
              <Button
                title={loading ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                onPress={handleEmailAuth}
              />
              {showRegisterToggle && (
                <Button
                  variant="secondary"
                  title={mode === 'login' ? 'Hesabın yok mu? Kayıt ol' : 'Hesabın var mı? Giriş yap'}
                  onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
                  style={{ marginTop: 8 }}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  box: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  caption: {
    color: '#475569',
    fontSize: 13,
  },
  roles: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionTitle: {
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 4,
  },
  packageBox: {
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    gap: 4,
  },
  packageTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 16,
  },
  packagePrice: {
    color: '#0F172A',
    fontWeight: '700',
  },
  packageSubtitle: {
    color: '#475569',
    fontWeight: '600',
    marginTop: 4,
  },
  packageFeature: {
    color: '#4B5563',
    fontSize: 13,
  },
});
