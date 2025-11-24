import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import {
  InstitutionDashboard,
  ParentDashboard,
  TeacherDashboard,
} from './src/screens/RoleDashboards';
import { StudentDashboard } from './src/screens/StudentDashboard';
import { QuestionListScreen } from './src/screens/QuestionPortal/QuestionListScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#0F172A',
    border: '#E5E7EB',
  },
};

function AppNavigator() {
  const { user, loading } = useAuth();

  // If authenticated, direct user to role-specific screen name
  const initialRoute = user
    ? user.userType === 'parent'
      ? 'Parent'
      : user.userType === 'teacher'
        ? 'Teacher'
        : user.userType === 'institution'
          ? 'Institution'
          : 'Student'
    : 'Home';

  const RoleRouter = (props: any) => {
    if (!user) return <StudentDashboard {...props} />;
    if (user.userType === 'parent') return <ParentDashboard {...props} />;
    if (user.userType === 'teacher') return <TeacherDashboard {...props} />;
    if (user.userType === 'institution') return <InstitutionDashboard {...props} />;
    return <StudentDashboard {...props} />;
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Home" component={HomeScreen} />
        {!user && <Stack.Screen name="Auth" component={AuthScreen} />}
        <Stack.Screen name="Dashboard" component={RoleRouter} />
        <Stack.Screen name="Student" component={StudentDashboard} />
        <Stack.Screen name="Parent" component={ParentDashboard} />
        <Stack.Screen name="Teacher" component={TeacherDashboard} />
        <Stack.Screen name="Institution" component={InstitutionDashboard} />
        <Stack.Screen
          name="QuestionList"
          component={QuestionListScreen}
          options={{ headerShown: true, title: 'Soru Portali' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
