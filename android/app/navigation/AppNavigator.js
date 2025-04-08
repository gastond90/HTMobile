/* import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MarcadasBiometria from '../views/dashboard';
import Login from '../views';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen 
        name="Home" 
        component={Login} 
        options={{ title: 'Inicio' }}
      />
      <Stack.Screen 
        name="Dashboard" 
        component={MarcadasBiometria} 
        options={{ title: 'Perfil' }}
      />
    
    </Stack.Navigator>
  );
}

export default AppNavigator; */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MarcadasBiometria from '../views/dashboard';
import Login from '../views';
import { AuthProvider } from '../hooks/AuthContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider> 
 {/*      <NavigationContainer> */}
        <Stack.Navigator>
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }}/>
          <Stack.Screen name="Marcación" component={MarcadasBiometria} options={{ headerShown: false }} />
        </Stack.Navigator>
      {/* </NavigationContainer> */}
    </AuthProvider>
  );
}
