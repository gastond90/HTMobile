

import { useCallback, useState, useEffect } from 'react';
import { View, Alert, StyleSheet, TextInput, Image, Modal, Text, TouchableOpacity, Button,ImageBackground  } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TouchID from 'react-native-touch-id';
import useAuth from '../hooks/useAuth';

export default function Login() {
  const { setearAuth } = useAuth();
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [firstLoginDone, setFirstLoginDone] = useState(false); 
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [recibirPassword, setRecibirPassword] = useState(null);
  const [usuario, setUsuario] = useState({nombre:"",email:"",phone:"", });
 
  const togglePopup = () => { setPopupVisible(prevState => !prevState);};

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

  const saveCredentials = async (user, pwd) => {
    try {
      await AsyncStorage.setItem('username', user);
      await AsyncStorage.setItem('password', pwd);
      return true;
    } catch (error) {
      console.error('Error al guardar credenciales:', error);
      Alert.alert('Error', 'No se pudieron guardar las credenciales');
      return false;
    }
  };
  
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

  const promptBiometricAuth = async () => {
    try {
      const isBiometricAvailable = await checkBiometricAvailability();
      
      if (!isBiometricAvailable) {
        Alert.alert('Error', 'Tu dispositivo no soporta autenticación biométrica');
        return;
      }
      await TouchID.authenticate('Confirma tu identidad para iniciar sesión', touchIDConfig);

      const credentials = await getSavedCredentials();
      if (credentials && credentials.user && credentials.pwd) {
        loginWithCredentials(credentials.user, credentials.pwd);
      } else {
        Alert.alert('Error', 'No se encontraron credenciales guardadas');
      }
    } catch (error) {
      console.error('Error en autenticación biométrica:', error);
    }
  };
  
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
        const { accessToken, userID, user: loggedUser, nombre: nombreU, NroLegajo,RecibosSinFirmar } = data;

        setearAuth({
            user: loggedUser,
            userID,
            accessToken,
            nombreU,
            NroLegajo,
            RecibosSinFirmar: Number(RecibosSinFirmar)
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

  // Recuperación de contraseña
  const handleUsuario = (texto) => { setUsuario(prev => ({ ...prev, nombre: texto }))}

  const getEmail = async (usuario) => {
    const url = `https://gestion1.hidrotecperf.com.ar/HT_WebAPI/api/login/GetEmail?usuario=${encodeURIComponent(usuario)}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',  // Cambié a GET
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error en getEmail:', error);
        throw error; // Lanza el error para manejarlo donde se llame
    }
  };

  const getTelefono = async (usuario) => {
    const url = `https://gestion1.hidrotecperf.com.ar/HT_WebAPI/api/login/GetPhone?usuario=${encodeURIComponent(usuario)}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({})
    });

    if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    return await response.json();
  };

  async function recoveryPass() {
      setLoading(true);
      console.log("acá")
      const dataObject = { 
          username: usuario.nombre.toLowerCase(), 
          phone: usuario.phone, 
          email: usuario.email 
      };

      const headers = { 'Content-Type': 'application/json' };
      try {
          const response = await fetch(`${API}/SendRecoveryPass`, {
              method: 'POST',
              headers,
              body: JSON.stringify(dataObject)
          });

          console.log("response",response)

          if (!response.ok) { throw new Error(`Error en la solicitud: ${response.statusText}`);}

        /*  const responseData = await response.text(); */

          if (response.ok) {
              Alert.alert(
                  "Success", 
                  `Se envió la nueva clave a ${
                      usuario.phone !== "" 
                          ? partiallyHideString(usuario.phone) 
                          : partiallyHideString(usuario.email)
                  }.`
              );
          }

      } catch (error) {
          console.error('Error:', error);
      } finally {
          setLoading(false);
          togglePopup();
      }
  }

  useEffect(() => {
    if (usuario.nombre !== "") {
      if (recibirPassword === "mail") {
        getEmail(usuario.nombre)
          .then(response => setUsuario(prev => ({
            ...prev, email: response, phone:""})))
          .catch(error => console.error(error));
      } else if (recibirPassword === "telefono") {
        getTelefono(usuario.nombre)
          .then(response => setUsuario(prev => ({
            ...prev, phone: response, email:""})))
          .catch(error => console.error(error));
      }
    }
  }, [usuario.nombre, recibirPassword]);
  
  useEffect(() => {
    if ((usuario.email !== "" && recibirPassword === "mail") || (usuario.phone !== "" && recibirPassword === "telefono")) {
      recoveryPass();
      setRecibirPassword("");
    }
  }, [usuario.email, usuario.phone, recibirPassword]);

  return (
  <ImageBackground 
    source={{ uri: 'https://hidrotecperf.com.ar/wallpaper1.png' }} 
    style={styles.background}
    resizeMode="cover"
  >
    <View style={styles.container}>
      <Modal visible={isPopupVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
          <View style={styles.closeButtonContainer}>
            <TouchableOpacity onPress={togglePopup} style={styles.closeButton}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
            <Text style={styles.title}>Indique donde quiere recibir su nueva contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de usuario"
              value={usuario.nombre}
              onChangeText={handleUsuario}
            />
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.optionButton} onPress={() => setRecibirPassword('mail')}>
                <Text style={styles.optionButtonText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionButton} onPress={() => setRecibirPassword('telefono')}>
                <Text style={styles.optionButtonText}>Teléfono</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Image 
        source={require('../images/logo-hidrotec-perf256.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />
      
      {hasSavedCredentials ? (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Usuario"
            value={username}
            editable={false}
          />
          <TouchableOpacity
            style={styles.buttonStyle}
            onPress={promptBiometricAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Iniciar sesión con huella</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonStyle}
            onPress={() => setHasSavedCredentials(false)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Iniciar sesión con clave</Text>
          </TouchableOpacity>
        </View>
       /*<View style={styles.biometricContainer}>
          <Button 
            title="Usar otra cuenta" 
            onPress={() => setHasSavedCredentials(false)} 
            color="#888888"
          />
          <Button 
            title="Eliminar datos guardados" 
            onPress={clearSavedCredentials} 
            color="#d9534f"
          />
        </View> */
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

      <TouchableOpacity onPress={togglePopup}>
        <Text style={styles.underlinedText}>¿Olvidaste tu clave?</Text>
      </TouchableOpacity>
    </View>
  </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  background: {
    flex: 1,
  },
  logo: {
    width: '60%',
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
  underlinedText: {
    textDecorationLine: 'underline',
    color: 'white',
    marginTop: 20,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#007bff',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  optionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
   /*  paddingRight: 10, */
  },
  closeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonStyle : {
  backgroundColor: '#0286c9',
  padding: 12,
  paddingVertical: 8,
  borderRadius: 6,
  alignItems: 'center',
  marginBottom: 10,
  /* width: '20px', */
  },
  
   buttonText: {
    color: 'white',
    fontWeight: 'bold',
   fontSize: 12,
  }
});

function partiallyHideString(inputString) {
  if (inputString.includes('@')) {
    // Handle email addresses
    const parts = inputString.split('@');
    const username = parts[0];
    const domain = parts[1];
    
    const hiddenUsername = username.charAt(0) + '*'.repeat(username.length - 1);
    
    return hiddenUsername + '@' + domain;
  } else {
    // Handle phone numbers
    const visibleLength = 3;
    const hiddenPart = '*'.repeat(inputString.length - visibleLength) + inputString.slice(-visibleLength);
    
    return hiddenPart;
  }
}
 const API = 'https://gestion1.hidrotecperf.com.ar/HT_WebAPI/api/login'
 
 const touchIDConfig = {
  title: 'Autenticación biométrica',
  color: '#0286c9',
  fallbackLabel: 'Mostrar contraseña', // iOS (si es compatible)
};