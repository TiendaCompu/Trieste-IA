import requests
import sys
import json
from datetime import datetime

class WorkshopAPITester:
    def __init__(self, base_url="https://workshop-ai.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'cliente': None,
            'vehiculo': None,
            'orden': None,
            'mecanico': None,
            'servicio': None
        }

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
                    if isinstance(response_data, dict) and 'id' in response_data:
                        print(f"   Created ID: {response_data['id']}")
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

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        print("\n" + "="*50)
        print("TESTING BASIC CONNECTIVITY")
        print("="*50)
        
        success, response = self.run_test(
            "Basic API Connection",
            "GET",
            "",
            200
        )
        return success

    def test_ai_extraction(self):
        """Test AI data extraction endpoint"""
        print("\n" + "="*50)
        print("TESTING AI INTEGRATION")
        print("="*50)
        
        # Test with sample vehicle dictation
        sample_text = "El vehículo Toyota Corolla 2020 color blanco con matrícula ABC123 tiene 50000 kilómetros, el cliente es Juan Pérez de la empresa Transportes Unidos, teléfono 123456789"
        
        success, response = self.run_test(
            "AI Data Extraction",
            "POST",
            "ai/extraer-datos",
            200,
            data={"texto_dictado": sample_text}
        )
        
        if success and isinstance(response, dict):
            if response.get('success'):
                print(f"   AI extracted data: {response.get('datos', {})}")
            else:
                print(f"   AI processing failed: {response.get('error', 'Unknown error')}")
        
        return success

    def test_cliente_operations(self):
        """Test client CRUD operations"""
        print("\n" + "="*50)
        print("TESTING CLIENT OPERATIONS")
        print("="*50)
        
        # Create client
        cliente_data = {
            "nombre": "Test Cliente",
            "telefono": "123456789",
            "empresa": "Test Company",
            "email": "test@example.com"
        }
        
        success, response = self.run_test(
            "Create Client",
            "POST",
            "clientes",
            200,
            data=cliente_data
        )
        
        if success and isinstance(response, dict):
            self.created_ids['cliente'] = response.get('id')
        
        # Get all clients
        success2, _ = self.run_test(
            "Get All Clients",
            "GET",
            "clientes",
            200
        )
        
        # Get specific client
        success3 = True
        if self.created_ids['cliente']:
            success3, _ = self.run_test(
                "Get Specific Client",
                "GET",
                f"clientes/{self.created_ids['cliente']}",
                200
            )
        
        return success and success2 and success3

    def test_vehiculo_operations(self):
        """Test vehicle CRUD operations"""
        print("\n" + "="*50)
        print("TESTING VEHICLE OPERATIONS")
        print("="*50)
        
        if not self.created_ids['cliente']:
            print("❌ Skipping vehicle tests - no client ID available")
            return False
        
        # Create vehicle
        vehiculo_data = {
            "matricula": "TEST123",
            "marca": "Toyota",
            "modelo": "Corolla",
            "año": 2020,
            "color": "Blanco",
            "kilometraje": 50000,
            "cliente_id": self.created_ids['cliente']
        }
        
        success, response = self.run_test(
            "Create Vehicle",
            "POST",
            "vehiculos",
            200,
            data=vehiculo_data
        )
        
        if success and isinstance(response, dict):
            self.created_ids['vehiculo'] = response.get('id')
        
        # Get all vehicles
        success2, _ = self.run_test(
            "Get All Vehicles",
            "GET",
            "vehiculos",
            200
        )
        
        # Get specific vehicle
        success3 = True
        if self.created_ids['vehiculo']:
            success3, _ = self.run_test(
                "Get Specific Vehicle",
                "GET",
                f"vehiculos/{self.created_ids['vehiculo']}",
                200
            )
        
        return success and success2 and success3

    def test_mecanico_operations(self):
        """Test comprehensive mechanic operations with new fields"""
        print("\n" + "="*50)
        print("TESTING MECHANIC OPERATIONS - COMPREHENSIVE")
        print("="*50)
        
        # Test 1: Create mechanic with all new fields (whatsapp, estado)
        mecanico_data = {
            "nombre": "Test Mechanic Backend",
            "especialidad": "motor",
            "telefono": "0414-555.12.34",
            "whatsapp": "0412-987.65.43",
            "estado": "disponible",
            "activo": True
        }
        
        print(f"📝 Creating mechanic with data: {json.dumps(mecanico_data, indent=2)}")
        success1, response1 = self.run_test(
            "POST /api/mecanicos - Create Mechanic with WhatsApp and Estado",
            "POST",
            "mecanicos",
            200,
            data=mecanico_data
        )
        
        if success1 and isinstance(response1, dict):
            self.created_ids['mecanico'] = response1.get('id')
            print(f"✅ Mechanic created successfully with ID: {self.created_ids['mecanico']}")
            
            # Verify all fields are present in response
            required_fields = ['id', 'nombre', 'especialidad', 'telefono', 'whatsapp', 'estado', 'activo', 'created_at']
            missing_fields = [field for field in required_fields if field not in response1]
            if missing_fields:
                print(f"⚠️  Missing fields in response: {missing_fields}")
            else:
                print("✅ All required fields present in response")
            
            # Verify field values
            if response1.get('whatsapp') == mecanico_data['whatsapp']:
                print("✅ WhatsApp field saved correctly")
            else:
                print(f"❌ WhatsApp field mismatch: expected {mecanico_data['whatsapp']}, got {response1.get('whatsapp')}")
            
            if response1.get('estado') == mecanico_data['estado']:
                print("✅ Estado field saved correctly")
            else:
                print(f"❌ Estado field mismatch: expected {mecanico_data['estado']}, got {response1.get('estado')}")
        
        # Test 2: Get all mechanics
        success2, response2 = self.run_test(
            "GET /api/mecanicos - Get All Mechanics",
            "GET",
            "mecanicos",
            200
        )
        
        if success2 and isinstance(response2, list):
            print(f"✅ Retrieved {len(response2)} mechanics")
            # Find our created mechanic in the list
            our_mechanic = next((m for m in response2 if m.get('id') == self.created_ids['mecanico']), None)
            if our_mechanic:
                print("✅ Created mechanic found in list")
                print(f"   Mechanic data: {json.dumps(our_mechanic, indent=2, default=str)}")
            else:
                print("❌ Created mechanic not found in list")
        
        # Test 3: Get active mechanics
        success3, response3 = self.run_test(
            "GET /api/mecanicos/activos - Get Active Mechanics",
            "GET",
            "mecanicos/activos",
            200
        )
        
        if success3 and isinstance(response3, list):
            print(f"✅ Retrieved {len(response3)} active mechanics")
            # Find our created mechanic in the active list
            our_active_mechanic = next((m for m in response3 if m.get('id') == self.created_ids['mecanico']), None)
            if our_active_mechanic:
                print("✅ Created mechanic found in active list")
            else:
                print("❌ Created mechanic not found in active list")
        
        # Test 4: Update mechanic including whatsapp and estado fields
        if self.created_ids['mecanico']:
            update_data = {
                "nombre": "Test Mechanic Backend Updated",
                "especialidad": "motor",
                "telefono": "0414-555.12.34",
                "whatsapp": "0412-987.65.43",
                "estado": "fuera_servicio",  # Change estado as requested
                "activo": True
            }
            
            print(f"📝 Updating mechanic with data: {json.dumps(update_data, indent=2)}")
            success4, response4 = self.run_test(
                "PUT /api/mecanicos/{id} - Update Mechanic with WhatsApp and Estado",
                "PUT",
                f"mecanicos/{self.created_ids['mecanico']}",
                200,
                data=update_data
            )
            
            if success4 and isinstance(response4, dict):
                print("✅ Mechanic updated successfully")
                
                # Verify updated fields
                if response4.get('nombre') == update_data['nombre']:
                    print("✅ Name updated correctly")
                else:
                    print(f"❌ Name update failed: expected {update_data['nombre']}, got {response4.get('nombre')}")
                
                if response4.get('whatsapp') == update_data['whatsapp']:
                    print("✅ WhatsApp field updated correctly")
                else:
                    print(f"❌ WhatsApp update failed: expected {update_data['whatsapp']}, got {response4.get('whatsapp')}")
                
                if response4.get('estado') == update_data['estado']:
                    print("✅ Estado field updated correctly to 'fuera_servicio'")
                else:
                    print(f"❌ Estado update failed: expected {update_data['estado']}, got {response4.get('estado')}")
                
                # Verify date format handling
                if 'created_at' in response4:
                    try:
                        created_at = response4['created_at']
                        if isinstance(created_at, str):
                            # Try to parse the date
                            datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                            print("✅ Date format handled correctly")
                        else:
                            print(f"✅ Date format: {type(created_at)} - {created_at}")
                    except Exception as e:
                        print(f"⚠️  Date format issue: {e}")
                
                print(f"📋 Updated mechanic data: {json.dumps(response4, indent=2, default=str)}")
            else:
                success4 = False
        else:
            success4 = False
            print("❌ Cannot test update - no mechanic ID available")
        
        # Test 5: Verify the mechanic is still in active list after estado change
        success5, response5 = self.run_test(
            "GET /api/mecanicos/activos - Verify Active Status After Estado Change",
            "GET",
            "mecanicos/activos",
            200
        )
        
        if success5 and isinstance(response5, list):
            our_updated_mechanic = next((m for m in response5 if m.get('id') == self.created_ids['mecanico']), None)
            if our_updated_mechanic:
                print("✅ Mechanic still appears in active list (activo=True maintained)")
                if our_updated_mechanic.get('estado') == 'fuera_servicio':
                    print("✅ Estado correctly shows 'fuera_servicio' in active list")
                else:
                    print(f"❌ Estado in active list: expected 'fuera_servicio', got {our_updated_mechanic.get('estado')}")
            else:
                print("❌ Updated mechanic not found in active list")
        
        # Summary
        all_tests_passed = success1 and success2 and success3 and success4 and success5
        
        print(f"\n📊 MECHANIC TESTS SUMMARY:")
        print(f"   ✅ Create with new fields: {'PASSED' if success1 else 'FAILED'}")
        print(f"   ✅ Get all mechanics: {'PASSED' if success2 else 'FAILED'}")
        print(f"   ✅ Get active mechanics: {'PASSED' if success3 else 'FAILED'}")
        print(f"   ✅ Update with new fields: {'PASSED' if success4 else 'FAILED'}")
        print(f"   ✅ Verify active status: {'PASSED' if success5 else 'FAILED'}")
        
        return all_tests_passed

    def test_servicio_operations(self):
        """Test service/parts operations"""
        print("\n" + "="*50)
        print("TESTING SERVICE/PARTS OPERATIONS")
        print("="*50)
        
        # Create service
        servicio_data = {
            "tipo": "servicio",
            "nombre": "Cambio de aceite",
            "descripcion": "Cambio de aceite y filtro",
            "precio": 50.0
        }
        
        success, response = self.run_test(
            "Create Service",
            "POST",
            "servicios-repuestos",
            200,
            data=servicio_data
        )
        
        if success and isinstance(response, dict):
            self.created_ids['servicio'] = response.get('id')
        
        # Get all services/parts
        success2, _ = self.run_test(
            "Get All Services/Parts",
            "GET",
            "servicios-repuestos",
            200
        )
        
        # Get by type
        success3, _ = self.run_test(
            "Get Services by Type",
            "GET",
            "servicios-repuestos/tipo/servicio",
            200
        )
        
        return success and success2 and success3

    def test_orden_operations(self):
        """Test work order operations"""
        print("\n" + "="*50)
        print("TESTING WORK ORDER OPERATIONS")
        print("="*50)
        
        if not self.created_ids['cliente'] or not self.created_ids['vehiculo']:
            print("❌ Skipping order tests - missing client or vehicle ID")
            return False
        
        # Create work order
        orden_data = {
            "vehiculo_id": self.created_ids['vehiculo'],
            "cliente_id": self.created_ids['cliente'],
            "diagnostico": "Test diagnosis",
            "observaciones": "Test observations"
        }
        
        success, response = self.run_test(
            "Create Work Order",
            "POST",
            "ordenes",
            200,
            data=orden_data
        )
        
        if success and isinstance(response, dict):
            self.created_ids['orden'] = response.get('id')
        
        # Get all orders
        success2, _ = self.run_test(
            "Get All Work Orders",
            "GET",
            "ordenes",
            200
        )
        
        # Get specific order
        success3 = True
        if self.created_ids['orden']:
            success3, _ = self.run_test(
                "Get Specific Work Order",
                "GET",
                f"ordenes/{self.created_ids['orden']}",
                200
            )
        
        # Update order
        success4 = True
        if self.created_ids['orden']:
            update_data = {
                "estado": "diagnosticando",
                "diagnostico": "Updated diagnosis"
            }
            success4, _ = self.run_test(
                "Update Work Order",
                "PUT",
                f"ordenes/{self.created_ids['orden']}",
                200,
                data=update_data
            )
        
        return success and success2 and success3 and success4

    def test_dashboard_operations(self):
        """Test dashboard statistics"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD OPERATIONS")
        print("="*50)
        
        success, response = self.run_test(
            "Get Dashboard Statistics",
            "GET",
            "dashboard/estadisticas",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   Statistics: {response}")
        
        # Test vehicle history
        success2 = True
        if self.created_ids['vehiculo']:
            success2, _ = self.run_test(
                "Get Vehicle History",
                "GET",
                f"vehiculos/{self.created_ids['vehiculo']}/historial",
                200
            )
        
        return success and success2

def main():
    print("🚗 WORKSHOP MANAGEMENT API TESTING")
    print("=" * 60)
    
    # Initialize tester
    tester = WorkshopAPITester()
    
    # Run all tests
    test_results = []
    
    # Basic connectivity
    test_results.append(("Basic Connectivity", tester.test_basic_connectivity()))
    
    # AI Integration
    test_results.append(("AI Integration", tester.test_ai_extraction()))
    
    # CRUD Operations
    test_results.append(("Client Operations", tester.test_cliente_operations()))
    test_results.append(("Vehicle Operations", tester.test_vehiculo_operations()))
    test_results.append(("Mechanic Operations", tester.test_mecanico_operations()))
    test_results.append(("Service Operations", tester.test_servicio_operations()))
    test_results.append(("Work Order Operations", tester.test_orden_operations()))
    
    # Dashboard
    test_results.append(("Dashboard Operations", tester.test_dashboard_operations()))
    
    # Print final results
    print("\n" + "="*60)
    print("FINAL TEST RESULTS")
    print("="*60)
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<25} {status}")
    
    print(f"\n📊 Overall Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check logs above")
        return 1

if __name__ == "__main__":
    sys.exit(main())