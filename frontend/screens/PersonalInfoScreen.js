import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { globalStyles, spacing, radius, shadow, colors } from '../styles/global';
import { getMyProfile, updateMyProfile } from '../api/users';

function splitFullName(full) {
  const t = (full || '').trim();
  if (!t) return { first: '', last: '' };
  const i = t.indexOf(' ');
  if (i === -1) return { first: t, last: '' };
  return { first: t.slice(0, i).trim(), last: t.slice(i + 1).trim() };
}

function isEmailValid(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function Field({ label, children, isLast = false }) {
  return (
    <View style={[styles.fieldBlock, !isLast && styles.fieldBlockBorder]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export default function PersonalInfoScreen({ accessToken, onBack, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getMyProfile(accessToken);
        if (data?.detail) {
          throw new Error(data.detail);
        }
        const { first, last } = splitFullName(data?.full_name);
        setFirstName(first);
        setLastName(last);
        setMobile(data?.phone || '');
        setEmail(data?.email || '');
      } catch (e) {
        Alert.alert('Could not load profile', e.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken]);

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
  const trimmedEmail = email.trim().toLowerCase();
  const isValid =
    fullName.length > 0 && trimmedEmail.length > 0 && isEmailValid(trimmedEmail);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Name required', 'Please enter your first and last name.');
      return;
    }

    if (!isEmailValid(trimmedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    if (!accessToken) {
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyProfile(accessToken, {
        full_name: fullName,
        email: trimmedEmail,
        phone: mobile.trim() === '' ? '' : mobile.trim(),
      });
      onSaved?.(updated);
    } catch (e) {
      Alert.alert('Could not save', e.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topSection}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onBack} style={globalStyles.backButton}>
              <Text style={globalStyles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Personal Info</Text>
            <View style={styles.topBarSpacer} />
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#111" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.intro}>
              Update your account details. Changes are saved to your profile.
            </Text>

            <View style={styles.formCard}>
              <Field label="First name">
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                />
              </Field>

              <Field label="Last name">
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                />
              </Field>

              <Field label="Mobile">
                <TextInput
                  style={styles.input}
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="Phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </Field>

              <Field label="Email" isLast>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Field>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, (!isValid || saving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isValid || saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  topSection: {
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: spacing.screen,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  topBarSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    paddingHorizontal: 14,
    paddingVertical: 4,
    ...shadow.soft,
  },
  fieldBlock: {
    paddingVertical: 10,
  },
  fieldBlockBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  input: {
    minHeight: 36,
    paddingHorizontal: 0,
    paddingVertical: 2,
    fontSize: 15,
    color: '#111',
  },
  saveButton: {
    height: 44,
    borderRadius: radius.medium,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    ...shadow.soft,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
