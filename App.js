import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ActivityLogScreen from './src/screens/ActivityLogScreen';
import AlertsScreen      from './src/screens/AlertsScreen';
import DashboardScreen   from './src/screens/DashboardScreen';
import EvacuationScreen  from './src/screens/EvacuationScreen';
import IncidentsScreen   from './src/screens/IncidentsScreen';
import LoginScreen       from './src/screens/LoginScreen';
import MapScreen         from './src/screens/MapScreen';
import ReportsScreen     from './src/screens/ReportsScreen';
import ResidentsScreen   from './src/screens/ResidentsScreen';
import ResourcesScreen   from './src/screens/ResourcesScreen';
import RiskScreen        from './src/screens/RiskScreen';
import UsersScreen       from './src/screens/UsersScreen';

import { AppProvider }           from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { C }                     from './src/styles/colors';

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

function AppScreens() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Dashboard"   component={DashboardScreen}   />
      <Stack.Screen name="Alerts"      component={AlertsScreen}      />
      <Stack.Screen name="Evacuation"  component={EvacuationScreen}  />
      <Stack.Screen name="Residents"   component={ResidentsScreen}   />
      <Stack.Screen name="Resources"   component={ResourcesScreen}   />
      <Stack.Screen name="Incidents"   component={IncidentsScreen}   />
      <Stack.Screen name="Risk"        component={RiskScreen}        />
      <Stack.Screen name="Reports"     component={ReportsScreen}     />
      <Stack.Screen name="Map"         component={MapScreen}         />
      <Stack.Screen name="Users"       component={UsersScreen}       />
      <Stack.Screen name="ActivityLog" component={ActivityLogScreen} />
    </Stack.Navigator>
  );
}

function Root() {
  const { user } = useAuth();
  return (
    <NavigationContainer theme={NAV_THEME}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {user ? (
          <Stack.Screen name="App" component={AppScreens} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  componentDidCatch(e) { console.error('CRASH:', e.message); }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return null;
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
