import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface Tour {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  duration: string;
  distance: string;
  category: string;
  image: string | null;
  rating: number;
  reviews_count: number;
}

export default function Home() {
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Experiences' },
    { id: 'walking', name: 'Walking Tours' },
    { id: 'cycling', name: 'Cycling Tours' },
  ];

  useEffect(() => {
    fetchTours();
  }, [selectedCategory]);

  const fetchTours = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }
      const categoryParam = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      const response = await axios.get(`${BACKEND_URL}/api/tours${categoryParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTours(response.data || []);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching tours:', error);
      setError(error.response?.data?.detail || error.message || 'Could not load tours');
      setTours([]);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderTourCard = ({ item }: { item: Tour }) => (
    <TouchableOpacity
      style={styles.tourCard}
      onPress={() => router.push(`/tour/${item.id}`)}
      activeOpacity={0.95}
    >
      <View style={styles.imageSection}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/400x280' }}
          style={styles.tourImage}
        />
        <View style={styles.imageBadge}>
          <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(item.difficulty) }]} />
          <Text style={styles.difficultyLabel}>{item.difficulty}</Text>
        </View>
      </View>
      
      <View style={styles.contentSection}>
        <View style={styles.titleRow}>
          <Text style={styles.tourName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.reviewsText}>({item.reviews_count})</Text>
          </View>
        </View>
        
        <Text style={styles.tourDescription} numberOfLines={3}>
          {item.description}
        </Text>
        
        <View style={styles.divider} />
        
        <View style={styles.footerRow}>
          <View style={styles.infoGroup}>
            <Ionicons name="time-outline" size={18} color="#60a5fa" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{item.duration}</Text>
            </View>
          </View>
          <View style={styles.infoGroup}>
            <Ionicons name="location-outline" size={18} color="#60a5fa" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{item.distance}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerSubtitle}>Premium Experiences</Text>
          <Text style={styles.headerTitle}>Discover Tours</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="compass" size={32} color="#60a5fa" />
        </View>
      </View>

      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      ) : tours.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={64} color="#475569" />
          <Text style={styles.emptyText}>No tours available</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      ) : (
        <FlatList
          data={tours}
          renderItem={renderTourCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b', // Dark blueish background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    backgroundColor: '#0f172a', // Darker blue for header
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerContent: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#60a5fa', // Light blue for subtitle
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff', // White text for dark background
    letterSpacing: -0.5,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e40af', // Dark blue for icon background
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesWrapper: {
    backgroundColor: '#0f172a', // Dark blue for categories
    paddingBottom: 20,
    paddingTop: 20,
    zIndex: 10,
  },
  categoriesContainer: {
    flexGrow: 0,
  },
  categoriesContent: {
    paddingHorizontal: 24,
    paddingRight: 24,
  },
  categoryChip: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1e293b', // Dark blueish for inactive chips
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#334155', // Darker border
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6', // Bright blue for active
    borderColor: '#3b82f6',
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94a3b8', // Light gray for inactive text
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 24,
    paddingTop: 24,
  },
  tourCard: {
    backgroundColor: '#1e293b', // Dark blueish for cards
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155', // Darker border
  },
  imageSection: {
    width: '100%',
    height: 260,
    position: 'relative',
  },
  tourImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e9d5ff',
  },
  imageBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)', // Dark blue with transparency
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff', // White text for dark background
    textTransform: 'capitalize',
  },
  contentSection: {
    padding: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  tourName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff', // White text for dark background
    flex: 1,
    lineHeight: 28,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff', // White for rating
  },
  reviewsText: {
    fontSize: 14,
    color: '#60a5fa', // Light blue for reviews
    fontWeight: '600',
  },
  tourDescription: {
    fontSize: 15,
    color: '#cbd5e1', // Light gray for description
    lineHeight: 24,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155', // Darker divider
    marginBottom: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextContainer: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: '#60a5fa', // Light blue for labels
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: '#ffffff', // White for values
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#cbd5e1', // Light gray for empty state
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
    textAlign: 'center',
  },
});

