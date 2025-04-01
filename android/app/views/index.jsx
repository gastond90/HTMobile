

import { useCallback, useState, useEffect } from 'react';
import { View, Alert, StyleSheet, TextInput, Image } from 'react-native';
import { Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TouchID from 'react-native-touch-id';
import useAuth from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const { setearAuth } = useAuth();
  const navigation = useNavigation();
  const [firstLoginDone, setFirstLoginDone] = useState(false); 

  // Opciones para TouchID
  const touchIDConfig = {
    title: 'Autenticación biométrica', // Android
    color: '#0286c9', // Android
    fallbackLabel: 'Mostrar contraseña', // iOS (si es compatible)
  };

  // Verificar si TouchID/FaceID está disponible
  const checkBiometricAvailability = async () => {
    try {
      const biometryType = await TouchID.isSupported(touchIDConfig);
      return true;
    } catch (error) {
      console.log('TouchID no disponible:', error);
      return false;
    }
  };

  // Verificar si hay credenciales guardadas
  useEffect(() => {
    const checkSavedCredentials = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('username');
        if (savedUsername) {
          setUsername(savedUsername);
          setHasSavedCredentials(true);
          // Si hay credenciales guardadas, mostramos la opción de autenticación biométrica pero no la activamos automáticamente
        }
      } catch (error) {
        console.error('Error al verificar credenciales guardadas:', error);
      }
    };
    
    checkSavedCredentials();
  }, []);

  // Función para guardar credenciales
  const saveCredentials = async (user, pwd) => {
    try {
      await AsyncStorage.setItem('username', user);
      await AsyncStorage.setItem('password', pwd);
      console.log('Credenciales guardadas exitosamente');
      return true;
    } catch (error) {
      console.error('Error al guardar credenciales:', error);
      Alert.alert('Error', 'No se pudieron guardar las credenciales');
      return false;
    }
  };

  // Función para obtener credenciales guardadas
  const getSavedCredentials = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('username');
      const savedPassword = await AsyncStorage.getItem('password');
      return { user: savedUsername, pwd: savedPassword };
    } catch (error) {
      console.error('Error al obtener credenciales guardadas:', error);
      return null;
    }
  };

  // Función para autenticación biométrica
  const promptBiometricAuth = async () => {
    try {
      // Verificar si el dispositivo soporta biometría
      const isBiometricAvailable = await checkBiometricAvailability();
      
      if (!isBiometricAvailable) {
        Alert.alert('Error', 'Tu dispositivo no soporta autenticación biométrica');
        return;
      }

      // Solicitar autenticación biométrica
      await TouchID.authenticate('Confirma tu identidad para iniciar sesión', touchIDConfig);

      // Si la autenticación biométrica tuvo éxito, obtén credenciales guardadas
      const credentials = await getSavedCredentials();
      if (credentials && credentials.user && credentials.pwd) {
        // Iniciar sesión con las credenciales guardadas
        loginWithCredentials(credentials.user, credentials.pwd);
      } else {
        Alert.alert('Error', 'No se encontraron credenciales guardadas');
      }
    } catch (error) {
      console.error('Error en autenticación biométrica:', error);
      // No mostramos alerta aquí porque TouchID ya muestra sus propios mensajes de error
    }
  };

  // Función para iniciar sesión con credenciales
  /* const loginWithCredentials = async (user, pwd) => {
    setLoading(true);

    try {
      const response = await fetch(`https://gestion1.hidrotecperf.com.ar/HT_WebAPI/api/login/authenticate_U`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: user.toLowerCase(),
          pwd: pwd
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
      const { accessToken, userID, user: loggedUser, nombre: nombreU, NroLegajo } = data;

      setearAuth({
        user: loggedUser,
        userID,
        accessToken,
        nombreU,
        NroLegajo,
      });

      navigation.replace('Marcación');

    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Error en el login';
      
      if (err.status === 401) {
        errorMessage = 'Usuario o contraseña incorrectos';
      } else if (err.status === 500) {
        errorMessage = 'Error del servidor';
      } else if (err.message?.includes('Network request failed')) {
        errorMessage = 'Problema de conexión. Verifica tu internet';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el inicio de sesión
  const handleLogin = useCallback(async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }



    if  (hasSavedCredentials) await loginWithCredentials(username, password);
    
    // Si el login fue exitoso (no salimos de la función por un error), pregunta si desea guardar las credenciales
    if (!hasSavedCredentials) {
      const isBiometricAvailable = await checkBiometricAvailability();
      
      if (isBiometricAvailable) {
        Alert.alert(
          'Guardar credenciales',
          '¿Deseas guardar tus credenciales para usar autenticación biométrica en el futuro?',
          [
            {
              text: 'No',
              style: 'cancel'
            },
            {
              text: 'Sí',
              onPress: async () => {
                const saved = await saveCredentials(username, password);
                if (saved) {
                  setHasSavedCredentials(true);
                  Alert.alert('Éxito', 'Credenciales guardadas. Ahora puedes usar la autenticación biométrica.');
                }
              }
            }
          ]
        );
      }
    }
  }, [username, password, hasSavedCredentials]);
   */
  

