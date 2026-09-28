import React from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NotificationProvider } from "./src/context/NotificationContext";
import { AuthProvider } from "./src/context/AuthContext";
import { WalletProvider } from "./src/context/WalletContext";
import { TripProvider } from "./src/context/TripContext";
import { PermissionProvider } from "./src/context/PermissionContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <PermissionProvider>
        <NotificationProvider>
          <AuthProvider>
            <WalletProvider>
              <TripProvider>
                <StatusBar style="auto" />
                <AppNavigator />
              </TripProvider>
            </WalletProvider>
          </AuthProvider>
        </NotificationProvider>
      </PermissionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
