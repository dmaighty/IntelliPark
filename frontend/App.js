import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import WelcomeScreen from './screens/WelcomeScreen';
import SignInScreen from './screens/SignInScreen';
import PasswordScreen from './screens/PasswordScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatScreen from './screens/ChatScreen';
import FindScreen from './screens/FindScreen';
import AddCarScreen from './screens/AddCarScreen';
import BottomTabs from './components/BottomTabs';

const { height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = height * 0.105;

const HARDCODED_SPOTS = [
  {
    label: 'SJSU South Garage',
    coordinates: { latitude: 37.333683, longitude: -121.880487 },
  },
  {
    label: 'SJSU West Garage',
    coordinates: { latitude: 37.33592, longitude: -121.88218 },
  },
  {
    label: 'SJSU North Garage',
    coordinates: { latitude: 37.33652, longitude: -121.88094 },
  },
  {
    label: '7th Street Spot',
    coordinates: { latitude: 37.33541, longitude: -121.87976 },
  },
  {
    label: 'San Salvador Spot',
    coordinates: { latitude: 37.33428, longitude: -121.88192 },
  },
];

const getSpotForIndex = (index) =>
  HARDCODED_SPOTS[index % HARDCODED_SPOTS.length];

const minutesAgo = (minutes) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [identifier, setIdentifier] = useState('');
  const [editingCar, setEditingCar] = useState(null);

  const [cars, setCars] = useState([
    {
      id: 1,
      year: '2024',
      title: 'My Camry',
      make: 'Toyota Camry',
      licensePlate: '8ABC123',
      color: 'Black',
      colorId: 'black',
      image: require('./assets/parked-black-car.png'),
      isParked: true,
      parkedSpotName: 'SJSU South Garage',
      parkedLocation: { latitude: 37.333683, longitude: -121.880487 },
      parkedSince: minutesAgo(42),
    },
    {
      id: 2,
      year: '2023',
      title: 'Civic',
      make: 'Honda Civic',
      licensePlate: '8XYZ456',
      color: 'White',
      colorId: 'white',
      image: require('./assets/parked-white-car.png'),
      isParked: false,
      parkedSpotName: 'SJSU West Garage',
      parkedLocation: { latitude: 37.33592, longitude: -121.88218 },
      parkedSince: null,
    },
    {
      id: 3,
      year: '2022',
      title: 'Model 3',
      make: 'Tesla Model 3',
      licensePlate: '9TES789',
      color: 'Red',
      colorId: 'red',
      image: require('./assets/parked-red-car.png'),
      isParked: true,
      parkedSpotName: 'SJSU North Garage',
      parkedLocation: { latitude: 37.33652, longitude: -121.88094 },
      parkedSince: minutesAgo(135),
    },
  ]);

  const openAddCar = () => {
    setEditingCar(null);
    setScreen('addCar');
  };

  const openEditCar = (car) => {
    setEditingCar(car);
    setScreen('addCar');
  };

  const handleSaveCar = (carData) => {
    setCars((prev) => {
      if (editingCar) {
        return prev.map((car) =>
          car.id === carData.id
            ? {
                ...car,
                ...carData,
              }
            : car
        );
      }

      const spot = getSpotForIndex(prev.length);

      return [
        {
          ...carData,
          title: carData.title || carData.make,
          isParked: false,
          parkedSpotName: spot.label,
          parkedLocation: spot.coordinates,
          parkedSince: null,
        },
        ...prev,
      ];
    });

    setEditingCar(null);
    setScreen('home');
  };

  const handleRemoveCar = (carId) => {
    setCars((prev) => prev.filter((car) => car.id !== carId));
  };

  const handleToggleParked = (carId) => {
    setCars((prev) =>
      prev.map((car, index) => {
        if (car.id !== carId) return car;

        const fallbackSpot = getSpotForIndex(index);

        if (car.isParked) {
          return {
            ...car,
            isParked: false,
            parkedSince: null,
          };
        }

        return {
          ...car,
          isParked: true,
          parkedSpotName: car.parkedSpotName || fallbackSpot.label,
          parkedLocation: car.parkedLocation || fallbackSpot.coordinates,
          parkedSince: new Date().toISOString(),
        };
      })
    );
  };

  const isSignedInArea = [
    'home',
    'find',
    'chat',
    'past',
    'profile',
    'addCar',
  ].includes(screen);

  return (
    <View
      key={isSignedInArea ? 'signed-in' : 'signed-out'}
      style={styles.appContainer}
    >
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
        />
      )}

      {!isSignedInArea && screen === 'password' && (
        <PasswordScreen
          identifier={identifier}
          onBack={() => setScreen('signin')}
          onSignIn={() => setScreen('home')}
        />
      )}

      {!isSignedInArea && screen === 'register' && (
        <RegisterScreen
          onBack={() => setScreen('welcome')}
          onSignIn={() => setScreen('signin')}
          onRegister={() => setScreen('home')}
        />
      )}

      {isSignedInArea && (
        <>
          {screen === 'home' && (
            <HomeScreen
              cars={cars}
              onAddCarPress={openAddCar}
              onEditCarPress={openEditCar}
              onRemoveCarPress={handleRemoveCar}
              onToggleParkedPress={handleToggleParked}
              onProfilePress={() => setScreen('profile')}
              onFindPress={() => setScreen('find')}
              onChatPress={() => setScreen('chat')}
              tabBarHeight={TAB_BAR_HEIGHT}
            />
          )}

          {screen === 'past' && (
            <HomeScreen
              cars={cars}
              onAddCarPress={openAddCar}
              onEditCarPress={openEditCar}
              onRemoveCarPress={handleRemoveCar}
              onToggleParkedPress={handleToggleParked}
              onProfilePress={() => setScreen('profile')}
              onFindPress={() => setScreen('find')}
              onChatPress={() => setScreen('chat')}
              tabBarHeight={TAB_BAR_HEIGHT}
            />
          )}

          {screen === 'addCar' && (
            <AddCarScreen
              key={editingCar?.id ?? 'new-car'}
              initialCar={editingCar}
              onBackPress={() => {
                setEditingCar(null);
                setScreen('home');
              }}
              onSaveCar={handleSaveCar}
            />
          )}

          {screen === 'profile' && (
            <ProfileScreen
              onBack={() => setScreen('home')}
              onSignOut={() => setScreen('welcome')}
            />
          )}

          {screen === 'chat' && (
            <ChatScreen onClose={() => setScreen('home')} />
          )}

          {screen === 'find' && (
            <FindScreen tabBarHeight={TAB_BAR_HEIGHT} />
          )}

          {screen !== 'chat' && screen !== 'addCar' && (
            <BottomTabs
              activeScreen={screen}
              onFindPress={() => setScreen('find')}
              onChatPress={() => setScreen('chat')}
              onHomePress={() => setScreen('home')}
              onPastPress={() => setScreen('past')}
              onProfilePress={() => setScreen('profile')}
            />
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