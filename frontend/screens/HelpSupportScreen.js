import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { globalStyles, spacing, radius, shadow, colors } from '../styles/global';
import {
  SUPPORT_FAQ,
  SUPPORT_TEAM,
  buildSupportMailtoUrl,
} from '../utils/supportEmail';

export default function HelpSupportScreen({ onBack }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      Alert.alert('Message required', 'Enter your question or feedback before sending.');
      return;
    }

    const mailSubject = subject.trim() || 'IntelliPark Support Request';
    const mailBody = [
      trimmedMessage,
      '',
      '---',
      'Sent from IntelliPark',
    ].join('\n');

    const url = buildSupportMailtoUrl({
      subject: mailSubject,
      body: mailBody,
    });

    try {
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      /* fall through */
    }

    Alert.alert(
      'Email support',
      `Could not open your mail app. Email the team at:\n\n${SUPPORT_TEAM.map(
        (member) => member.email
      ).join('\n')}`
    );
  };

  const handleExamplePress = (item) => {
    setSubject(item.question);
    setMessage(
      `Hi IntelliPark team,\n\nI have a question about: ${item.question}\n\n`
    );
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
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>
            Browse common answers or send a ticket to the IntelliPark team.
          </Text>

          <Text style={styles.sectionTitle}>Common questions</Text>
          {SUPPORT_FAQ.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.faqCard}
              activeOpacity={0.85}
              onPress={() => handleExamplePress(item)}
            >
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
              <Text style={styles.faqAction}>Use this question</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Submit feedback or a ticket</Text>
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>Subject</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="What do you need help with?"
              placeholderTextColor="#999"
            />

            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your issue, question, or feedback..."
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                !message.trim() && styles.sendButtonDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleSend}
              disabled={!message.trim()}
            >
              <Text style={styles.sendButtonText}>Send to support team</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.teamCard}>
            <Text style={styles.teamTitle}>Support team</Text>
            {SUPPORT_TEAM.map((member) => (
              <Text key={member.email} style={styles.teamMember}>
                {member.name} · {member.email}
              </Text>
            ))}
          </View>
        </ScrollView>
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

  scrollContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 40,
  },

  intro: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },

  faqCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 12,
    marginBottom: 10,
    ...shadow.soft,
  },

  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },

  faqAnswer: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },

  faqAction: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 12,
    marginBottom: 14,
    ...shadow.soft,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
    marginBottom: 6,
  },

  input: {
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    marginBottom: 12,
  },

  messageInput: {
    minHeight: 120,
    maxHeight: 180,
  },

  sendButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.5,
  },

  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  teamCard: {
    backgroundColor: '#f7f7f8',
    borderRadius: radius.medium,
    padding: 12,
  },

  teamTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },

  teamMember: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    marginBottom: 4,
  },
});
