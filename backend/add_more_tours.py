#!/usr/bin/env python3
"""
Script to add more tours to the database
"""
import requests
import json

BACKEND_URL = "http://localhost:8001"

# First, create a user account to get a token
def create_user_and_get_token():
    """Create a user and get auth token"""
    signup_data = {
        "name": "Tour Admin",
        "email": "admin@tours.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/signup", json=signup_data)
        if response.status_code == 200:
            return response.json()["access_token"]
        elif response.status_code == 400 and "already registered" in response.json().get("detail", ""):
            # User exists, try to login
            login_data = {
                "email": signup_data["email"],
                "password": signup_data["password"]
            }
            login_response = requests.post(f"{BACKEND_URL}/api/auth/login", json=login_data)
            if login_response.status_code == 200:
                return login_response.json()["access_token"]
    except Exception as e:
        print(f"Error getting token: {e}")
    return None

def add_tour(token, tour_data):
    """Add a tour using the API"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/tours", json=tour_data, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error adding tour '{tour_data['name']}': {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return None

# Additional tours to add
additional_tours = [
    {
        "name": "Urban Art & Street Culture Tour",
        "description": "Discover vibrant street art, murals, and local culture in the city's most creative neighborhoods. Perfect for art lovers and photographers.",
        "difficulty": "easy",
        "duration": "2-3 hours",
        "distance": "4 km",
        "category": "walking",
        "image": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
        "rating": 4.9,
        "reviews_count": 203,
        "points_of_interest": [
            {
                "id": "poi_art1",
                "name": "Mural District",
                "description": "A collection of stunning murals by local and international artists. Each piece tells a unique story.",
                "location": {"lat": 40.7500, "lng": -73.9900},
                "order": 1
            },
            {
                "id": "poi_art2",
                "name": "Artisan Market",
                "description": "Local market featuring handmade crafts, jewelry, and artwork from neighborhood artists.",
                "location": {"lat": 40.7520, "lng": -73.9920},
                "order": 2
            },
            {
                "id": "poi_art3",
                "name": "Graffiti Gallery",
                "description": "An outdoor gallery showcasing the evolution of street art in the city. Free admission.",
                "location": {"lat": 40.7540, "lng": -73.9940},
                "order": 3
            }
        ]
    },
    {
        "name": "Foodie's Culinary Journey",
        "description": "Taste your way through the city's best food scene. Visit local markets, food trucks, and hidden gem restaurants.",
        "difficulty": "easy",
        "duration": "3-4 hours",
        "distance": "3 km",
        "category": "walking",
        "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
        "rating": 4.8,
        "reviews_count": 312,
        "points_of_interest": [
            {
                "id": "poi_food1",
                "name": "Central Market",
                "description": "Historic market hall with local vendors, fresh produce, and artisanal foods. Try the famous cheese stall!",
                "location": {"lat": 40.7600, "lng": -74.0000},
                "order": 1
            },
            {
                "id": "poi_food2",
                "name": "Food Truck Plaza",
                "description": "Collection of award-winning food trucks serving everything from tacos to gourmet burgers.",
                "location": {"lat": 40.7620, "lng": -74.0020},
                "order": 2
            },
            {
                "id": "poi_food3",
                "name": "Historic Bakery",
                "description": "Family-owned bakery since 1920. Famous for their sourdough bread and pastries. Don't miss the cinnamon rolls!",
                "location": {"lat": 40.7640, "lng": -74.0040},
                "order": 3
            }
        ]
    },
    {
        "name": "Sunset Beach Cycling",
        "description": "A relaxing evening bike ride along the coast with stunning sunset views. Perfect for couples and families.",
        "difficulty": "easy",
        "duration": "1.5-2 hours",
        "distance": "8 km",
        "category": "cycling",
        "image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
        "rating": 4.7,
        "reviews_count": 145,
        "points_of_interest": [
            {
                "id": "poi_beach1",
                "name": "Sunset Point",
                "description": "The best spot to watch the sunset with panoramic ocean views. Arrive 30 minutes before sunset for the best experience.",
                "location": {"lat": 40.7700, "lng": -74.0100},
                "order": 1
            },
            {
                "id": "poi_beach2",
                "name": "Beach Boardwalk",
                "description": "Scenic boardwalk perfect for cycling with ocean views on one side and beach cafes on the other.",
                "location": {"lat": 40.7720, "lng": -74.0120},
                "order": 2
            },
            {
                "id": "poi_beach3",
                "name": "Lighthouse Park",
                "description": "Historic lighthouse dating back to 1850, now surrounded by a beautiful park. Great for photos!",
                "location": {"lat": 40.7740, "lng": -74.0140},
                "order": 3
            }
        ]
    },
    {
        "name": "Nature & Wildlife Discovery",
        "description": "Explore nature trails, spot local wildlife, and learn about the region's ecosystem. Great for families and nature enthusiasts.",
        "difficulty": "moderate",
        "duration": "3-4 hours",
        "distance": "6 km",
        "category": "walking",
        "image": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
        "rating": 4.6,
        "reviews_count": 178,
        "points_of_interest": [
            {
                "id": "poi_nature1",
                "name": "Bird Watching Tower",
                "description": "Three-story observation tower with binoculars provided. Spot over 50 species of birds in their natural habitat.",
                "location": {"lat": 40.7800, "lng": -74.0200},
                "order": 1
            },
            {
                "id": "poi_nature2",
                "name": "Wildflower Meadow",
                "description": "Beautiful meadow blooming with native wildflowers in spring and summer. Perfect for photography.",
                "location": {"lat": 40.7820, "lng": -74.0220},
                "order": 2
            },
            {
                "id": "poi_nature3",
                "name": "Nature Center",
                "description": "Educational center with interactive exhibits about local wildlife and conservation efforts. Free admission.",
                "location": {"lat": 40.7840, "lng": -74.0240},
                "order": 3
            }
        ]
    },
    {
        "name": "Historic Architecture Walk",
        "description": "Discover the city's architectural heritage from colonial times to modern skyscrapers. Learn about the stories behind the buildings.",
        "difficulty": "easy",
        "duration": "2 hours",
        "distance": "3.5 km",
        "category": "walking",
        "image": "https://images.unsplash.com/photo-1487958449943-2429e8be8625",
        "rating": 4.5,
        "reviews_count": 167,
        "points_of_interest": [
            {
                "id": "poi_arch1",
                "name": "Victorian Quarter",
                "description": "Well-preserved Victorian-era buildings showcasing ornate architecture from the 1800s.",
                "location": {"lat": 40.7900, "lng": -74.0300},
                "order": 1
            },
            {
                "id": "poi_arch2",
                "name": "Art Deco Theater",
                "description": "Stunning Art Deco theater from the 1920s. Still operational with regular shows and tours.",
                "location": {"lat": 40.7920, "lng": -74.0320},
                "order": 2
            },
            {
                "id": "poi_arch3",
                "name": "Modern Skyline Viewpoint",
                "description": "Best viewpoint to see the contrast between historic and modern architecture. Great photo opportunity.",
                "location": {"lat": 40.7940, "lng": -74.0340},
                "order": 3
            }
        ]
    },
    {
        "name": "Mountain Bike Adventure",
        "description": "Thrilling mountain bike trail with challenging terrain, jumps, and scenic overlooks. For experienced riders only.",
        "difficulty": "hard",
        "duration": "4-5 hours",
        "distance": "20 km",
        "category": "cycling",
        "image": "https://images.unsplash.com/photo-1571068316344-75bc76f77890",
        "rating": 4.9,
        "reviews_count": 89,
        "points_of_interest": [
            {
                "id": "poi_mtb1",
                "name": "Trailhead & Bike Shop",
                "description": "Starting point with bike rentals, safety equipment, and trail maps. Staff can provide route recommendations.",
                "location": {"lat": 40.8000, "lng": -74.0400},
                "order": 1
            },
            {
                "id": "poi_mtb2",
                "name": "Summit Overlook",
                "description": "Highest point of the trail with breathtaking 360-degree views. Rest area with benches and water station.",
                "location": {"lat": 40.8050, "lng": -74.0450},
                "order": 2
            },
            {
                "id": "poi_mtb3",
                "name": "Technical Descent",
                "description": "Challenging downhill section with rock gardens and switchbacks. Advanced skills required. Alternative easy route available.",
                "location": {"lat": 40.8100, "lng": -74.0500},
                "order": 3
            }
        ]
    }
]

if __name__ == "__main__":
    print("Adding additional tours to the database...")
    print("=" * 60)
    
    # Get authentication token
    token = create_user_and_get_token()
    if not token:
        print("❌ Failed to get authentication token")
        exit(1)
    
    print("✅ Authentication successful\n")
    
    # Add each tour
    success_count = 0
    for tour in additional_tours:
        print(f"Adding: {tour['name']}...", end=" ")
        result = add_tour(token, tour)
        if result:
            print("✅")
            success_count += 1
        else:
            print("❌")
    
    print("\n" + "=" * 60)
    print(f"Successfully added {success_count} out of {len(additional_tours)} tours")
    print(f"\nTotal tours in database: {4 + success_count}")

