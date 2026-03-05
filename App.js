import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { C } from './src/styles/colors';

import LoginScreen      from './src/screens/LoginScreen';
import DashboardScreen  from './src/screens/DashboardScreen';
import IncidentsScreen  from './src/screens/IncidentsScreen';
import AlertsScreen     from './src/screens/AlertsScreen';
import EvacuationScreen from './src/screens/EvacuationScreen';
import ResidentsScreen  from './src/screens/ResidentsScreen';
import ResourcesScreen  from './src/screens/ResourcesScreen';
import RiskScreen       from './src/screens/RiskScreen';
import ReportsScreen    from './src/screens/ReportsScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const NAV_THEME = {
  dark: true,
  colors: {
    primary:      C.blue,
    background:   C.bg,
    card:         C.card,
    text:         C.t1,
    border:       C.border,
    notification: C.red,
  },
};

const HDR_STYLE = {
  backgroundColor:  C.card,
  elevation:        0,
  shadowColor:      'transparent',
  borderBottomWidth: 1,
  borderBottomColor: C.border,
};

function TabIcon({ icon, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 28, height: 26 }}>
      <Text style={{ fontSize: focused ? 19 : 16 }}>{icon}</Text>
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   C.blue,
        tabBarInactiveTintColor: C.t3,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor:  C.border,
          borderTopWidth:  1,
          height:          60,
          paddingBottom:   7,
          paddingTop:      4,
        },
        tabBarLabelStyle:    { fontSize: 9, fontWeight: '700' },
        headerStyle:         HDR_STYLE,
        headerTintColor:     C.t1,
        headerTitleStyle:    { fontSize: 15, fontWeight: '700' },
        headerTitleAlign:    'center',
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ headerShown: false, tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }} />
      <Tab.Screen name="Incidents" component={IncidentsScreen}
        options={{ headerShown: true, tabBarIcon: ({ focused }) => <TabIcon icon="⚠️" focused={focused} /> }} />
      <Tab.Screen name="Alerts" component={AlertsScreen}
        options={{ headerShown: true, tabBarIcon: ({ focused }) => <TabIcon icon="📢" focused={focused} /> }} />
      <Tab.Screen name="Evacuation" component={EvacuationScreen}
        options={{ headerShown: true, tabBarIcon: ({ focused }) => <TabIcon icon="🏕️" focused={focused} /> }} />
      <Tab.Screen name="Residents" component={ResidentsScreen}
        options={{ headerShown: true, tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} /> }} />
      <Tab.Screen name="Resources" component={ResourcesScreen}
        options={{ headerShown: true, tabBarIcon: ({ focused }) => <TabIcon icon="📦" focused={focused} /> }} />
      <Tab.Screen name="Risk" component={RiskScreen}
        options={{ headerShown: true, tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} /> }} />
      <Tab.Screen name="Reports" component={ReportsScreen}
        options={{ headerShown: false, tabBarIcon: ({ focused }) => <TabIcon icon="📈" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

function Root() {
  const { user } = useAuth();
  return (
    <NavigationContainer theme={NAV_THEME}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {user
          ? <Stack.Screen name="App"   component={Tabs} />
          : <Stack.Screen name="Login" component={LoginScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  componentDidCatch(error, info) {
    console.error('CRASH:', error.message);
    console.error('STACK:', info.componentStack);
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0c1120', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#e84855', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Crash Details:</Text>
          <Text style={{ color: '#e2e8f4', fontSize: 12, textAlign: 'center' }}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AppProvider>
            <StatusBar style="light" backgroundColor={C.bg} />
            <Root />
          </AppProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}