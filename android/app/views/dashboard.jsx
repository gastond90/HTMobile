
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity, 
  Alert,
  TextInput,
  Button as RNButton,
  Modal, 
  PermissionsAndroid
} from 'react-native';

import Geolocation from '@react-native-community/geolocation';
import TouchID from 'react-native-touch-id';
import DeviceInfo from 'react-native-device-info';
import useAuth from '../hooks/useAuth';

export default function MarcadasBiometria ()  {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [barrio, setBarrio] = useState("");
  const [fecha, setFecha] = useState("");
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isIngreso, setIsIngreso] = useState(true);
  const [observacion, setObservacion] = useState("");
  const [registeredDeviceId, setRegisteredDeviceId] = useState(null);
  const { auth } = useAuth();

  useEffect(() => { setUserData(auth);}, [auth]);


  
  
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

  const key="3fb6aacd6bb44f059be39ffacedd90fd"
  const apiUrl = `https://api.opencagedata.com/geocode/v1/json?key=${key}&q=${data.Latitud}+${data.Longitud}&pretty=1`;

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

  /* const reverseGeocode = async (lat, lon) => {
    try {
      const response = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (response.length > 0) {
        setBarrio(response[0].district || response[0].street || "Ubicación desconocida");
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
    }
  };
 */

  const reverseGeocode = async (lat, lon) => {
    const apiUrl = `https://api.opencagedata.com/geocode/v1/json?key=${key}&q=${lat}+${lon}&pretty=1`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const barrioName = data.results[0].components.district || data.results[0].components.street || "Ubicación desconocida";
        setBarrio(barrioName);
      } else {
        console.log('No se encontró la ubicación');
        setBarrio("Ubicación desconocida");
      }
    } catch (error) {
      console.error("Error al obtener datos de la ubicación:", error);
      setBarrio("Error al obtener la ubicación");
    }
  };

  useEffect(() => {
    if (data.Latitud && data.Longitud) {
      reverseGeocode(data.Latitud, data.Longitud);
    }
  }, [data.Latitud, data.Longitud])

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
          // Aquí necesitarás implementar reverseGeocode de otra manera
          // Ya que expo-location no está disponible
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const checkBiometricSupport = async () => {
    console.log("hola")
    try {
      TouchID.isSupported()
        .then(biometryType => {
          setBiometricSupported(true);
          console.log('Biometric',biometryType);
        })
        .catch(error => {
          setBiometricSupported(false);
          console.log('Biometric not supported', error);
        });
    } catch (error) {
      console.error('Error checking biometric support:', error);
    }
  };

  useEffect(() => {
    getLocation();
    checkBiometricSupport();
  }, []);

  const registerBiometric = async () => {
    try {
      const result = await TouchID.authenticate('Registre su huella/rostro para marcaciones');
      
      if (result) {
        const deviceId = await DeviceInfo.getUniqueId();
        setRegisteredDeviceId(deviceId);
        setIsRegistered(true);
        Alert.alert('Éxito', 'Registro biométrico completado');
      }
    } catch (error) {
      console.error('Error en registro biométrico:', error);
      Alert.alert('Error', error.message || 'Error en el registro');
    }
  };

  const verifyBiometric = async () => {
    try {
      const result = await TouchID.authenticate('Verifique su identidad');
      
      if (result) {
        setBiometricVerified(true);
        Alert.alert('Éxito', 'Verificación biométrica exitosa');
      }
    } catch (error) {
      console.error('Error en verificación biométrica:', error);
      Alert.alert('Error', 'Error en la verificación biométrica');
    }
  };

  useEffect(() => {
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
  
  const submit = async () => {
    /* if (!biometricVerified) {
      Alert.alert('Error', 'Se requiere verificación biométrica');
      return;
    } */
    
    setLoading(true);
    try {
      const finalData = {
        ...data,
        Ingreso: isIngreso,
        /* DeviceID: await getDeviceId() */
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
      }
      
      setPopupVisible(true); */
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Error al registrar marcación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={isPopupVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Marcación Registrada</Text>
            <RNButton 
              title="Aceptar"
              onPress={() => setPopupVisible(false)}
            />
          </View>
        </View>
      </Modal>
      
      <View style={styles.header}>
        <Text style={styles.headerText}>Marcación</Text>
      </View>
      
      <View style={styles.card}>
        {/* <Image 
          source={require('../../images/logo-hidrotec-perf256.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
         */}
    
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
          <Text style={styles.label}>Ubicación</Text>
          <Text style={styles.value}>{/* data.Latitud.toFixed(2) + " , " + data.Longitud.toFixed(2) */barrio
          }</Text>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Fecha</Text>
          <Text style={styles.value}>{fecha}</Text>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Dispositivo</Text>
          <Text style={styles.value}>{data.DeviceID}</Text>
        {  <Text style={styles.value}>{data.Dispositivo}</Text>}
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
            /* disabled={loading || !biometricVerified} */
            color="#4CAF50"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logo: {
    width: '75%',
    height: 100,
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
});
