import React, { useEffect, useMemo, useState } from 'react';
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
import { getMyProfile } from '../api/users';
import {
  confirmPasswordResetSms,
  requestPasswordResetEmail,
  sendPasswordResetSms,
} from '../api/security';
import {
  getPasswordChecks,
  isPasswordValid,
  maskEmail,
  maskPhone,
} from '../utils/passwordValidation';

function PasswordRule({ passed, text }) {
  return (
    <Text style={[styles.ruleText, passed && styles.ruleTextPassed]}>
      {passed ? '✓' : '○'} {text}
    </Text>
  );
}

export default function SecuritySettingsScreen({ accessToken, onBack }) {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsConfirming, setSmsConfirming] = useState(false);
  const [emailSentMessage, setEmailSentMessage] = useState('');
  const [emailDevLink, setEmailDevLink] = useState('');
  const [smsSentMessage, setSmsSentMessage] = useState('');
  const [smsDevCode, setSmsDevCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordChecks = useMemo(
    () => getPasswordChecks(newPassword),
    [newPassword]
  );

  useEffect(() => {
    const load = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const profile = await getMyProfile(accessToken);
        setEmail(profile?.email || '');
        setPhone(profile?.phone || '');
      } catch (error) {
        Alert.alert('Could not load profile', error.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [accessToken]);

  const handleEmailReset = async () => {
    if (!accessToken) {
      return;
    }

    setEmailSending(true);
    setEmailSentMessage('');
    setEmailDevLink('');

    try {
      const result = await requestPasswordResetEmail(accessToken);
      setEmailSentMessage(result.message);
      setEmailDevLink(result.dev_reset_link || '');
    } catch (error) {
      Alert.alert('Could not send reset email', error.message || 'Unknown error');
    } finally {
      setEmailSending(false);
    }
  };

  const handleSendSmsCode = async () => {
    if (!accessToken) {
      return;
    }

    if (!phone) {
      Alert.alert(
        'Mobile number required',
        'Add a mobile number in Personal Info before using text verification.'
      );
      return;
    }

    setSmsSending(true);
    setSmsSentMessage('');
    setSmsDevCode('');
    setVerificationCode('');

    try {
      const result = await sendPasswordResetSms(accessToken);
      setSmsSentMessage(result.message);
      setSmsDevCode(result.dev_code || '');
    } catch (error) {
      Alert.alert('Could not send code', error.message || 'Unknown error');
    } finally {
      setSmsSending(false);
    }
  };

  const handleSmsReset = async () => {
    if (!accessToken) {
      return;
    }

    if (!verificationCode.trim()) {
      Alert.alert('Code required', 'Enter the verification code from your text message.');
      return;
    }

    if (!isPasswordValid(newPassword)) {
      Alert.alert('Weak password', 'Make sure your new password meets all requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Confirm password must match the new password.');
      return;
    }

    setSmsConfirming(true);

    try {
      const result = await confirmPasswordResetSms(accessToken, {
        code: verificationCode.trim(),
        newPassword,
      });

      Alert.alert('Password updated', result.message || 'Your password was changed.');
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
      setSmsSentMessage('');
      setSmsDevCode('');
    } catch (error) {
      Alert.alert('Could not update password', error.message || 'Unknown error');
    } finally {
      setSmsConfirming(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={globalStyles.backButton}>
            <Text style={globalStyles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#111" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.intro}>
              Change your password using a secure email link or a text verification code.
            </Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Reset via email</Text>
              <Text style={styles.cardBody}>
                We will email a reset link to {maskEmail(email)}. Open the link to choose a
                new password.
              </Text>

              <TouchableOpacity
                style={[styles.actionButton, emailSending && styles.actionButtonDisabled]}
                activeOpacity={0.85}
                onPress={handleEmailReset}
                disabled={emailSending}
              >
                {emailSending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Email reset link</Text>
                )}
              </TouchableOpacity>

              {!!emailSentMessage && (
                <Text style={styles.successText}>{emailSentMessage}</Text>
              )}

              {!!emailDevLink && (
                <Text style={styles.devHint}>Dev link: {emailDevLink}</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Reset via text code</Text>
              <Text style={styles.cardBody}>
                {phone
                  ? `We will text a verification code to ${maskPhone(phone)}.`
                  : 'Add a mobile number in Personal Info to use text verification.'}
              </Text>

              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  (!phone || smsSending) && styles.actionButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleSendSmsCode}
                disabled={!phone || smsSending}
              >
                {smsSending ? (
                  <ActivityIndicator color="#111" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Send verification code</Text>
                )}
              </TouchableOpacity>

              {!!smsSentMessage && (
                <Text style={styles.successText}>{smsSentMessage}</Text>
              )}

              {!!smsDevCode && (
                <Text style={styles.devHint}>Dev code: {smsDevCode}</Text>
              )}

              <Text style={styles.fieldLabel}>Verification code</Text>
              <TextInput
                style={styles.input}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="6-digit code"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={6}
              />

              <Text style={styles.fieldLabel}>New password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor="#999"
                secureTextEntry
              />

              <Text style={styles.fieldLabel}>Confirm password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#999"
                secureTextEntry
              />

              <View style={styles.rulesWrap}>
                <PasswordRule passed={passwordChecks.length} text="8-20 characters" />
                <PasswordRule passed={passwordChecks.uppercase} text="Uppercase letter" />
                <PasswordRule passed={passwordChecks.lowercase} text="Lowercase letter" />
                <PasswordRule passed={passwordChecks.number} text="Number" />
                <PasswordRule passed={passwordChecks.special} text="Special character" />
              </View>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  smsConfirming && styles.actionButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleSmsReset}
                disabled={smsConfirming}
              >
                {smsConfirming ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Update password</Text>
                )}
              </TouchableOpacity>
            </View>
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

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: 10,
    paddingBottom: 12,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  headerSpacer: {
    width: 40,
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 40,
  },

  intro: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 14,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 14,
    marginBottom: 14,
    ...shadow.soft,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },

  cardBody: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 12,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    marginTop: 4,
  },

  input: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#111',
    marginBottom: 8,
  },

  actionButton: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  secondaryButton: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#eef0f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  actionButtonDisabled: {
    opacity: 0.55,
  },

  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  secondaryButtonText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '700',
  },

  successText: {
    marginTop: 10,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },

  devHint: {
    marginTop: 8,
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },

  rulesWrap: {
    marginBottom: 8,
  },

  ruleText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },

  ruleTextPassed: {
    color: '#166534',
    fontWeight: '600',
  },
});
