import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { globalStyles, spacing } from '../styles/global';

export default function RegisterScreen({ onBack, onSignIn, onRegister, onDevBypass }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const passwordChecks = useMemo(() => {
    return {
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      length: password.length >= 8 && password.length <= 20,
    };
  }, [password]);

  const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean);

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);

    if (digits.length === 0) return '';
    if (digits.length < 4) return digits;
    if (digits.length < 7) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const isEmailValid = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const isMobileValid = (value) => {
    const digitsOnly = value.replace(/\D/g, '');
    return digitsOnly.length === 10;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!isMobileValid(mobile)) {
      newErrors.mobile = 'Enter a valid mobile number';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isEmailValid(email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!allPasswordChecksPassed) {
      newErrors.password = 'Password does not meet all requirements';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (!validateForm()) return;

    onRegister?.({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      password,
    });
  };

  const handleMobileChange = (value) => {
    setMobile(formatPhoneNumber(value));
    if (errors.mobile) {
      setErrors((prev) => ({ ...prev, mobile: undefined }));
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.topSection}>
        <TouchableOpacity onPress={onBack} style={globalStyles.backButton}>
          <Text style={globalStyles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Image
            source={require('../assets/parking.png')}
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={[globalStyles.title, styles.title]}>Create your account</Text>

          <View
            style={[
              globalStyles.inputWrapper,
              styles.inputWrapper,
              errors.firstName && globalStyles.inputWrapperError,
            ]}
          >
            {firstName.length > 0 && (
              <Text style={globalStyles.floatingLabel}>First name</Text>
            )}
            <TextInput
              style={[
                globalStyles.input,
                styles.input,
                firstName.length > 0 && styles.inputWithLabel,
              ]}
              placeholder={firstName.length > 0 ? '' : 'First name'}
              placeholderTextColor="#888"
              value={firstName}
              onChangeText={(value) => {
                setFirstName(value);
                if (errors.firstName) {
                  setErrors((prev) => ({ ...prev, firstName: undefined }));
                }
              }}
            />
          </View>
          {errors.firstName ? (
            <Text style={[globalStyles.errorText, styles.errorText]}>
              {errors.firstName}
            </Text>
          ) : null}

          <View
            style={[
              globalStyles.inputWrapper,
              styles.inputWrapper,
              errors.lastName && globalStyles.inputWrapperError,
            ]}
          >
            {lastName.length > 0 && (
              <Text style={globalStyles.floatingLabel}>Last name</Text>
            )}
            <TextInput
              style={[
                globalStyles.input,
                styles.input,
                lastName.length > 0 && styles.inputWithLabel,
              ]}
              placeholder={lastName.length > 0 ? '' : 'Last name'}
              placeholderTextColor="#888"
              value={lastName}
              onChangeText={(value) => {
                setLastName(value);
                if (errors.lastName) {
                  setErrors((prev) => ({ ...prev, lastName: undefined }));
                }
              }}
            />
          </View>
          {errors.lastName ? (
            <Text style={[globalStyles.errorText, styles.errorText]}>
              {errors.lastName}
            </Text>
          ) : null}

          <View
            style={[
              globalStyles.inputWrapper,
              styles.inputWrapper,
              errors.mobile && globalStyles.inputWrapperError,
            ]}
          >
            {mobile.length > 0 && (
              <Text style={globalStyles.floatingLabel}>Mobile number</Text>
            )}
            <TextInput
              style={[
                globalStyles.input,
                styles.input,
                mobile.length > 0 && styles.inputWithLabel,
              ]}
              placeholder={mobile.length > 0 ? '' : 'Mobile number'}
              placeholderTextColor="#888"
              value={mobile}
              onChangeText={handleMobileChange}
              keyboardType="phone-pad"
            />
          </View>
          {errors.mobile ? (
            <Text style={[globalStyles.errorText, styles.errorText]}>
              {errors.mobile}
            </Text>
          ) : null}

          <View
            style={[
              globalStyles.inputWrapper,
              styles.inputWrapper,
              errors.email && globalStyles.inputWrapperError,
            ]}
          >
            {email.length > 0 && (
              <Text style={globalStyles.floatingLabel}>Email</Text>
            )}
            <TextInput
              style={[
                globalStyles.input,
                styles.input,
                email.length > 0 && styles.inputWithLabel,
              ]}
              placeholder={email.length > 0 ? '' : 'Email'}
              placeholderTextColor="#888"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          {errors.email ? (
            <Text style={[globalStyles.errorText, styles.errorText]}>
              {errors.email}
            </Text>
          ) : null}

          <View
            style={[
              globalStyles.inputWrapper,
              styles.inputWrapper,
              errors.password && globalStyles.inputWrapperError,
            ]}
          >
            {password.length > 0 && (
              <Text style={globalStyles.floatingLabel}>Password</Text>
            )}
            <TextInput
              style={[
                globalStyles.input,
                styles.input,
                password.length > 0 && styles.inputWithLabel,
              ]}
              placeholder={password.length > 0 ? '' : 'Password'}
              placeholderTextColor="#888"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          {errors.password ? (
            <Text style={[globalStyles.errorText, styles.errorText]}>
              {errors.password}
            </Text>
          ) : null}

          <View style={styles.rulesContainer}>
            <PasswordRule
              passed={passwordChecks.uppercase}
              text="Must contain one uppercase letter"
            />
            <PasswordRule
              passed={passwordChecks.lowercase}
              text="Must contain one lowercase letter"
            />
            <PasswordRule
              passed={passwordChecks.number}
              text="Must contain one number"
            />
            <PasswordRule
              passed={passwordChecks.special}
              text="Must contain one special character"
            />
            <PasswordRule
              passed={passwordChecks.length}
              text="Must be 8–20 characters long"
            />
          </View>

          <TouchableOpacity
            style={[globalStyles.buttonPrimary, styles.button]}
            onPress={handleRegister}
          >
            <Text style={globalStyles.buttonTextPrimary}>Register</Text>
          </TouchableOpacity>

          <Text style={styles.linkRow}>
            Already have an account?{' '}
            <Text style={styles.signInLink} onPress={onSignIn}>
              Sign in
            </Text>
          </Text>

          {typeof __DEV__ !== 'undefined' && __DEV__ && onDevBypass ? (
            <TouchableOpacity
              style={styles.devBypass}
              onPress={onDevBypass}
              accessibilityLabel="Dev bypass registration"
            >
              <Text style={styles.devBypassText}>Skip registration (dev)</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PasswordRule({ passed, text }) {
  return (
    <View style={styles.ruleRow}>
      <Text style={[styles.ruleIcon, passed && styles.ruleIconPassed]}>
        {passed ? '✓' : '○'}
      </Text>
      <Text style={[styles.ruleText, passed && styles.ruleTextPassed]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topSection: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: spacing.screen,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingBottom: 40,
  },

  content: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 10,
  },

  image: {
    width: '85%',
    height: 170,
    marginBottom: 18,
  },

  title: {
    marginBottom: 24,
    textAlign: 'center',
  },

  inputWrapper: {
    width: '85%',
    height: 64,
    marginBottom: 8,
  },

  input: {
    width: '100%',
  },

  inputWithLabel: {
    marginTop: 14,
  },

  errorText: {
    width: '85%',
    marginBottom: 12,
  },

  rulesContainer: {
    width: '85%',
    marginTop: 4,
    marginBottom: 20,
  },

  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  ruleIcon: {
    width: 20,
    fontSize: 14,
    color: '#888',
  },

  ruleIconPassed: {
    color: '#1f7a1f',
  },

  ruleText: {
    fontSize: 13,
    color: '#666',
  },

  ruleTextPassed: {
    color: '#1f7a1f',
  },

  button: {
    width: '85%',
    marginBottom: 16,
  },

  linkRow: {
    textAlign: 'center',
    fontSize: 14,
    color: '#000',
  },

  signInLink: {
    color: '#007AFF',
    fontWeight: '500',
  },

  devBypass: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  devBypassText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
});