import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

// Only import react-native-maps on native platforms
let MapView: any;
let Marker: any;
let Polyline: any;
let PROVIDER_DEFAULT: any;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
  PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
} else {
  // Web fallback
  MapView = (props: any) => (
    <View style={[styles.container, props.style]}>
      <Text style={styles.text}>Map view available on mobile</Text>
      <Text style={styles.subtext}>Download Expo Go to see the full experience</Text>
    </View>
  );
  Marker = () => null;
  Polyline = () => null;
  PROVIDER_DEFAULT = 'default';
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 24,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export { MapView as default, Marker, Polyline, PROVIDER_DEFAULT };
