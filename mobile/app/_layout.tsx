import { Stack } from 'expo-router';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#25D366',
    background: '#0f0f0f',
    surface: '#1a1a1a',
  },
};

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
