from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import warnings
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from bson import ObjectId

# Suppress passlib bcrypt version warning (harmless compatibility issue)
warnings.filterwarnings('ignore', message='.*bcrypt version.*', category=UserWarning)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'env.txt')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
# Add TLS configuration for MongoDB Atlas SSL compatibility
client = AsyncIOMotorClient(
    mongo_url,
    tls=True,
    tlsAllowInvalidCertificates=False
)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# Pydantic Models
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class Location(BaseModel):
    lat: float
    lng: float

class PointOfInterest(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    location: Location
    image: Optional[str] = None
    audio_url: Optional[str] = None
    order: int = 0

class Tour(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    difficulty: str  # easy, moderate, hard
    duration: str  # e.g., "2-3 hours"
    distance: str  # e.g., "5 km"
    category: str  # walking, cycling, mixed
    image: Optional[str] = None
    points_of_interest: List[PointOfInterest] = []
    rating: float = 0.0
    reviews_count: int = 0
    created_at: Optional[datetime] = None

class TourListItem(BaseModel):
    id: str
    name: str
    description: str
    difficulty: str
    duration: str
    distance: str
    category: str
    image: Optional[str] = None
    rating: float = 0.0
    reviews_count: int = 0

class UserTourEnroll(BaseModel):
    tour_id: str

class UserTourResponse(BaseModel):
    id: str
    tour_id: str
    user_id: str
    status: str  # not_started, in_progress, completed
    progress: int = 0  # percentage
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class LocationUpdate(BaseModel):
    tour_id: str
    location: Location

# Auth Routes
@api_router.post("/signup", response_model=AuthResponse)
async def signup(user_data: UserSignup):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    # Create token
    access_token = create_access_token(data={"sub": str(result.inserted_id)})
    
    user_response = UserResponse(
        id=str(result.inserted_id),
        name=user_doc["name"],
        email=user_doc["email"],
        created_at=user_doc["created_at"]
    )
    
    return AuthResponse(access_token=access_token, user=user_response)

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    user_response = UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        created_at=user["created_at"]
    )
    
    return AuthResponse(access_token=access_token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user["created_at"]
    )

# Tours Routes
@api_router.get("/tours", response_model=List[TourListItem])
async def get_tours(category: Optional[str] = None, current_user = Depends(get_current_user)):
    query = {}
    if category and category != "all":
        query["category"] = category
    
    tours = await db.tours.find(query).to_list(100)
    return [
        TourListItem(
            id=str(tour["_id"]),
            name=tour["name"],
            description=tour["description"],
            difficulty=tour["difficulty"],
            duration=tour["duration"],
            distance=tour["distance"],
            category=tour["category"],
            image=tour.get("image"),
            rating=tour.get("rating", 0.0),
            reviews_count=tour.get("reviews_count", 0)
        )
        for tour in tours
    ]

@api_router.get("/tours/{tour_id}", response_model=Tour)
async def get_tour(tour_id: str, current_user = Depends(get_current_user)):
    tour = await db.tours.find_one({"_id": ObjectId(tour_id)})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    return Tour(
        id=str(tour["_id"]),
        name=tour["name"],
        description=tour["description"],
        difficulty=tour["difficulty"],
        duration=tour["duration"],
        distance=tour["distance"],
        category=tour["category"],
        image=tour.get("image"),
        points_of_interest=[
            PointOfInterest(**poi) for poi in tour.get("points_of_interest", [])
        ],
        rating=tour.get("rating", 0.0),
        reviews_count=tour.get("reviews_count", 0),
        created_at=tour.get("created_at")
    )

@api_router.post("/tours", response_model=Tour)
async def create_tour(tour_data: Tour, current_user = Depends(get_current_user)):
    """Create a new tour"""
    tour_doc = {
        "name": tour_data.name,
        "description": tour_data.description,
        "difficulty": tour_data.difficulty,
        "duration": tour_data.duration,
        "distance": tour_data.distance,
        "category": tour_data.category,
        "image": tour_data.image,
        "points_of_interest": [poi.dict() for poi in tour_data.points_of_interest],
        "rating": tour_data.rating,
        "reviews_count": tour_data.reviews_count,
        "created_at": datetime.utcnow()
    }
    
    result = await db.tours.insert_one(tour_doc)
    tour_doc["_id"] = result.inserted_id
    
    return Tour(
        id=str(tour_doc["_id"]),
        name=tour_doc["name"],
        description=tour_doc["description"],
        difficulty=tour_doc["difficulty"],
        duration=tour_doc["duration"],
        distance=tour_doc["distance"],
        category=tour_doc["category"],
        image=tour_doc.get("image"),
        points_of_interest=[
            PointOfInterest(**poi) for poi in tour_doc.get("points_of_interest", [])
        ],
        rating=tour_doc.get("rating", 0.0),
        reviews_count=tour_doc.get("reviews_count", 0),
        created_at=tour_doc.get("created_at")
    )

# User Tours Routes
@api_router.post("/user-tours/enroll", response_model=UserTourResponse)
async def enroll_tour(enrollment: UserTourEnroll, current_user = Depends(get_current_user)):
    # Check if tour exists
    tour = await db.tours.find_one({"_id": ObjectId(enrollment.tour_id)})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    # Check if already enrolled
    existing = await db.user_tours.find_one({
        "user_id": str(current_user["_id"]),
        "tour_id": enrollment.tour_id
    })
    if existing:
        return UserTourResponse(
            id=str(existing["_id"]),
            tour_id=existing["tour_id"],
            user_id=existing["user_id"],
            status=existing["status"],
            progress=existing.get("progress", 0),
            started_at=existing.get("started_at"),
            completed_at=existing.get("completed_at")
        )
    
    # Create enrollment
    user_tour_doc = {
        "user_id": str(current_user["_id"]),
        "tour_id": enrollment.tour_id,
        "status": "not_started",
        "progress": 0,
        "started_at": datetime.utcnow()
    }
    result = await db.user_tours.insert_one(user_tour_doc)
    
    return UserTourResponse(
        id=str(result.inserted_id),
        tour_id=enrollment.tour_id,
        user_id=str(current_user["_id"]),
        status="not_started",
        progress=0,
        started_at=user_tour_doc["started_at"]
    )

@api_router.get("/user-tours", response_model=List[UserTourResponse])
async def get_user_tours(current_user = Depends(get_current_user)):
    user_tours = await db.user_tours.find({"user_id": str(current_user["_id"])}).to_list(100)
    return [
        UserTourResponse(
            id=str(ut["_id"]),
            tour_id=ut["tour_id"],
            user_id=ut["user_id"],
            status=ut["status"],
            progress=ut.get("progress", 0),
            started_at=ut.get("started_at"),
            completed_at=ut.get("completed_at")
        )
        for ut in user_tours
    ]

@api_router.post("/location/update")
async def update_location(location_data: LocationUpdate, current_user = Depends(get_current_user)):
    # Store location update
    location_doc = {
        "user_id": str(current_user["_id"]),
        "tour_id": location_data.tour_id,
        "location": location_data.location.dict(),
        "timestamp": datetime.utcnow()
    }
    await db.location_history.insert_one(location_doc)
    return {"status": "success", "message": "Location updated"}

# Seed data route (for development)
@api_router.post("/seed-tours")
async def seed_tours(force: bool = Query(False, description="Force adding tours even if some already exist")):
    """
    Seed sample tours. 
    Set force=true to add tours even if some already exist.
    """
    count = await db.tours.count_documents({})
    if count > 0 and not force:
        return {"message": "Tours already seeded", "existing_count": count, "hint": "Use ?force=true to add more tours"}
    
    sample_tours = [
        {
            "name": "Historic Downtown Walking Tour",
            "description": "Explore the rich history of downtown with iconic landmarks, museums, and architectural wonders. Perfect for history enthusiasts and first-time visitors.",
            "difficulty": "easy",
            "duration": "2-3 hours",
            "distance": "3 km",
            "category": "walking",
            "image": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df",
            "rating": 4.5,
            "reviews_count": 128,
            "points_of_interest": [
                {
                    "id": "poi1",
                    "name": "City Hall",
                    "description": "A stunning example of neo-classical architecture built in 1885. The building features grand columns and intricate stonework.",
                    "location": {"lat": 40.7128, "lng": -74.0060},
                    "order": 1
                },
                {
                    "id": "poi2",
                    "name": "Historical Museum",
                    "description": "Houses artifacts and exhibits spanning 300 years of local history. Don't miss the colonial era collection on the second floor.",
                    "location": {"lat": 40.7138, "lng": -74.0070},
                    "order": 2
                },
                {
                    "id": "poi3",
                    "name": "Old Town Square",
                    "description": "The heart of the historic district, this square has been a gathering place since 1720. Features a beautiful fountain and seasonal markets.",
                    "location": {"lat": 40.7148, "lng": -74.0080},
                    "order": 3
                }
            ],
            "created_at": datetime.utcnow()
        },
        {
            "name": "Riverside Cycling Adventure",
            "description": "A scenic cycling route along the river with breathtaking views, parks, and waterfront attractions. Suitable for all skill levels.",
            "difficulty": "moderate",
            "duration": "3-4 hours",
            "distance": "15 km",
            "category": "cycling",
            "image": "https://images.unsplash.com/photo-1571068316344-75bc76f77890",
            "rating": 4.8,
            "reviews_count": 89,
            "points_of_interest": [
                {
                    "id": "poi4",
                    "name": "River Park",
                    "description": "A beautiful green space with picnic areas and river access. Popular spot for photos and rest breaks.",
                    "location": {"lat": 40.7200, "lng": -74.0100},
                    "order": 1
                },
                {
                    "id": "poi5",
                    "name": "Old Bridge",
                    "description": "Historic suspension bridge offering panoramic river views. Built in 1903 and recently restored.",
                    "location": {"lat": 40.7250, "lng": -74.0150},
                    "order": 2
                },
                {
                    "id": "poi6",
                    "name": "Waterfront Promenade",
                    "description": "Modern boardwalk with cafes, art installations, and stunning sunset views. Great place to end the tour.",
                    "location": {"lat": 40.7300, "lng": -74.0200},
                    "order": 3
                }
            ],
            "created_at": datetime.utcnow()
        },
        {
            "name": "Mountain Trail Explorer",
            "description": "Challenge yourself with this mountain trail featuring elevation changes, forest paths, and summit views. For experienced hikers.",
            "difficulty": "hard",
            "duration": "5-6 hours",
            "distance": "12 km",
            "category": "walking",
            "image": "https://images.unsplash.com/photo-1551632811-561732d1e306",
            "rating": 4.7,
            "reviews_count": 67,
            "points_of_interest": [
                {
                    "id": "poi7",
                    "name": "Trailhead Station",
                    "description": "Starting point with parking, restrooms, and trail maps. Check weather conditions before starting.",
                    "location": {"lat": 40.7400, "lng": -74.0300},
                    "order": 1
                },
                {
                    "id": "poi8",
                    "name": "Forest Lookout",
                    "description": "Midway point with covered rest area and forest views. Perfect spot for lunch break.",
                    "location": {"lat": 40.7450, "lng": -74.0350},
                    "order": 2
                },
                {
                    "id": "poi9",
                    "name": "Summit Peak",
                    "description": "The highest point offering 360-degree views of the valley and surrounding peaks. Worth the climb!",
                    "location": {"lat": 40.7500, "lng": -74.0400},
                    "order": 3
                }
            ],
            "created_at": datetime.utcnow()
        },
        {
            "name": "Garden District Stroll",
            "description": "Leisurely walk through charming neighborhoods with beautiful gardens, cafes, and boutique shops. Family-friendly.",
            "difficulty": "easy",
            "duration": "1-2 hours",
            "distance": "2 km",
            "category": "walking",
            "image": "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac",
            "rating": 4.6,
            "reviews_count": 156,
            "points_of_interest": [
                {
                    "id": "poi10",
                    "name": "Rose Garden",
                    "description": "Award-winning garden with over 200 rose varieties. Best visited in spring and early summer.",
                    "location": {"lat": 40.7100, "lng": -74.0050},
                    "order": 1
                },
                {
                    "id": "poi11",
                    "name": "Victorian Houses Row",
                    "description": "Perfectly preserved Victorian homes from the late 1800s. These colorful 'Painted Ladies' are Instagram favorites.",
                    "location": {"lat": 40.7120, "lng": -74.0070},
                    "order": 2
                },
                {
                    "id": "poi12",
                    "name": "Community Park",
                    "description": "Local park with playground, pond, and picnic areas. Popular with families and great for a relaxing break.",
                    "location": {"lat": 40.7140, "lng": -74.0090},
                    "order": 3
                }
            ],
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.tours.insert_many(sample_tours)
    total_count = await db.tours.count_documents({})
    return {
        "message": f"Successfully seeded {len(sample_tours)} tours",
        "added": len(sample_tours),
        "total_tours": total_count
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Suppress passlib bcrypt version warning (harmless compatibility issue)
logging.getLogger('passlib.handlers.bcrypt').setLevel(logging.ERROR)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
