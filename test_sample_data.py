#!/usr/bin/env python3
"""
Test sample data creation specifically
"""

import requests
import json

def test_sample_data_creation():
    base_url = "https://workshop-ai-1.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    print("🧪 Testing Sample Data Creation")
    print("=" * 50)
    
    # First, reset system with sample data creation
    print("\n1. Triggering complete reset with sample data...")
    reset_url = f"{api_url}/admin/reset-complete?create_sample_data=true"
    
    try:
        response = requests.post(reset_url, timeout=30)
        print(f"Reset response status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                reset_data = response.json()
                print(f"Reset response: {json.dumps(reset_data, indent=2)}")
                
                if reset_data.get('success'):
                    print("✅ Reset completed successfully")
                    sample_data = reset_data.get('sample_data_created', [])
                    if sample_data:
                        print("✅ Sample data creation info:")
                        for item in sample_data:
                            print(f"   {item.get('collection')}: {item.get('count')} records")
                    else:
                        print("⚠️  No sample data creation info returned")
                else:
                    print(f"❌ Reset failed: {reset_data.get('message', 'Unknown error')}")
            except json.JSONDecodeError:
                print(f"Response text: {response.text}")
        else:
            print(f"❌ Reset failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error during reset: {e}")
    
    # Now check if data was actually created
    print("\n2. Checking if sample data was created...")
    collections_to_check = ["vehiculos", "clientes", "mecanicos", "servicios_repuestos", "tasas_cambio"]
    
    for collection in collections_to_check:
        try:
            url = f"{api_url}/{collection}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"✅ {collection}: {len(data)} records found")
                    if len(data) > 0:
                        # Show first record structure
                        first_record = data[0]
                        print(f"   Sample record keys: {list(first_record.keys())}")
                else:
                    print(f"⚠️  {collection}: Unexpected response format")
            else:
                print(f"❌ {collection}: Failed to retrieve (status {response.status_code})")
                
        except Exception as e:
            print(f"❌ {collection}: Error - {e}")

if __name__ == "__main__":
    test_sample_data_creation()