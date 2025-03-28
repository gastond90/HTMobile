import { useCallback, useState } from 'react';
import {View, Alert, StyleSheet, TextInput } from 'react-native';
import { Button } from 'react-native';
import useAuth from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native'

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setearAuth } = useAuth();
  const navigation = useNavigation(); 

  const handleLogin = useCallback(async () => {
    setLoading(true);
  
    try {
      if (!username || !password) {
        Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
        return;
      }
  
      const response = await fetch(`https://gestion1.hidrotecperf.com.ar/HT_WebAPI/api/login/authenticate_U`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: username.toLowerCase(),
          pwd: password
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.message || 'Error en la autenticación'
        };
      }
  
      const data = await response.json();
      const { accessToken, userID, user, nombre: nombreU, NroLegajo } = data;
  
    
      setearAuth({ 
        user, 
        userID, 
        accessToken, 
        nombreU, 
        NroLegajo, 
      }); 
  
      navigation.replace('Dashboard');
      
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Error en el login';
      
      if (err.status === 401) {
        errorMessage = 'Usuario o contraseña incorrectos';
      } else if (err.status === 500) {
        errorMessage = 'Error del servidor';
      } else if (err.message.includes('Network request failed')) {
        errorMessage = 'Problema de conexión. Verifica tu internet';
      }
  
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [username, password,]);


  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Usuario"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      <Button 
        title={loading ? "Cargando..." : "Iniciar Sesión"} 
        onPress={handleLogin} 
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});


 