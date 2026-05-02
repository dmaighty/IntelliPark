import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { View, Dimensions, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from './api/auth';
import { DEV_MOCK_ACCESS_TOKEN } from './api/devAuth';
import {
  createMyVehicle,
  getMyVehicles,
  updateVehicle,
} from './api/vehicle';
import WelcomeScreen from './screens/WelcomeScreen';
import SignInScreen from './screens/SignInScreen';
import PasswordScreen from './screens/PasswordScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import PersonalInfoScreen from './screens/PersonalInfoScreen';
import ChatScreen from './screens/ChatScreen';
import FindScreen from './screens/FindScreen';
import AddCarScreen from './screens/AddCarScreen';
import BottomTabs from './components/BottomTabs';
import { defaultCars } from './data/defaultCars';

// for demo only
import GarageDemo from "./screens/GarageDemo";


const { height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = height * 0.105;
const DEFAULT_VEHICLE_IMAGE = require('./assets/parked-black-car.png');

const TOKEN_KEY = 'access_token';

const mapApiVehicleToCar = (v) => ({
  id: String(v.id),
  year: v.year || '',
  title: v.title || [v.make, v.model].filter(Boolean).join(' ') || 'Vehicle',
  make: [v.make, v.model].filter(Boolean).join(' '),
  licensePlate: v.license_plate || '',
  color: v.color || '',
  colorId: v.color_id || (v.color || '').toLowerCase(),
  image: DEFAULT_VEHICLE_IMAGE,
  parkedLocation: {
    latitude: v.parked_latitude ?? 37.3356,
    longitude: v.parked_longitude ?? -121.881,
  },
});

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [identifier, setIdentifier] = useState('');
  const [accessToken, setAccessToken] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [cars, setCars] = useState(defaultCars);
  const [editingCar, setEditingCar] = useState(null);
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem(TOKEN_KEY);
        if (t) {
          setAccessToken(t);
          setScreen('home');
        }
      } finally {
        setSessionReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    const loadMyVehicles = async () => {
      if (!accessToken || accessToken === DEV_MOCK_ACCESS_TOKEN) return;
      try {
        const rows = await getMyVehicles(accessToken);
        if (!Array.isArray(rows)) return;
        const mapped = rows.map(mapApiVehicleToCar);
        setCars(mapped);
      } catch (e) {
        console.log('Failed to load vehicles', e?.message || e);
      }
    };
    loadMyVehicles();
  }, [accessToken]);

  const isSignedInArea = [
    'home',
    'find',
    'chat',
    'past',
    'profile',
    'addCar',
    'editCar',
    'personalInfo',
    'garageDemo', // demo only
  ].includes(screen);

  const handleAddCarSave = async (newCar) => {
    if (!accessToken || accessToken === DEV_MOCK_ACCESS_TOKEN) {
      setCars((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          ...newCar,
        },
      ]);
      setScreen('home');
      return;
    }
    try {
      const created = await createMyVehicle(accessToken, newCar);
      setCars((prev) => [...prev, mapApiVehicleToCar(created)]);
      setScreen('home');
    } catch (e) {
      Alert.alert('Could not add vehicle', e.message || 'Unknown error');
    }
  };

  const handleEditCarPress = (car) => {
    setEditingCar(car);
    setScreen('editCar');
  };

  const handleEditCarSave = async (updatedCar) => {
    if (!accessToken || accessToken === DEV_MOCK_ACCESS_TOKEN) {
      setCars((prev) =>
        prev.map((car) => (car.id === updatedCar.id ? updatedCar : car))
      );
      setEditingCar(null);
      setScreen('home');
      return;
    }
    try {
      const row = await updateVehicle(accessToken, updatedCar.id, updatedCar);
      const mapped = mapApiVehicleToCar(row);
      setCars((prev) =>
        prev.map((car) => (car.id === updatedCar.id ? mapped : car))
      );
      setEditingCar(null);
      setScreen('home');
    } catch (e) {
      Alert.alert('Could not save vehicle', e.message || 'Unknown error');
    }
  };

  const handleRemoveCar = (carId) => {
    setCars((prev) => prev.filter((car) => car.id !== carId));
  };

  return (
    <View style={styles.appContainer}>
      {!sessionReady ? null : (
        <>
          {!isSignedInArea && screen === 'welcome' && (
            <WelcomeScreen
              onSignIn={() => setScreen('signin')}
              onRegister={() => setScreen('register')}
            />
          )}

          {!isSignedInArea && screen === 'signin' && (
            <SignInScreen
              onBack={() => setScreen('welcome')}
              onContinue={(value) => {
                setIdentifier(value);
                setScreen('password');
              }}
              onRegister={() => setScreen('register')}
              onDevBypass={
                typeof __DEV__ !== 'undefined' && __DEV__
                  ? async () => {
                      await AsyncStorage.setItem(TOKEN_KEY, DEV_MOCK_ACCESS_TOKEN);
                      setAccessToken(DEV_MOCK_ACCESS_TOKEN);
                      setScreen('home');
                    }
                  : undefined
              }
            />
          )}

          {!isSignedInArea && screen === 'password' && (
            <PasswordScreen
              identifier={identifier}
              onBack={() => setScreen('signin')}
              onSignIn={async (password) => {
                const data = await authApi.login(identifier.trim(), password);
                await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
                setAccessToken(data.access_token);
                setScreen('home');
              }}
            />
          )}

          {!isSignedInArea && screen === 'register' && (
            <RegisterScreen
              onBack={() => setScreen('welcome')}
              onSignIn={() => setScreen('signin')}
              onRegister={async (payload) => {
                try {
                  const data = await authApi.register(payload);
                  await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
                  setAccessToken(data.access_token);
                  setScreen('home');
                } catch (e) {
                  Alert.alert('Registration failed', e.message || 'Unknown error');
                }
              }}
              onDevBypass={
                typeof __DEV__ !== 'undefined' && __DEV__
                  ? async () => {
                      await AsyncStorage.setItem(TOKEN_KEY, DEV_MOCK_ACCESS_TOKEN);
                      setAccessToken(DEV_MOCK_ACCESS_TOKEN);
                      setScreen('home');
                    }
                  : undefined
              }
            />
          )}

          {isSignedInArea && (
            <>
              {screen === 'home' && (
                <HomeScreen
                  cars={cars}
                  onProfilePress={() => setScreen('profile')}
                  onFindPress={() => setScreen('find')}
                  onChatPress={() => setScreen('chat')}
                  onAddCarPress={() => setScreen('addCar')}
                  onEditCarPress={handleEditCarPress}
                  onRemoveCarPress={handleRemoveCar}
                  tabBarHeight={TAB_BAR_HEIGHT}
                />
              )}

              {screen === 'addCar' && (
                <AddCarScreen
                  onBack={() => setScreen('home')}
                  onSave={handleAddCarSave}
                />
              )}

              {screen === 'editCar' && (
                <AddCarScreen
                  initialCar={editingCar}
                  onBack={() => {
                    setEditingCar(null);
                    setScreen('home');
                  }}
                  onSave={handleEditCarSave}
                />
              )}

              {screen === 'profile' && (
                <ProfileScreen
                  accessToken={accessToken}
                  refreshTrigger={profileRefreshTrigger}
                  onPersonalInfo={() => setScreen('personalInfo')}
                  onGarageDemo={() => setScreen('garageDemo')} // demo only
                  onBack={() => setScreen('home')}
                  onSignOut={async () => {
                    await AsyncStorage.removeItem(TOKEN_KEY);
                    setAccessToken(null);
                    setScreen('welcome');
                  }}
                />
              )}

              {screen === 'personalInfo' && (
                <PersonalInfoScreen
                  accessToken={accessToken}
                  onBack={() => setScreen('profile')}
                  onSaved={() => {
                    setProfileRefreshTrigger((n) => n + 1);
                    setScreen('profile');
                  }}
                />
              )}

              {screen === 'chat' && (
                <ChatScreen onClose={() => setScreen('home')} />
              )}

              {screen === 'find' && (
                <FindScreen tabBarHeight={TAB_BAR_HEIGHT} />
              )}

              {screen === 'past' && (
                <HomeScreen
                  cars={cars}
                  onProfilePress={() => setScreen('profile')}
                  onFindPress={() => setScreen('find')}
                  onChatPress={() => setScreen('chat')}
                  onAddCarPress={() => setScreen('addCar')}
                  onEditCarPress={handleEditCarPress}
                  onRemoveCarPress={handleRemoveCar}
                  tabBarHeight={TAB_BAR_HEIGHT}
                />
              )}

              {screen !== 'chat' &&
                screen !== 'addCar' &&
                screen !== 'editCar' &&
                screen !== 'personalInfo' && (
                <BottomTabs
                  activeScreen={screen}
                  onFindPress={() => setScreen('find')}
                  onChatPress={() => setScreen('chat')}
                  onHomePress={() => setScreen('home')}
                  onPastPress={() => setScreen('past')}
                  onProfilePress={() => setScreen('profile')}
                />
              )}

              {screen === 'garageDemo' && (
                <GarageDemo onBack={() => setScreen('profile')}  // demo only
                />
              )}              

            </>
          )}
        </>
      )}

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
});