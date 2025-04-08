import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity, 
  Alert,
  Image,
  TextInput,
  Button as RNButton,
  Modal, 
  PermissionsAndroid,
  Platform,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import TouchID from 'react-native-touch-id';
import DeviceInfo from 'react-native-device-info';
import useAuth from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native'

// Constants for AsyncStorage keys
const BIOMETRIC_REGISTERED_KEY = 'biometric_registered';
const REGISTERED_DEVICE_ID_KEY = 'registered_device_id';

export default function MarcadasBiometria() {
  const navigation = useNavigation();
  const { auth } = useAuth();
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [fecha, setFecha] = useState("");
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isIngreso, setIsIngreso] = useState(true);
  const [observacion, setObservacion] = useState("");
  const [registeredDeviceId, setRegisteredDeviceId] = useState(null);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [GPS, setGPS] = useState();
  const [recibosSinfirmar, setrecibosSinfirmar] = useState(false)

  const [data, setData] = useState({
    Legajo: 0,
    Latitud: 0,
    Longitud: 0,
    Precision: 0,
    Ingreso: true,
    Dispositivo: "",
    Observacion: "",
    DeviceID: "",
  });
     
  // Load saved biometric registration status
  const loadBiometricRegistration = async () => {
    try {
      const isRegisteredValue = await AsyncStorage.getItem(BIOMETRIC_REGISTERED_KEY);
      const savedDeviceId = await AsyncStorage.getItem(REGISTERED_DEVICE_ID_KEY);
      const currentId = await DeviceInfo.getUniqueId();
      setCurrentDeviceId(currentId);
      
      if (isRegisteredValue === 'true' && savedDeviceId === currentId) {
        setIsRegistered(true);
        setRegisteredDeviceId(savedDeviceId);
        console.log('Biometric registration loaded from storage');
      } else {
        // If device ID has changed, we need to re-register
        setIsRegistered(false);
        console.log('No biometric registration found or device changed');
      }
    } catch (error) {
      console.error('Error loading biometric registration:', error);
    }
  };

  // Save biometric registration status
  const saveBiometricRegistration = async (deviceId) => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_REGISTERED_KEY, 'true');
      await AsyncStorage.setItem(REGISTERED_DEVICE_ID_KEY, deviceId);
      console.log('Biometric registration saved to storage');
    } catch (error) {
      console.error('Error saving biometric registration:', error);
    }
  };

  useEffect(() => {
    const updateFecha = () => {
      const now = new Date();
      setFecha(now.toLocaleString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric', 
        second: 'numeric' 
      }));
    };
    
    updateFecha();
    const interval = setInterval(updateFecha, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (userData) {
      setData(prev => ({
        ...prev,
        Legajo: userData.NroLegajo || 0,
        Observacion: observacion
      }));
    }
  }, [userData, observacion]);

  const getLocation = async () => {
    try {
      // Solicitar permisos para Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permiso denegado', 'No se pudo acceder a la ubicación');
          return;
        }
        if(granted){setGPS(true);}
      }
  
      setLoading(true);
      Geolocation.getCurrentPosition(
        (position) => {
          setData(prev => ({
            ...prev,
            Latitud: position.coords.latitude,
            Longitud: position.coords.longitude,
            Precision: position.coords.accuracy
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          Alert.alert('Error', 'No se pudo obtener la ubicación');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    } finally {
      setLoading(false);
    }
  };
  
  const checkBiometricSupport = async () => {
    try {
      TouchID.isSupported()
        .then(biometryType => {
          setBiometricSupported(true);
          console.log('Biometric supported:', biometryType);
        })
        .catch(error => {
          setBiometricSupported(false);
          console.log('Biometric not supported', error);
          /* Alert.alert('Aviso', 'Este dispositivo no soporta autenticación biométrica'); */
        });
    } catch (error) {
      console.error('Error checking biometric support:', error);
      setBiometricSupported(false);
    }
  };

  useEffect(() => {
    // Initialize app
    getLocation();
    checkBiometricSupport();
    loadBiometricRegistration(); // Load saved biometric registration status
    
    // Get device info
    (async () => {
      try {
        const uniqueId = await DeviceInfo.getUniqueId();
        const type = await DeviceInfo.getDeviceType(); 
        setData(prev => ({ ...prev, DeviceID: uniqueId, Dispositivo: type }));
      } catch (error) {
        console.error("Error fetching device info:", error);
      }
    })();
  }, []);

  const registerBiometric = async () => {
    try {
      const result = await TouchID.authenticate('Registre su huella/rostro para marcaciones', {
        fallbackLabel: 'Usar contraseña',
        passcodeFallback: true,
        title: 'Autenticación biométrica',
      });
      
      if (result) {
        const deviceId = await DeviceInfo.getUniqueId();
        setRegisteredDeviceId(deviceId);
        setIsRegistered(true);
        
        // Save registration status to AsyncStorage
        await saveBiometricRegistration(deviceId);
        
        Alert.alert('Éxito', 'Registro biométrico completado y guardado en el dispositivo');
      }
    } catch (error) {
      console.error('Error en registro biométrico:', error);
      Alert.alert('Error', error.message || 'Error en el registro');
    }
  };

  const verifyBiometric = async () => {
    try {
      const result = await TouchID.authenticate('Verifique su identidad', {
        fallbackLabel: 'Usar contraseña',
        passcodeFallback: true,
        title: 'Autenticación biométrica',
      });
      
      if (result) {
        setBiometricVerified(true);
        Alert.alert('Éxito', 'Verificación biométrica exitosa');
      }
    } catch (error) {
      console.error('Error en verificación biométrica:', error);
      Alert.alert('Error', 'Error en la verificación biométrica');
    }
  };
  
  const submit = async () => {
    if (!biometricVerified && isRegistered) {
      Alert.alert('Error', 'Se requiere verificación biométrica');
      return;
    }
    if (data.Longitud===0 || data.Latitud === 0) {
      Alert.alert('Error', 'Ubicación no disponible. Por favor, intente nuevamente');
      return;
    }
    
    setLoading(true);
    try {
      const finalData = {
        ...data,
        Ingreso: isIngreso,
      };
      
      console.log('Enviando:', finalData);
      
      // Using fetch instead of axios
      /* const response = await fetch('/HT_WebAPI/api/marcacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.accessToken}`
        },
        body: JSON.stringify(finalData)
      });
      
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      } */
      
      // For demo purposes, we'll just show the success popup
      setPopupVisible(true);
     /*  Alert.alert('Success', 'Marcación registrada con éxito'); */
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Error al registrar marcación');
    } finally {
      setLoading(false);
    }
  };

  const firmar = () => {
    const targetURL = 'https://hidrotec.turecibo.com/e/login';
    Linking.openURL(targetURL).catch(err => console.error("Error al abrir la URL:", err));
  };

  useEffect(() => {
    if ( auth?.RecibosSinFirmar !== 0) { setrecibosSinfirmar(true) }
  }, [auth]);

  useEffect(() => { setUserData(auth);}, [auth]);

return (
  <View style={styles.container}>
    <Modal
      visible={isPopupVisible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>Marcación Registrada ✅</Text>
          <RNButton 
            title="Aceptar"
            onPress={()=>navigation.replace('Login')}
          />
        </View>
      </View>
    </Modal>

      <Modal visible={recibosSinfirmar} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
          <View style={styles.closeButtonContainer}>
            <TouchableOpacity onPress={()=>setrecibosSinfirmar(false)} style={styles.closeButton}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
            <Text style={styles.title}>Ud. tiene {auth?.RecibosSinFirmar} {auth?.RecibosSinFirmar === 1 ? 'recibo' : 'recibos'} sin firmar</Text>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.optionButton} onPress={()=>setrecibosSinfirmar(false)}>
                <Text style={styles.optionButtonText}>Aceptar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionButton} onPress={firmar}>
                <Text style={styles.optionButtonText}>Firmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
    </Modal>
    
    <View style={styles.card}>
    
    <View style={styles.iconContainer}>
      <Text>{GPS ? '📍' : '➖'}</Text>
    </View>
      <Image 
        source={require('../images/logo-hidrotec-perf256.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />
  
      <View style={styles.switchContainer}>
        <TouchableOpacity
          style={[styles.switchOption, isIngreso && styles.switchOptionActive]}
          onPress={() => setIsIngreso(true)}
        >
          <Text style={[styles.switchText, isIngreso && styles.switchTextActive]}>Ingreso</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.switchOption, !isIngreso && styles.switchOptionActive]}
          onPress={() => setIsIngreso(false)}
        >
          <Text style={[styles.switchText, !isIngreso && styles.switchTextActive]}>Egreso</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Usuario</Text>
        <Text style={styles.value}>{`${userData?.nombreU || ''} - Legajo N° ${userData?.NroLegajo || ''}`}</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Fecha</Text>
        <Text style={styles.value}>{fecha}</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Observación</Text>
        <TextInput
          style={styles.textInput}
          value={observacion}
          onChangeText={setObservacion}
          placeholder="Ingrese observación"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        {biometricSupported && !isRegistered && (
          <RNButton
            title="REGISTRAR HUELLA/ROSTRO"
            onPress={registerBiometric}
            disabled={loading}
            color="#007AFF"
          />
        )}
        
        {biometricSupported && isRegistered && !biometricVerified && (
          <RNButton
            title="VERIFICAR IDENTIDAD"
            onPress={verifyBiometric}
            disabled={loading}
            color="#007AFF"
          />
        )}
        
        <RNButton
          title="ENVIAR"
          onPress={submit}
          disabled={loading || (!biometricVerified)}
          color="#4CAF50"
        />

        <RNButton
          title="Volver"
          onPress={()=>navigation.replace('Login')}
          color="#0286c9"
        />
      </View>
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'darkgray',
    padding: 16,
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'center',
  },
  header: {
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logo: {
    width: '60%',
    alignSelf: 'center',
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    overflow: 'hidden',
  },
  switchOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  switchOptionActive: {
    backgroundColor: '#4CAF50',
  },
  switchText: {
    color: '#666',
  },
  switchTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  textInput: {
    fontSize: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  buttonContainer: {
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    padding: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  closeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
   /*  paddingRight: 10, */
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
  
});                 