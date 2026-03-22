import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

export default function PasswordScreen({ identifier, onBack, onSignIn }) {
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const showFloatingLabel = isFocused || password.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Image
          source={require('../assets/parking.png')}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.title}>Enter your password</Text>

        {/* Show entered email/phone */}
        <Text style={styles.identifier}>{identifier}</Text>

        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.inputWrapperFocused,
          ]}
        >
          {showFloatingLabel && (
            <Text style={styles.floatingLabel}>Password</Text>
          )}

          <TextInput
            style={[
              styles.input,
              showFloatingLabel && styles.inputWithLabel,
            ]}
            placeholder={showFloatingLabel ? '' : 'Password'}
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => onSignIn && onSignIn(password)}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.linkRow}>
            Don’t remember your password?{' '}
            <Text style={styles.resetLink} onPress={() => console.log('Reset pressed')}>
                Reset it
            </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      paddingHorizontal: 24,
    },
    topSection: {
      marginTop: 10,
      marginBottom: 10,
    },
    backButton: {
      alignSelf: 'flex-start',
      padding: 10,
    },
    backArrow: {
      fontSize: 30,
      color: '#000',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginTop: 30,
    },
    image: {
      width: '85%',
      height: 200,
      marginBottom: 18,
    },
    title: {
      fontSize: 30,
      fontWeight: '700',
      marginBottom: 16,
      textAlign: 'center',
      color: '#000',
    },
    identifier: {
      fontSize: 16,
      color: '#000',
      marginBottom: 20,
    },
    inputWrapper: {
      width: '85%',
      height: 64,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 12,
      justifyContent: 'center',
      paddingHorizontal: 14,
      marginBottom: 20,
      backgroundColor: '#fff',
      position: 'relative',
    },
    inputWrapperFocused: {
      borderColor: '#000',
    },
    floatingLabel: {
      position: 'absolute',
      top: 8,
      left: 14,
      fontSize: 12,
      color: '#666',
      backgroundColor: '#fff',
    },
    input: {
      fontSize: 16,
      color: '#000',
      padding: 0,
      margin: 0,
    },
    inputWithLabel: {
      marginTop: 14,
    },
    button: {
      backgroundColor: '#000',
      paddingVertical: 16,
      borderRadius: 28,
      alignItems: 'center',
      width: '85%',
      marginBottom: 16,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    link: {
      textAlign: 'center',
      color: '#000',
      fontSize: 14,
    },

    linkRow: {
        textAlign: 'center',
        fontSize: 14,
        color: '#000',
    },
    
    resetLink: {
    color: '#007AFF', // iOS blue
    fontWeight: '600',
    },
  });