/*   const loginWithCredentials = async (user, pwd) => {
    setLoading(true);

    try {
      const response = await fetch(`https://gestion1.hidrotecperf.com.ar/HT_WebAPI/api/login/authenticate_U`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: user.toLowerCase(), pwd })
      });

      if (!response.ok) {
        let errorData = {};
        try { errorData = await response.json(); } catch (error) { console.error('Error parsing JSON:', error); }
        
        throw {
          status: response.status,
          message: errorData.message || 'Error en la autenticación'
        };
      }

      const data = await response.json();
      const { accessToken, userID, user: loggedUser, nombre: nombreU, NroLegajo } = data;

      setearAuth({ user: loggedUser, userID, accessToken, nombreU, NroLegajo });
      navigation.replace('Marcación');

      return true; 

    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Error en el login';

      if (err.status === 401) {
        errorMessage = 'Usuario o contraseña incorrectos';
      } else if (err.status === 500) {
        errorMessage = 'Error del servidor';
      } else if (err.message?.includes('Network request failed')) {
        errorMessage = 'Problema de conexión. Verifica tu internet';
      } else {
        errorMessage = 'Error desconocido. Intenta de nuevo más tarde.';
      }

      Alert.alert('Error', errorMessage);
      return false; // Indicar fallo
    } finally {
      setLoading(false);
    }
}; */


const loginWithCredentials = async (user, pwd) => {
  setLoading(true);

  try {
      const response = await fetch(`https://gestion1.hidrotecperf.com.ar/HT_WebAPI/api/login/authenticate_U`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              user: user.toLowerCase(),
              pwd: pwd
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
      const { accessToken, userID, user: loggedUser, nombre: nombreU, NroLegajo } = data;

      setearAuth({
          user: loggedUser,
          userID,
          accessToken,
          nombreU,
          NroLegajo,
      });

      // Si aún no ha guardado credenciales, preguntar antes de navegar
      if (!hasSavedCredentials) {
          const isBiometricAvailable = await checkBiometricAvailability();
          if (isBiometricAvailable) {
              Alert.alert(
                  'Guardar credenciales',
                  '¿Deseas guardar tus credenciales para usar autenticación biométrica en el futuro?',
                  [
                      { text: 'No', style: 'cancel', onPress: () => navigation.replace('Marcación') },
                      {
                          text: 'Sí',
                          onPress: async () => {
                              const saved = await saveCredentials(user, pwd);
                              if (saved) {
                                  setHasSavedCredentials(true);
                                  Alert.alert('Éxito', 'Credenciales guardadas. Ahora puedes usar la autenticación biométrica.', [
                                      { text: 'OK', onPress: () => navigation.replace('Marcación') }
                                  ]);
                              } else {
                                  navigation.replace('Marcación');
                              }
                          }
                      }
                  ]
              );
              return; // Evitar que se ejecute `navigation.replace('Marcación')` dos veces
          }
      }

      navigation.replace('Marcación');

  } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Error en el login';

      if (err.status === 401) {
          errorMessage = 'Usuario o contraseña incorrectos';
      } else if (err.status === 500) {
          errorMessage = 'Error del servidor';
      } else if (err.message?.includes('Network request failed')) {
          errorMessage = 'Problema de conexión. Verifica tu internet';
      }

      Alert.alert('Error', errorMessage);
  } finally {
      setLoading(false);
  }
};


