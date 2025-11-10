import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

export default function MapScreen() {
  const [permissionStatus, setPermissionStatus] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPermissionStatus('denied');
          setErrorMsg('Permission to access location was denied');
          return;
        }
        setPermissionStatus('granted');
        const current = await Location.getCurrentPositionAsync({});
        setLocation(current);
      } catch (e: any) {
        setPermissionStatus('denied');
        setErrorMsg(e?.message || 'Failed to get current location');
      }
    })();
  }, []);

  if (permissionStatus === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.info}>Requesting location permission…</Text>
      </View>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Location permission denied</Text>
        {errorMsg ? <Text style={styles.subtle}>{errorMsg}</Text> : null}
        <Text style={styles.subtle}>Enable location services in Settings and reopen the app.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}> 
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.webFallback}>
            <Text style={styles.webText}>Map preview is available on mobile devices</Text>
            <Text style={styles.webSubText}>Open this in Expo Go (iOS/Android) to see the live map and your location</Text>
            {location && (
              <Text style={styles.webCoords}>Your location: {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}</Text>
            )}
          </View>
        ) : (
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: location?.coords.latitude || 40.7128,
              longitude: location?.coords.longitude || -74.006,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {location && (
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="You are here"
              />
            )}
          </MapView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0f172a',
  },
  info: {
    marginTop: 12,
    color: '#cbd5e1',
  },
  error: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0f172a',
  },
  webText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '700',
  },
  webSubText: {
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  webCoords: {
    color: '#60a5fa',
    marginTop: 12,
  },
});
