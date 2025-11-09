#!/usr/bin/env python3
"""Test script to verify tours API"""
import requests
import json

BACKEND_URL = "http://localhost:8001"

# First create a test user
print("1. Creating test user...")
signup_data = {
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123"
}

try:
    signup_response = requests.post(f"{BACKEND_URL}/api/signup", json=signup_data)
    if signup_response.status_code == 200:
        token = signup_response.json()["access_token"]
        print("✅ User created, got token")
    elif signup_response.status_code == 400:
        # User exists, try login
        login_response = requests.post(f"{BACKEND_URL}/api/auth/login", json={
            "email": signup_data["email"],
            "password": signup_data["password"]
        })
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            print("✅ User logged in, got token")
        else:
            print(f"❌ Login failed: {login_response.text}")
            exit(1)
    else:
        print(f"❌ Signup failed: {signup_response.text}")
        exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

# Test getting tours
print("\n2. Testing tours API...")
headers = {"Authorization": f"Bearer {token}"}

try:
    response = requests.get(f"{BACKEND_URL}/api/tours", headers=headers)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        tours = response.json()
        print(f"✅ Success! Found {len(tours)} tours")
        print("\nTour names:")
        for i, tour in enumerate(tours[:5], 1):
            print(f"  {i}. {tour.get('name')}")
        if len(tours) > 5:
            print(f"  ... and {len(tours) - 5} more")
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")

