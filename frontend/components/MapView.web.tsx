import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Web fallback for MapView
export default function MapView(props: any) {
  return (
    <View style={[styles.container, props.style]}>
      <Text style={styles.text}>Map view is only available on mobile devices</Text>
      <Text style={styles.subtext}>Install the Expo Go app to see the full experience</Text>
    </View>
  );
}

export const Marker = (props: any) => null;
export const Polyline = (props: any) => null;
export const PROVIDER_DEFAULT = 'default';

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
