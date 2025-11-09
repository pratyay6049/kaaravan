import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

interface PointOfInterest {
  id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  order: number;
  image?: string;
}

interface Tour {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  duration: string;
  distance: string;
  category: string;
  image: string;
  points_of_interest: PointOfInterest[];
  rating: number;
  reviews_count: number;
}

export default function TourDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    if (id) {
      fetchTour();
      checkEnrollment();
      requestLocationPermission();
    }
  }, [id]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const fetchTour = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await axios.get(`${BACKEND_URL}/api/tours/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTour(response.data);
    } catch (error: any) {
      console.error('Error fetching tour:', error);
      Alert.alert('Error', 'Could not load tour details');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await axios.get(`${BACKEND_URL}/api/user-tours`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const enrolled = response.data.some((ut: any) => ut.tour_id === id);
      setIsEnrolled(enrolled);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    if (!locationPermission) {
      Alert.alert(
        'Location Required',
        'Please enable location permissions to start this tour.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: requestLocationPermission },
        ]
      );
      return;
    }

    setEnrolling(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      await axios.post(
        `${BACKEND_URL}/api/user-tours/enroll`,
        { tour_id: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEnrolled(true);
      Alert.alert('Success', 'You have enrolled in this tour!', [
        { text: 'OK', onPress: () => router.push('/(tabs)/my-tours') },
      ]);
    } catch (error: any) {
      console.error('Error enrolling:', error);
      Alert.alert('Error', 'Could not enroll in tour');
    } finally {
      setEnrolling(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#10b981';
      case 'moderate':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getMapRegion = () => {
    if (!tour || tour.points_of_interest.length === 0) {
      return {
        latitude: 40.7128,
        longitude: -74.006,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const lats = tour.points_of_interest.map((poi) => poi.location.lat);
    const lngs = tour.points_of_interest.map((poi) => poi.location.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5 || 0.05,
      longitudeDelta: (maxLng - minLng) * 1.5 || 0.05,
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading tour...</Text>
      </View>
    );
  }

  if (!tour) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Tour not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: tour.image || 'https://via.placeholder.com/400x300' }}
            style={styles.headerImage}
          />
          <TouchableOpacity style={styles.backIconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.tourName}>{tour.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#f59e0b" />
              <Text style={styles.ratingText}>
                {tour.rating.toFixed(1)} ({tour.reviews_count})
              </Text>
            </View>
          </View>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={20} color="#6b7280" />
              <Text style={styles.metaText}>{tour.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="walk-outline" size={20} color="#6b7280" />
              <Text style={styles.metaText}>{tour.distance}</Text>
            </View>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(tour.difficulty) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  { color: getDifficultyColor(tour.difficulty) },
                ]}
              >
                {tour.difficulty}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{tour.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route Map</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={getMapRegion()}
                provider={PROVIDER_DEFAULT}
              >
                {tour.points_of_interest.map((poi, index) => (
                  <Marker
                    key={poi.id}
                    coordinate={{
                      latitude: poi.location.lat,
                      longitude: poi.location.lng,
                    }}
                    title={poi.name}
                    description={poi.description}
                  >
                    <View style={styles.markerContainer}>
                      <View style={styles.marker}>
                        <Text style={styles.markerText}>{index + 1}</Text>
                      </View>
                    </View>
                  </Marker>
                ))}
                {tour.points_of_interest.length > 1 && (
                  <Polyline
                    coordinates={tour.points_of_interest.map((poi) => ({
                      latitude: poi.location.lat,
                      longitude: poi.location.lng,
                    }))}
                    strokeColor="#2563eb"
                    strokeWidth={3}
                  />
                )}
                {currentLocation && locationPermission && (
                  <Marker
                    coordinate={{
                      latitude: currentLocation.coords.latitude,
                      longitude: currentLocation.coords.longitude,
                    }}
                    title="Your Location"
                  >
                    <View style={styles.currentLocationMarker}>
                      <Ionicons name="location" size={24} color="#2563eb" />
                    </View>
                  </Marker>
                )}
              </MapView>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Points of Interest ({tour.points_of_interest.length})
            </Text>
            {tour.points_of_interest.map((poi, index) => (
              <View key={poi.id} style={styles.poiCard}>
                <View style={styles.poiNumber}>
                  <Text style={styles.poiNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.poiContent}>
                  <Text style={styles.poiName}>{poi.name}</Text>
                  <Text style={styles.poiDescription}>{poi.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.enrollButton,
            (enrolling || isEnrolled) && styles.enrollButtonDisabled,
          ]}
          onPress={handleEnroll}
          disabled={enrolling || isEnrolled}
        >
          {enrolling ? (
            <ActivityIndicator color="#ffffff" />
          ) : isEnrolled ? (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
              <Text style={styles.enrollButtonText}>Already Enrolled</Text>
            </>
          ) : (
            <>
              <Ionicons name="play-circle" size={24} color="#ffffff" />
              <Text style={styles.enrollButtonText}>Start Tour</Text>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  headerImage: {
    width: width,
    height: 300,
    backgroundColor: '#e5e7eb',
  },
  backIconButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 100,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  tourName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  mapContainer: {
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  markerText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  currentLocationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2563eb',
  },
  poiCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  poiNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  poiNumberText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  poiContent: {
    flex: 1,
  },
  poiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  poiDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  enrollButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
  },
  enrollButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  enrollButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
