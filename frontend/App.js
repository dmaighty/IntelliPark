import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useMemo } from 'react';
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
import MyVehiclesScreen from './screens/MyVehiclesScreen';
import HistoryScreen from './screens/HistoryScreen';
import SavedPlacesScreen from './screens/SavedPlacesScreen';
import SavedGaragesScreen from './screens/SavedGaragesScreen';
import NotificationSettingsScreen from './screens/NotificationSettingsScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';
import SecuritySettingsScreen from './screens/SecuritySettingsScreen';
import BottomTabs from './components/BottomTabs';
import { defaultCars } from './data/defaultCars';
import { hydrateCar, hydrateCars, isValidLicensePlate, normalizeLicensePlate } from './utils/carUtils';
import { mergeHistoryWithActiveSession } from './utils/parkingHistoryUtils';
import useVehicleTracking from './hooks/useVehicleTracking';
import { getMyProfile } from './api/users';
import {
  applyStoredTrackingState,
  loadCarTrackingStates,
} from './services/trackingStorage';
import './tasks/vehicleLocationTask';

// for demo only
import GarageDemo from './screens/GarageDemo';

const { height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = height * 0.105;
const TOKEN_KEY = 'access_token';

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [identifier, setIdentifier] = useState('');
  const [accessToken, setAccessToken] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [cars, setCars] = useState(defaultCars);
  const [editingCar, setEditingCar] = useState(null);
  const [vehicleFormReturnScreen, setVehicleFormReturnScreen] = useState('home');
  const [savedPlacesReturnScreen, setSavedPlacesReturnScreen] =
    useState('profile');
  const [savedPlacesRefreshTrigger, setSavedPlacesRefreshTrigger] = useState(0);
  const [savedGaragesRefreshTrigger, setSavedGaragesRefreshTrigger] = useState(0);
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [history, setHistory] = useState([]);
  const [chatDraft, setChatDraft] = useState({ message: '', images: [] });
  const [chatSendOnOpen, setChatSendOnOpen] = useState(false);
  const [chatFocusKeyboard, setChatFocusKeyboard] = useState(false);

  const openChat = ({ send = false, focusKeyboard = false } = {}) => {
    if (send) {
      setChatSendOnOpen(true);
    }
    setChatFocusKeyboard(focusKeyboard);
    setScreen('chat');
  };

  const signedInScreens = [
    'home',
    'find',
    'chat',
    'past',
    'profile',
    'myVehicles',
    'addCar',
    'editCar',
    'personalInfo',
    'savedPlaces',
    'savedGarages',
    'notificationSettings',
    'helpSupport',
    'securitySettings',
    'garageDemo',
  ];

  const isSignedInArea = signedInScreens.includes(screen);

  const { trackedCarId, trackCar, trackingAlert, pendingParkPhotoCarId, markParkedManually, saveParkedSpotPhoto, dismissParkPhotoPrompt } = useVehicleTracking({
    cars,
    setCars,
    setHistory,
    accessToken,
    enabled: Boolean(accessToken) && sessionReady,
  });

  const displayCars = useMemo(() => hydrateCars(cars), [cars]);

  const displayHistory = useMemo(
    () => mergeHistoryWithActiveSession(history, cars),
    [history, cars]
  );

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
    const loadProfile = async () => {
      if (!accessToken) {
        setProfileImageUrl(null);
        return;
      }

      try {
        const profile = await getMyProfile(accessToken);
        setProfileImageUrl(profile?.profile_image_url || null);
      } catch {
        // Keep the default placeholder when profile loading fails.
      }
    };

    loadProfile();
  }, [accessToken, profileRefreshTrigger]);

  useEffect(() => {
    const loadMyVehicles = async () => {
      if (!accessToken || accessToken === DEV_MOCK_ACCESS_TOKEN) return;

      try {
        const rows = await getMyVehicles(accessToken);
        if (!Array.isArray(rows)) return;

        const savedStates = await loadCarTrackingStates();
        const hydratedCars = hydrateCars(rows).map((car) =>
          applyStoredTrackingState(car, savedStates)
        );

        setCars(hydratedCars);

        hydratedCars.forEach((car) => {
          const row = rows.find(
            (item) => String(item.id) === String(car.id)
          );
          const rawPlate = normalizeLicensePlate(row?.license_plate || '');

          if (rawPlate && !isValidLicensePlate(rawPlate)) {
            updateVehicle(accessToken, car.id, car).catch(() => {});
          }
        });
      } catch (e) {
        console.log('Failed to load vehicles', e?.message || e);
      }
    };

    loadMyVehicles();
  }, [accessToken]);

  const openSavedPlaces = (returnScreen = 'profile') => {
    setSavedPlacesReturnScreen(returnScreen);
    setScreen('savedPlaces');
  };

  const leaveSavedPlaces = () => {
    setScreen(savedPlacesReturnScreen);
  };

  const leaveVehicleForm = (target = vehicleFormReturnScreen) => {
    setEditingCar(null);
    setVehicleFormReturnScreen('home');
    setScreen(target);
  };

  const handleAddCarSave = async (newCar) => {
    const hydratedCar = hydrateCar(newCar);

    if (!accessToken || accessToken === DEV_MOCK_ACCESS_TOKEN) {
      setCars((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          ...hydratedCar,
        },
      ]);
      leaveVehicleForm();
      return;
    }

    try {
      const created = await createMyVehicle(accessToken, hydratedCar);
      setCars((prev) => [...prev, hydrateCar(created)]);
      leaveVehicleForm();
    } catch (e) {
      Alert.alert('Could not add vehicle', e.message || 'Unknown error');
    }
  };

  const handleEditCarPress = (car, returnScreen = 'home') => {
    setVehicleFormReturnScreen(returnScreen);
    setEditingCar(car);
    setScreen('editCar');
  };

  const handleEditCarSave = async (updatedCar) => {
    if (!accessToken || accessToken === DEV_MOCK_ACCESS_TOKEN) {
      setCars((prev) =>
        prev.map((car) => (car.id === updatedCar.id ? updatedCar : car))
      );
      leaveVehicleForm();
      return;
    }

    try {
      const row = await updateVehicle(accessToken, updatedCar.id, updatedCar);
      setCars((prev) =>
        prev.map((car) =>
          car.id === updatedCar.id ? hydrateCar(row) : car
        )
      );

      leaveVehicleForm();
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
                  cars={displayCars}
                  trackedCarId={trackedCarId}
                  onTrackCar={trackCar}
                  trackingAlert={trackingAlert}
                  pendingParkPhotoCarId={pendingParkPhotoCarId}
                  onSaveParkedSpotPhoto={saveParkedSpotPhoto}
                  onDismissParkPhotoPrompt={dismissParkPhotoPrompt}
                  onMarkParkedManually={markParkedManually}
                  profileImageUrl={profileImageUrl}
                  onProfilePress={() => setScreen('profile')}
                  onFindPress={() => setScreen('find')}
                  onChatPress={(options) => openChat(options)}
                  chatDraft={chatDraft}
                  setChatDraft={setChatDraft}
                  onAddCarPress={() => {
                    setVehicleFormReturnScreen('home');
                    setScreen('addCar');
                  }}
                  onEditCarPress={(car) => handleEditCarPress(car, 'home')}
                  onRemoveCarPress={handleRemoveCar}
                  tabBarHeight={TAB_BAR_HEIGHT}
                />
              )}

              {screen === 'addCar' && (
                <AddCarScreen
                  onBack={() => leaveVehicleForm()}
                  onSave={handleAddCarSave}
                />
              )}

              {screen === 'editCar' && (
                <AddCarScreen
                  initialCar={editingCar}
                  onBack={() => leaveVehicleForm()}
                  onSave={handleEditCarSave}
                />
              )}

              {screen === 'profile' && (
                <ProfileScreen
                  accessToken={accessToken}
                  profileImageUrl={profileImageUrl}
                  onProfileImageChange={setProfileImageUrl}
                  refreshTrigger={profileRefreshTrigger}
                  onPersonalInfo={() => setScreen('personalInfo')}
                  onSecuritySettings={() => setScreen('securitySettings')}
                  onMyVehicles={() => setScreen('myVehicles')}
                  onSavedPlaces={() => openSavedPlaces('profile')}
                  onNotificationSettings={() => setScreen('notificationSettings')}
                  onSavedGarages={() => setScreen('savedGarages')}
                  onHelpSupport={() => setScreen('helpSupport')}
                  onGarageDemo={() => setScreen('garageDemo')}
                  onBack={() => setScreen('home')}
                  onSignOut={async () => {
                    await AsyncStorage.removeItem(TOKEN_KEY);
                    setAccessToken(null);
                    setProfileImageUrl(null);
                    setScreen('welcome');
                  }}
                />
              )}

              {screen === 'myVehicles' && (
                <MyVehiclesScreen
                  cars={displayCars}
                  onBack={() => setScreen('profile')}
                  onAddCar={() => {
                    setVehicleFormReturnScreen('myVehicles');
                    setScreen('addCar');
                  }}
                  onEditCar={(car) => handleEditCarPress(car, 'myVehicles')}
                  onRemoveCar={handleRemoveCar}
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

              {screen === 'savedPlaces' && (
                <SavedPlacesScreen
                  onBack={leaveSavedPlaces}
                  onSaved={() => {
                    setSavedPlacesRefreshTrigger((n) => n + 1);
                    leaveSavedPlaces();
                  }}
                />
              )}

              {screen === 'savedGarages' && (
                <SavedGaragesScreen
                  onBack={() => setScreen('profile')}
                  onChanged={() => setSavedGaragesRefreshTrigger((n) => n + 1)}
                />
              )}

              {screen === 'notificationSettings' && (
                <NotificationSettingsScreen
                  onBack={() => setScreen('profile')}
                />
              )}

              {screen === 'helpSupport' && (
                <HelpSupportScreen onBack={() => setScreen('profile')} />
              )}

              {screen === 'securitySettings' && (
                <SecuritySettingsScreen
                  accessToken={accessToken}
                  onBack={() => setScreen('profile')}
                />
              )}

              {screen === 'chat' && (
                <ChatScreen
                  onClose={() => setScreen('home')}
                  initialDraft={chatDraft}
                  sendOnMount={chatSendOnOpen}
                  focusKeyboard={chatFocusKeyboard}
                  onDraftChange={setChatDraft}
                  onDraftConsumed={() => {
                    setChatSendOnOpen(false);
                    setChatFocusKeyboard(false);
                  }}
                />
              )}

              {screen === 'find' && (
                <FindScreen
                  tabBarHeight={TAB_BAR_HEIGHT}
                  cars={displayCars}
                  trackedCarId={trackedCarId}
                  savedPlacesRefreshTrigger={savedPlacesRefreshTrigger}
                  savedGaragesRefreshTrigger={savedGaragesRefreshTrigger}
                  onAddSavedPlaces={() => openSavedPlaces('find')}
                />
              )}

              {screen === 'past' && (
                <HistoryScreen
                  history={displayHistory}
                  cars={displayCars}
                  tabBarHeight={TAB_BAR_HEIGHT}
                />
              )}

              {screen === 'garageDemo' && (
                <GarageDemo onBack={() => setScreen('profile')} />
              )}

              {screen !== 'chat' &&
                screen !== 'addCar' &&
                screen !== 'editCar' &&
                screen !== 'personalInfo' &&
                screen !== 'savedPlaces' &&
                screen !== 'savedGarages' &&
                screen !== 'notificationSettings' &&
                screen !== 'helpSupport' &&
                screen !== 'securitySettings' &&
                screen !== 'myVehicles' &&
                screen !== 'garageDemo' && (
                  <BottomTabs
                    activeScreen={screen}
                    onFindPress={() => setScreen('find')}
                    onChatPress={() => openChat()}
                    onHomePress={() => setScreen('home')}
                    onPastPress={() => setScreen('past')}
                    onProfilePress={() => setScreen('profile')}
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