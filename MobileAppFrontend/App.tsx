import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { TabNavigator } from './src/navigation/TabNavigator';
import { AppOpeningScreen } from './src/screens/AppOpeningScreen';
import { colors } from './src/theme/colors';

const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.surfaceBorder,
    primary: colors.primary,
  },
};

export default function App() {
  const [isAppOpening, setIsAppOpening] = useState(true);

  if (isAppOpening) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.splashSafeArea} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar style="dark" backgroundColor="#FFFFFF" />
          <AppOpeningScreen onFinish={() => setIsAppOpening(false)} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="dark" backgroundColor={colors.background} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <NavigationContainer theme={CustomLightTheme}>
            <TabNavigator />
          </NavigationContainer>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  splashSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
