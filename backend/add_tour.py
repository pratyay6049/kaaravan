#!/usr/bin/env python3
"""
Helper script to add tours to the database via API.
Usage: python add_tour.py
"""

import requests
import json
import sys

# Configuration
BACKEND_URL = "http://localhost:8001"
API_ENDPOINT = f"{BACKEND_URL}/api/tours"

# You'll need to get a token from logging in first
# For now, this is a template - you'll need to add your auth token
AUTH_TOKEN = "YOUR_AUTH_TOKEN_HERE"

def add_tour(tour_data):
    """Add a tour to the database"""
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(API_ENDPOINT, json=tour_data, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error adding tour: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}")
        return None

# Example tour template
example_tour = {
    "name": "Coastal Sunset Walk",
    "description": "A beautiful evening walk along the coast with stunning sunset views. Perfect for couples and photographers.",
    "difficulty": "easy",
    "duration": "1-2 hours",
    "distance": "4 km",
    "category": "walking",
    "image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "rating": 4.7,
    "reviews_count": 92,
    "points_of_interest": [
        {
            "id": "poi_coast1",
            "name": "Sunset Point",
            "description": "The best spot to watch the sunset with panoramic ocean views.",
            "location": {"lat": 40.7580, "lng": -73.9855},
            "order": 1
        },
        {
            "id": "poi_coast2",
            "name": "Lighthouse",
            "description": "Historic lighthouse dating back to 1850. Now a museum open to visitors.",
            "location": {"lat": 40.7600, "lng": -73.9870},
            "order": 2
        },
        {
            "id": "poi_coast3",
            "name": "Beach Cafe",
            "description": "Charming beachside cafe perfect for a post-walk refreshment.",
            "location": {"lat": 40.7620, "lng": -73.9890},
            "order": 3
        }
    ]
}

if __name__ == "__main__":
    print("Tour Addition Script")
    print("=" * 50)
    print("\nNote: You need to:")
    print("1. Get an auth token by logging in via /api/auth/login")
    print("2. Update AUTH_TOKEN in this script")
    print("3. Or use the API directly with your token\n")
    
    if AUTH_TOKEN == "YOUR_AUTH_TOKEN_HERE":
        print("⚠️  Please set your AUTH_TOKEN first!")
        print("\nTo get a token:")
        print(f"  curl -X POST {BACKEND_URL}/api/signup \\")
        print('    -H "Content-Type: application/json" \\')
        print('    -d \'{"name":"Admin","email":"admin@example.com","password":"password123"}\'')
        sys.exit(1)
    
    # You can modify example_tour or create your own
    result = add_tour(example_tour)
    
    if result:
        print("✅ Tour added successfully!")
        print(f"Tour ID: {result.get('id')}")
        print(f"Tour Name: {result.get('name')}")
    else:
        print("❌ Failed to add tour")

