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
import { globalStyles, spacing, radius, shadow } from '../styles/global';
import { getMyProfile, updateMyProfile } from '../api/users';

function splitFullName(full) {
  const t = (full || '').trim();
  if (!t) return { first: '', last: '' };
  const i = t.indexOf(' ');
  if (i === -1) return { first: t, last: '' };
  return { first: t.slice(0, i).trim(), last: t.slice(i + 1).trim() };
}

export default function PersonalInfoScreen({ accessToken, onBack, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [emailReadOnly, setEmailReadOnly] = useState('');

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
        setEmailReadOnly(data?.email || '');
      } catch (e) {
        Alert.alert('Could not load profile', e.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken]);

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
  const isValid = fullName.length > 0;

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Name required', 'Please enter your first and last name.');
      return;
    }
    if (!accessToken) return;
    setSaving(true);
    try {
      const updated = await updateMyProfile(accessToken, {
        full_name: fullName,
        phone: mobile.trim() === '' ? '' : mobile.trim(),
      });
      if (onSaved) {
        onSaved(updated);
      }
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
            <View style={styles.fieldCard}>
              <Text style={styles.label}>First name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldCard}>
              <Text style={styles.label}>Last name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldCard}>
              <Text style={styles.label}>Mobile</Text>
              <TextInput
                style={styles.input}
                value={mobile}
                onChangeText={setMobile}
                placeholder="Phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.fieldCard}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.emailValue}>{emailReadOnly || '—'}</Text>
              <Text style={styles.emailHint}>
                Email cannot be changed here yet.
              </Text>
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
                <Text style={styles.saveButtonText}>Save</Text>
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
    marginBottom: 10,
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: radius.medium,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: spacing.medium,
    ...shadow.soft,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  input: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111',
  },
  emailValue: {
    fontSize: 16,
    color: '#444',
    fontWeight: '500',
  },
  emailHint: {
    marginTop: 8,
    fontSize: 13,
    color: '#888',
  },
  saveButton: {
    height: 56,
    borderRadius: radius.medium,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.small,
    ...shadow.soft,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
