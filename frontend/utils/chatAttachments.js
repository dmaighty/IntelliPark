import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export async function pickChatImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      'Permission needed',
      'Allow photo library access to attach images to your message.'
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.65,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uri: asset.uri,
    mimeType: asset.mimeType || 'image/jpeg',
    base64: asset.base64 || '',
  };
}

export function buildImageDataUrl(image) {
  if (!image?.base64) {
    return null;
  }

  return `data:${image.mimeType || 'image/jpeg'};base64,${image.base64}`;
}
