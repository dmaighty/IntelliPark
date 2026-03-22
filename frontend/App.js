import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import WelcomeScreen from './screens/WelcomeScreen';
import SignInScreen from './screens/SignInScreen';
import PasswordScreen from './screens/PasswordScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [identifier, setIdentifier] = useState('');

  return (
    <>
      {screen === 'welcome' && (
        <WelcomeScreen
          onSignIn={() => setScreen('signin')}
          onRegister={() => setScreen('register')}
        />
      )}

      {screen === 'signin' && (
        <SignInScreen
          onBack={() => setScreen('welcome')}
          onContinue={(value) => {
            setIdentifier(value);
            setScreen('password');
          }}
          onRegister={() => setScreen('register')}
        />
      )}

      {screen === 'password' && (
        <PasswordScreen
          identifier={identifier}
          onBack={() => setScreen('signin')}
          onSignIn={() => setScreen('home')}
        />
      )}

      {screen === 'register' && (
        <RegisterScreen
          onBack={() => setScreen('welcome')}
          onSignIn={() => setScreen('signin')}
          onRegister={() => setScreen('home')}
        />
      )}

      {screen === 'home' && (
        <HomeScreen onProfilePress={() => setScreen('profile')} />
      )}

      {screen === 'profile' && (
        <ProfileScreen
          onBack={() => setScreen('home')}
          onSignOut={() => setScreen('welcome')}
        />
      )}

      <StatusBar style="dark" />
    </>
  );
}