import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { globalStyles, spacing, radius, shadow, colors } from '../styles/global';
import {
  loadNotificationSettings,
  saveNotificationSettings,
} from '../utils/notificationSettings';

export default function NotificationSettingsScreen({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const settings = await loadNotificationSettings();
        setEnabled(settings.enabled);
        setShowBanner(settings.showBanner);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const persistSettings = async (nextEnabled, nextShowBanner) => {
    setSaving(true);

    try {
      await saveNotificationSettings({
        enabled: nextEnabled,
        showBanner: nextShowBanner,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (value) => {
    setEnabled(value);
    await persistSettings(value, showBanner);
  };

  const handleSelectBannerStyle = async (value) => {
    setShowBanner(value);
    await persistSettings(enabled, value);
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={globalStyles.backButton}>
          <Text style={globalStyles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#111" />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Notifications</Text>
                <Text style={styles.rowSubtitle}>
                  Turn parking alerts and reminders on or off.
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={handleToggleEnabled}
                disabled={saving}
              />
            </View>
          </View>

          <View style={[styles.card, !enabled && styles.cardDisabled]}>
            <Text style={styles.sectionLabel}>Alert style</Text>
            <Text style={styles.sectionHint}>
              Choose how notifications appear when they are enabled.
            </Text>

            <TouchableOpacity
              style={[
                styles.optionRow,
                showBanner && styles.optionRowSelected,
              ]}
              activeOpacity={0.85}
              disabled={!enabled || saving}
              onPress={() => handleSelectBannerStyle(true)}
            >
              <Text
                style={[
                  styles.optionTitle,
                  showBanner && styles.optionTitleSelected,
                ]}
              >
                Banner
              </Text>
              <Text
                style={[
                  styles.optionSubtitle,
                  showBanner && styles.optionSubtitleSelected,
                ]}
              >
                Show a banner at the top of the screen.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionRow,
                !showBanner && styles.optionRowSelected,
              ]}
              activeOpacity={0.85}
              disabled={!enabled || saving}
              onPress={() => handleSelectBannerStyle(false)}
            >
              <Text
                style={[
                  styles.optionTitle,
                  !showBanner && styles.optionTitleSelected,
                ]}
              >
                No banner
              </Text>
              <Text
                style={[
                  styles.optionSubtitle,
                  !showBanner && styles.optionSubtitleSelected,
                ]}
              >
                Keep notifications silent without banner alerts.
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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

  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    gap: 16,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 16,
    ...shadow.soft,
  },

  cardDisabled: {
    opacity: 0.55,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },

  rowText: {
    flex: 1,
  },

  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  rowSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },

  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },

  sectionHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },

  optionRow: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ececec',
  },

  optionRowSelected: {
    backgroundColor: '#111',
    borderColor: '#111',
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },

  optionTitleSelected: {
    color: '#fff',
  },

  optionSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  optionSubtitleSelected: {
    color: '#d4d4d4',
  },
});
