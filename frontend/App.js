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
import BottomTabs from './components/BottomTabs';

const { height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = height * 0.105;

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [identifier, setIdentifier] = useState('');

  const isSignedInArea = ['home', 'find', 'chat', 'past', 'profile'].includes(screen);

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
              onProfilePress={() => setScreen('profile')}
              onFindPress={() => setScreen('find')}
              onChatPress={() => setScreen('chat')}
              tabBarHeight={TAB_BAR_HEIGHT}
            />
          )}

          {screen === 'profile' && (
            <ProfileScreen
              onBack={() => setScreen('home')}
              onSignOut={() => setScreen('welcome')}
            />
          )}

          {screen === 'chat' && <ChatScreen onClose={() => setScreen('home')} />}

          {screen === 'find' && (
            <HomeScreen
              onProfilePress={() => setScreen('profile')}
              onFindPress={() => setScreen('find')}
              onChatPress={() => setScreen('chat')}
              tabBarHeight={TAB_BAR_HEIGHT}
            />
          )}

          {screen === 'past' && (
            <HomeScreen
              onProfilePress={() => setScreen('profile')}
              onFindPress={() => setScreen('find')}
              onChatPress={() => setScreen('chat')}
              tabBarHeight={TAB_BAR_HEIGHT}
            />
          )}

          {screen !== 'chat' && (
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