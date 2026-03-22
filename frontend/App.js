import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import WelcomeScreen from './screens/WelcomeScreen';
import SignInScreen from './screens/SignInScreen';
import PasswordScreen from './screens/PasswordScreen';
import RegisterScreen from './screens/RegisterScreen';

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
        />
      )}

      {screen === 'register' && (
        <RegisterScreen
          onBack={() => setScreen('welcome')}
          onSignIn={() => setScreen('signin')}
          onRegister={(formData) => {
            console.log('Register form:', formData);
          }}
        />
      )}

      <StatusBar style="dark" />
    </>
  );
}