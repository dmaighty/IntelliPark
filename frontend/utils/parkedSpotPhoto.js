import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

async function requestCameraPermission() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  return permission.granted;
}

export async function pickParkedSpotPhoto({ preferCamera = true } = {}) {
  if (preferCamera) {
    const granted = await requestCameraPermission();

    if (granted) {
      const cameraResult = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
      });

      if (!cameraResult.canceled && cameraResult.assets?.[0]?.uri) {
        return cameraResult.assets[0].uri;
      }
    }
  }

  const libraryPermission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!libraryPermission.granted) {
    Alert.alert(
      'Permission needed',
      'Allow camera or photo access to save a parked-spot photo.'
    );
    return null;
  }

  const libraryResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.7,
  });

  if (libraryResult.canceled || !libraryResult.assets?.[0]?.uri) {
    return null;
  }

  return libraryResult.assets[0].uri;
}
