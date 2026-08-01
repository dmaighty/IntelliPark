import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { globalStyles, spacing, radius, shadow, colors } from '../styles/global';
import { getMyProfile, updateMyProfile } from '../api/users';
import {
  buildProfileImageDataUrl,
  getProfileImageSource,
} from '../utils/profileImage';

export default function ProfileScreen({
  accessToken,
  profileImageUrl = null,
  onProfileImageChange,
  onBack,
  onSignOut,
  onPersonalInfo,
  onSecuritySettings,
  onMyVehicles,
  onSavedPlaces,
  onNotificationSettings,
  onSavedGarages,
  onHelpSupport,
  refreshTrigger = 0,
  onGarageDemo,
}) {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!accessToken) {
        setProfileError('Not signed in');
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      setProfileError('');

      try {
        const data = await getMyProfile(accessToken);
        setProfile(data);
        onProfileImageChange?.(data?.profile_image_url || null);
      } catch (e) {
        setProfileError(e.message || 'Failed to load profile');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [accessToken, refreshTrigger, onProfileImageChange]);

  const handleEditPhoto = async () => {
    if (!accessToken) {
      Alert.alert('Not signed in', 'Sign in to update your profile photo.');
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to change your profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';
    const dataUrl = buildProfileImageDataUrl(asset.base64, mimeType);

    if (!dataUrl) {
      Alert.alert('Could not save photo', 'Unable to read the selected image.');
      return;
    }

    try {
      setSavingPhoto(true);

      const updated = await updateMyProfile(accessToken, {
        profile_image_url: dataUrl,
      });

      setProfile(updated);
      onProfileImageChange?.(updated?.profile_image_url || dataUrl);
    } catch (e) {
      Alert.alert(
        'Could not save photo',
        e.message || 'Something went wrong while saving your profile photo.'
      );
    } finally {
      setSavingPhoto(false);
    }
  };

  const profileImageSource = getProfileImageSource(
    profile?.profile_image_url || profileImageUrl
  );

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.topSection}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={globalStyles.backButton}>
            <Text style={globalStyles.backButtonText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentInset}>
          <View style={styles.headerSection}>
            <View style={styles.profileImageWrapper}>
              <Image source={profileImageSource} style={styles.profileImage} />

              <TouchableOpacity
                style={[
                  styles.editPhotoButton,
                  savingPhoto && styles.editPhotoButtonDisabled,
                ]}
                onPress={handleEditPhoto}
                disabled={savingPhoto}
              >
                {savingPhoto ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.editPhotoText}>Edit</Text>
                )}
              </TouchableOpacity>
            </View>

            {loadingProfile ? (
              <ActivityIndicator color="#111" />
            ) : (
              <>
                <Text style={styles.name}>
                  {profile?.full_name || 'Unknown User'}
                </Text>
                {profileError ? (
                  <Text style={styles.subText}>{profileError}</Text>
                ) : (
                  <Text style={styles.subText}>{profile?.email || ''}</Text>
                )}
              </>
            )}
          </View>

          <View style={styles.menuSection}>
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onPersonalInfo?.()}
            >
              <Text style={styles.menuTitle}>Personal Info</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onSecuritySettings?.()}
            >
              <Text style={styles.menuTitle}>Security Settings</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onMyVehicles?.()}
            >
              <Text style={styles.menuTitle}>My Vehicles</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onSavedPlaces?.()}
            >
              <Text style={styles.menuTitle}>Pinned Locations</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onSavedGarages?.()}
            >
              <Text style={styles.menuTitle}>Saved Garages</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onNotificationSettings?.()}
            >
              <Text style={styles.menuTitle}>Notification Settings</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onHelpSupport?.()}
            >
              <Text style={styles.menuTitle}>Help and Support</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onGarageDemo?.()}
            >
              <Text style={styles.menuTitle}>Garage Demo</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topSection: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: spacing.screen,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  contentInset: {
    flex: 1,
    paddingHorizontal: spacing.screen,
  },

  signOutButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.medium,
    backgroundColor: '#f3f4f6',
  },

  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d32f2f',
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },

  profileImageWrapper: {
    position: 'relative',
    marginBottom: spacing.large,
  },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  editPhotoButton: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    backgroundColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.medium,
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  editPhotoButtonDisabled: {
    opacity: 0.7,
  },

  editPhotoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },

  subText: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },

  menuSection: {
    width: '100%',
    paddingHorizontal: 2,
  },

  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: spacing.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow.soft,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  menuArrow: {
    fontSize: 22,
    color: '#888',
  },
});
