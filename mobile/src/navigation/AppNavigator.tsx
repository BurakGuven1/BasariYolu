import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { RootStackParamList } from '../types';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import StudentDashboardScreen from '../screens/StudentDashboardScreen';
import ParentDashboardScreen from '../screens/ParentDashboardScreen';
import ExamFormScreen from '../screens/ExamFormScreen';
import HomeworkFormScreen from '../screens/HomeworkFormScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {user ? (
          // Authenticated Stack
          <>
            {user.isParentLogin ? (
              <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
            ) : (
              <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
            )}
            <Stack.Screen
              name="ExamForm"
              component={ExamFormScreen}
              options={{
                headerShown: true,
                headerTitle: 'Sınav Formu',
                headerStyle: {
                  backgroundColor: '#ffffff',
                },
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="HomeworkForm"
              component={HomeworkFormScreen}
              options={{
                headerShown: true,
                headerTitle: 'Ödev Formu',
                headerStyle: {
                  backgroundColor: '#ffffff',
                },
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
                presentation: 'modal',
              }}
            />
          </>
        ) : (
          // Auth Stack
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
