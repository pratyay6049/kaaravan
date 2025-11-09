# How to Add Tours to Your App

There are several ways to add tours to your app:

## Method 1: Using the API Endpoint (Recommended)

### Create a Single Tour

Use the `POST /api/tours` endpoint to create a new tour. You'll need to be authenticated.

**Example using curl:**

```bash
# First, get an auth token by logging in
curl -X POST http://localhost:8001/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123"
  }'

# Use the access_token from the response, then create a tour:
curl -X POST http://localhost:8001/api/tours \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Coastal Sunset Walk",
    "description": "A beautiful evening walk along the coast with stunning sunset views.",
    "difficulty": "easy",
    "duration": "1-2 hours",
    "distance": "4 km",
    "category": "walking",
    "image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "rating": 4.7,
    "reviews_count": 92,
    "points_of_interest": [
      {
        "id": "poi1",
        "name": "Sunset Point",
        "description": "The best spot to watch the sunset.",
        "location": {"lat": 40.7580, "lng": -73.9855},
        "order": 1
      },
      {
        "id": "poi2",
        "name": "Lighthouse",
        "description": "Historic lighthouse from 1850.",
        "location": {"lat": 40.7600, "lng": -73.9870},
        "order": 2
      }
    ]
  }'
```

## Method 2: Using the Seed Endpoint

The seed endpoint adds 4 sample tours. You can use it with `force=true` to add more tours even if some already exist:

```bash
# Add sample tours (only works if no tours exist)
curl -X POST http://localhost:8001/api/seed-tours

# Force add sample tours (adds even if tours already exist)
curl -X POST "http://localhost:8001/api/seed-tours?force=true"
```

## Method 3: Using the Helper Script

1. Get an auth token by logging in
2. Update `AUTH_TOKEN` in `backend/add_tour.py`
3. Modify the tour data in the script
4. Run: `python backend/add_tour.py`

## Tour Data Structure

Each tour requires:

- **name** (string): Tour name
- **description** (string): Tour description
- **difficulty** (string): "easy", "moderate", or "hard"
- **duration** (string): e.g., "2-3 hours"
- **distance** (string): e.g., "5 km"
- **category** (string): "walking", "cycling", or "mixed"
- **image** (string, optional): Image URL
- **rating** (float, optional): Rating from 0.0 to 5.0
- **reviews_count** (int, optional): Number of reviews
- **points_of_interest** (array, optional): Array of POI objects

### Point of Interest Structure

Each POI requires:

- **id** (string): Unique identifier
- **name** (string): POI name
- **description** (string): POI description
- **location** (object): `{"lat": number, "lng": number}`
- **order** (int): Order in the tour (1, 2, 3, etc.)
- **image** (string, optional): Image URL
- **audio_url** (string, optional): Audio guide URL

## Example Tour Categories

- **walking**: Walking tours, hikes, city walks
- **cycling**: Bike tours, cycling routes
- **mixed**: Tours that combine walking and cycling

## Example Difficulties

- **easy**: Suitable for all ages, flat terrain
- **moderate**: Some elevation, moderate fitness required
- **hard**: Challenging terrain, good fitness required

## Tips

1. Use high-quality images from Unsplash or similar services
2. Make sure coordinates (lat/lng) are accurate for your location
3. Order POIs logically along the route
4. Write engaging descriptions to attract users
5. Set appropriate difficulty levels based on actual route conditions

