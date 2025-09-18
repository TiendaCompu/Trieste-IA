import requests
import sys
import json
from datetime import datetime

class EnhancedVehicleEditTester:
    def __init__(self, base_url="https://autoserviceai.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_vehicle_id = "2abab34f-6773-4b20-aa74-5fe054728171"  # From review request

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_vehicle_retrieval(self):
        """Test retrieving the specific vehicle for editing"""
        print("\n" + "="*60)
        print("TESTING VEHICLE RETRIEVAL FOR EDITING")
        print("="*60)
        
        success, response = self.run_test(
            f"Get Vehicle {self.test_vehicle_id}",
            "GET",
            f"vehiculos/{self.test_vehicle_id}",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   Vehicle Data: {response}")
            return response
        return None

    def test_client_retrieval(self, cliente_id):
        """Test retrieving client data"""
        success, response = self.run_test(
            f"Get Client {cliente_id}",
            "GET",
            f"clientes/{cliente_id}",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   Client Data: {response}")
            return response
        return None

    def test_all_clients_retrieval(self):
        """Test retrieving all clients for dropdown"""
        success, response = self.run_test(
            "Get All Clients for Dropdown",
            "GET",
            "clientes",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} clients")
            return response
        return []

    def test_vehicle_update(self, vehicle_data):
        """Test updating vehicle data"""
        print("\n" + "="*60)
        print("TESTING VEHICLE UPDATE FUNCTIONALITY")
        print("="*60)
        
        # Test updating vehicle brand and model
        update_data = {
            "marca": "Honda",  # Changed from Toyota
            "modelo": "Civic",  # Changed from Corolla
            "año": vehicle_data.get("año"),
            "color": vehicle_data.get("color"),
            "kilometraje": vehicle_data.get("kilometraje"),
            "cliente_id": vehicle_data.get("cliente_id")
        }
        
        success, response = self.run_test(
            "Update Vehicle Data",
            "PUT",
            f"vehiculos/{self.test_vehicle_id}",
            200,
            data=update_data
        )
        
        if success:
            print(f"   Updated vehicle: {response}")
        
        return success, response

    def test_client_update(self, cliente_id, client_data):
        """Test updating client data"""
        print("\n" + "="*60)
        print("TESTING CLIENT UPDATE FUNCTIONALITY")
        print("="*60)
        
        # Test updating client data
        update_data = {
            "nombre": client_data.get("nombre", "") + " (Updated)",
            "telefono": client_data.get("telefono"),
            "empresa": client_data.get("empresa"),
            "email": client_data.get("email")
        }
        
        success, response = self.run_test(
            "Update Client Data",
            "PUT",
            f"clientes/{cliente_id}",
            200,
            data=update_data
        )
        
        if success:
            print(f"   Updated client: {response}")
        
        return success, response

    def test_vehicle_owner_change(self, vehicle_data, new_client_id):
        """Test changing vehicle owner"""
        print("\n" + "="*60)
        print("TESTING VEHICLE OWNER CHANGE")
        print("="*60)
        
        update_data = {
            "marca": vehicle_data.get("marca"),
            "modelo": vehicle_data.get("modelo"),
            "año": vehicle_data.get("año"),
            "color": vehicle_data.get("color"),
            "kilometraje": vehicle_data.get("kilometraje"),
            "cliente_id": new_client_id  # Change owner
        }
        
        success, response = self.run_test(
            "Change Vehicle Owner",
            "PUT",
            f"vehiculos/{self.test_vehicle_id}",
            200,
            data=update_data
        )
        
        if success:
            print(f"   Vehicle owner changed: {response}")
        
        return success, response

    def test_new_client_creation(self):
        """Test creating a new client"""
        print("\n" + "="*60)
        print("TESTING NEW CLIENT CREATION")
        print("="*60)
        
        new_client_data = {
            "nombre": f"Test Client {datetime.now().strftime('%H%M%S')}",
            "telefono": "555-0123",
            "empresa": "Test Company Ltd",
            "email": "test@testcompany.com"
        }
        
        success, response = self.run_test(
            "Create New Client",
            "POST",
            "clientes",
            200,
            data=new_client_data
        )
        
        if success and isinstance(response, dict):
            print(f"   Created client ID: {response.get('id')}")
            return response
        return None

def main():
    print("🚗 ENHANCED VEHICLE EDITING FUNCTIONALITY TESTING")
    print("=" * 70)
    
    # Initialize tester
    tester = EnhancedVehicleEditTester()
    
    # Test 1: Retrieve vehicle data
    vehicle_data = tester.test_vehicle_retrieval()
    if not vehicle_data:
        print("❌ Cannot proceed - vehicle not found")
        return 1
    
    # Test 2: Retrieve client data
    cliente_id = vehicle_data.get("cliente_id")
    if not cliente_id:
        print("❌ Cannot proceed - no client ID in vehicle data")
        return 1
    
    client_data = tester.test_client_retrieval(cliente_id)
    if not client_data:
        print("❌ Cannot proceed - client not found")
        return 1
    
    # Test 3: Retrieve all clients for dropdown
    all_clients = tester.test_all_clients_retrieval()
    
    # Test 4: Update vehicle data
    vehicle_update_success, _ = tester.test_vehicle_update(vehicle_data)
    
    # Test 5: Update client data
    client_update_success, _ = tester.test_client_update(cliente_id, client_data)
    
    # Test 6: Create new client
    new_client = tester.test_new_client_creation()
    
    # Test 7: Change vehicle owner (if new client was created)
    owner_change_success = False
    if new_client and new_client.get('id'):
        owner_change_success, _ = tester.test_vehicle_owner_change(vehicle_data, new_client['id'])
    
    # Print final results
    print("\n" + "="*70)
    print("ENHANCED VEHICLE EDITING TEST RESULTS")
    print("="*70)
    
    test_results = [
        ("Vehicle Retrieval", vehicle_data is not None),
        ("Client Retrieval", client_data is not None),
        ("All Clients Retrieval", len(all_clients) > 0),
        ("Vehicle Update", vehicle_update_success),
        ("Client Update", client_update_success),
        ("New Client Creation", new_client is not None),
        ("Vehicle Owner Change", owner_change_success)
    ]
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<25} {status}")
    
    print(f"\n📊 Overall Results: {tester.tests_passed}/{tester.tests_run} API tests passed")
    
    passed_tests = sum(1 for _, result in test_results if result)
    total_tests = len(test_results)
    
    if passed_tests == total_tests:
        print("🎉 All enhanced vehicle editing tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check logs above")
        return 1

if __name__ == "__main__":
    sys.exit(main())