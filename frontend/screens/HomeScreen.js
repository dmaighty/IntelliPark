import { Text, View } from 'react-native';
import { globalStyles } from '../styles/global';
import Box from '../components/Box';

export default function HomeScreen() {
  return (
    <View style={globalStyles.container}>
      <Box>
        <Text>IntelliPark</Text>
      </Box>
    </View>
  );
}