/* const handleLogin = useCallback(async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    const success = await loginWithCredentials(username, password);
    
    if (success && !hasSavedCredentials) {
      const isBiometricAvailable = await checkBiometricAvailability();
      
      if (isBiometricAvailable) {
        Alert.alert(
          'Guardar credenciales',
          '¿Deseas guardar tus credenciales para usar autenticación biométrica en el futuro?',
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Sí',
              onPress: async () => {
                const saved = await saveCredentials(username, password);
                if (saved) {
                  setHasSavedCredentials(true);
                  Alert.alert('Éxito', 'Credenciales guardadas. Ahora puedes usar la autenticación biométrica.');
                }
              }
            }
          ]
        );
      }
    }
}, [username, password, hasSavedCredentials]); */


const handleLogin = useCallback(async () => {
  if (!username || !password) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
  }

  const success = await loginWithCredentials(username, password);
  
  if (success) {
      setFirstLoginDone(true); // Marcar que el usuario ya hizo su primer login
  }
}, [username, password]);



useEffect(() => {
  if (firstLoginDone && !hasSavedCredentials) {
      checkBiometricAvailability().then((isBiometricAvailable) => {
          if (isBiometricAvailable) {
              Alert.alert(
                  'Guardar credenciales',
                  '¿Deseas guardar tus credenciales para usar autenticación biométrica en el futuro?',
                  [
                      { text: 'No', style: 'cancel' },
                      {
                          text: 'Sí',
                          onPress: async () => {
                              const saved = await saveCredentials(username, password);
                              if (saved) {
                                  setHasSavedCredentials(true);
                                  Alert.alert('Éxito', 'Credenciales guardadas. Ahora puedes usar la autenticación biométrica.');
                              }
                          }
                      }
                  ]
              );
          }
      });
  }
}, [firstLoginDone, hasSavedCredentials]);

  // Función para borrar credenciales guardadas
  const clearSavedCredentials = async () => {
    try {
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('password');
      setHasSavedCredentials(false);
      setUsername('');
      setPassword('');
      Alert.alert('Información', 'Se han eliminado las credenciales guardadas');
    } catch (error) {
      console.error('Error al eliminar credenciales:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../images/logo-hidrotec-perf256.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />
      
      {hasSavedCredentials ? (
        <View style={styles.biometricContainer}>
          <TextInput
            style={styles.input}
            placeholder="Usuario"
            value={username}
            editable={false}
          />
          <Button 
            title="Iniciar sesión con huella" 
            onPress={promptBiometricAuth} 
            color="#0286c9"
            disabled={loading}
          />
          <View style={styles.buttonSpacer} />
         {/*  <Button 
            title="Usar otra cuenta" 
            onPress={() => setHasSavedCredentials(false)} 
            color="#888888"
          />
          <View style={styles.buttonSpacer} />
          <Button 
            title="Eliminar datos guardados" 
            onPress={clearSavedCredentials} 
            color="#d9534f"
          /> */}
        </View>
      ) : (
        <View style={styles.formContainer}>
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
            color="#0286c9"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
 /*  logo: {
    width: 200,
    height: 100,
    marginBottom: 30,
  }, */
  logo: {
    width: '60%',
    /* height: 100, */
    alignSelf: 'center',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  biometricContainer: {
    width: '100%',
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
  },
  buttonSpacer: {
    height: 10,
  },
});