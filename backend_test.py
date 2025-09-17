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

    def test_historial_kilometraje(self):
        """Test NEW FUNCTIONALITY: Mileage history operations"""
        print("\n" + "="*50)
        print("TESTING NEW FUNCTIONALITY: HISTORIAL DE KILOMETRAJE")
        print("="*50)
        
        if not self.created_ids['vehiculo']:
            print("❌ Skipping mileage history tests - no vehicle ID available")
            return False
        
        # First, get current vehicle data to know current mileage
        success_get, vehicle_data = self.run_test(
            "Get Vehicle Current Data",
            "GET",
            f"vehiculos/{self.created_ids['vehiculo']}",
            200
        )
        
        if not success_get:
            print("❌ Cannot get vehicle data for mileage testing")
            return False
        
        current_km = vehicle_data.get('kilometraje', 50000)  # Default from creation
        new_km = current_km + 5000  # Add 5000 km
        
        print(f"📊 Current vehicle mileage: {current_km} km")
        print(f"📊 New mileage to set: {new_km} km")
        
        # Test 1: Update mileage with history (POST /api/vehiculos/{id}/actualizar-kilometraje)
        mileage_data = {
            "vehiculo_id": self.created_ids['vehiculo'],
            "kilometraje_nuevo": new_km,
            "observaciones": "Entrada para mantenimiento programado"
        }
        
        print(f"📝 Updating mileage with data: {json.dumps(mileage_data, indent=2)}")
        success1, response1 = self.run_test(
            "POST /api/vehiculos/{id}/actualizar-kilometraje - Update Mileage with History",
            "POST",
            f"vehiculos/{self.created_ids['vehiculo']}/actualizar-kilometraje",
            200,
            data=mileage_data
        )
        
        if success1 and isinstance(response1, dict):
            print("✅ Mileage updated successfully")
            
            # Verify response contains required fields
            required_fields = ['id', 'vehiculo_id', 'kilometraje_anterior', 'kilometraje_nuevo', 'fecha_actualizacion', 'observaciones']
            missing_fields = [field for field in required_fields if field not in response1]
            if missing_fields:
                print(f"⚠️  Missing fields in response: {missing_fields}")
            else:
                print("✅ All required fields present in mileage history response")
            
            # Verify values
            if response1.get('kilometraje_anterior') == current_km:
                print(f"✅ Previous mileage correctly recorded: {current_km}")
            else:
                print(f"❌ Previous mileage mismatch: expected {current_km}, got {response1.get('kilometraje_anterior')}")
            
            if response1.get('kilometraje_nuevo') == new_km:
                print(f"✅ New mileage correctly recorded: {new_km}")
            else:
                print(f"❌ New mileage mismatch: expected {new_km}, got {response1.get('kilometraje_nuevo')}")
            
            if response1.get('observaciones') == mileage_data['observaciones']:
                print("✅ Observations correctly saved")
            else:
                print(f"❌ Observations mismatch: expected '{mileage_data['observaciones']}', got '{response1.get('observaciones')}'")
        
        # Test 2: Get mileage history (GET /api/vehiculos/{id}/historial-kilometraje)
        success2, response2 = self.run_test(
            "GET /api/vehiculos/{id}/historial-kilometraje - Get Mileage History",
            "GET",
            f"vehiculos/{self.created_ids['vehiculo']}/historial-kilometraje",
            200
        )
        
        if success2 and isinstance(response2, list):
            print(f"✅ Retrieved mileage history with {len(response2)} entries")
            
            if len(response2) > 0:
                latest_entry = response2[0]  # Should be sorted by date desc
                print(f"📋 Latest history entry: {json.dumps(latest_entry, indent=2, default=str)}")
                
                # Verify the latest entry matches our update
                if latest_entry.get('kilometraje_nuevo') == new_km:
                    print("✅ Latest history entry matches our update")
                else:
                    print(f"❌ Latest history entry mismatch: expected {new_km}, got {latest_entry.get('kilometraje_nuevo')}")
            else:
                print("❌ No history entries found")
                success2 = False
        
        # Test 3: Validation - try to set lower mileage (should fail)
        invalid_km = current_km - 1000  # Lower than current
        invalid_data = {
            "vehiculo_id": self.created_ids['vehiculo'],
            "kilometraje_nuevo": invalid_km,
            "observaciones": "This should fail"
        }
        
        print(f"🚫 Testing validation with invalid mileage: {invalid_km} (should be < current {new_km})")
        success3, response3 = self.run_test(
            "POST /api/vehiculos/{id}/actualizar-kilometraje - Validation Test (Should Fail)",
            "POST",
            f"vehiculos/{self.created_ids['vehiculo']}/actualizar-kilometraje",
            400,  # Should return 400 Bad Request
            data=invalid_data
        )
        
        if success3:
            print("✅ Validation correctly rejected lower mileage")
            if isinstance(response3, dict) and 'detail' in response3:
                print(f"   Error message: {response3['detail']}")
        else:
            print("❌ Validation failed - lower mileage was accepted (this is wrong)")
        
        # Test 4: Verify vehicle mileage was actually updated
        success4, updated_vehicle = self.run_test(
            "GET /api/vehiculos/{id} - Verify Vehicle Mileage Updated",
            "GET",
            f"vehiculos/{self.created_ids['vehiculo']}",
            200
        )
        
        if success4 and isinstance(updated_vehicle, dict):
            if updated_vehicle.get('kilometraje') == new_km:
                print(f"✅ Vehicle mileage correctly updated to {new_km}")
            else:
                print(f"❌ Vehicle mileage not updated: expected {new_km}, got {updated_vehicle.get('kilometraje')}")
                success4 = False
        
        # Summary
        all_tests_passed = success1 and success2 and success3 and success4
        
        print(f"\n📊 MILEAGE HISTORY TESTS SUMMARY:")
        print(f"   ✅ Update mileage with history: {'PASSED' if success1 else 'FAILED'}")
        print(f"   ✅ Get mileage history: {'PASSED' if success2 else 'FAILED'}")
        print(f"   ✅ Validation (reject lower km): {'PASSED' if success3 else 'FAILED'}")
        print(f"   ✅ Vehicle mileage updated: {'PASSED' if success4 else 'FAILED'}")
        
        return all_tests_passed

    def test_busqueda_generalizada(self):
        """Test NEW FUNCTIONALITY: Generalized search"""
        print("\n" + "="*50)
        print("TESTING NEW FUNCTIONALITY: BÚSQUEDA GENERALIZADA")
        print("="*50)
        
        # Test 1: Search by license plate
        success1, response1 = self.run_test(
            "GET /api/buscar?q=TEST - Search by License Plate",
            "GET",
            "buscar?q=TEST",
            200
        )
        
        if success1 and isinstance(response1, dict):
            vehiculos = response1.get('vehiculos', [])
            clientes = response1.get('clientes', [])
            
            print(f"✅ Search by 'TEST' returned {len(vehiculos)} vehicles and {len(clientes)} clients")
            
            # Verify response structure
            if 'vehiculos' in response1 and 'clientes' in response1:
                print("✅ Response has correct structure (vehiculos and clientes)")
            else:
                print("❌ Response missing required fields (vehiculos, clientes)")
                success1 = False
            
            # Check if our test vehicle is found
            if any(v.get('matricula', '').startswith('TEST') for v in vehiculos):
                print("✅ Test vehicle found in search results")
            else:
                print("⚠️  Test vehicle not found in search results (may be expected if no TEST vehicles exist)")
        
        # Test 2: Search by client name
        success2, response2 = self.run_test(
            "GET /api/buscar?q=Fleet - Search by Client Name",
            "GET",
            "buscar?q=Fleet",
            200
        )
        
        if success2 and isinstance(response2, dict):
            vehiculos = response2.get('vehiculos', [])
            clientes = response2.get('clientes', [])
            
            print(f"✅ Search by 'Fleet' returned {len(vehiculos)} vehicles and {len(clientes)} clients")
            
            # Check if any clients match the search term
            matching_clients = [c for c in clientes if 'Fleet' in c.get('nombre', '') or 'Fleet' in c.get('empresa', '')]
            if matching_clients:
                print(f"✅ Found {len(matching_clients)} clients matching 'Fleet'")
            else:
                print("⚠️  No clients found matching 'Fleet' (may be expected)")
        
        # Test 3: Search by company name
        success3, response3 = self.run_test(
            "GET /api/buscar?q=Management - Search by Company Name",
            "GET",
            "buscar?q=Management",
            200
        )
        
        if success3 and isinstance(response3, dict):
            vehiculos = response3.get('vehiculos', [])
            clientes = response3.get('clientes', [])
            
            print(f"✅ Search by 'Management' returned {len(vehiculos)} vehicles and {len(clientes)} clients")
            
            # Check if any clients have matching company
            matching_companies = [c for c in clientes if 'Management' in c.get('empresa', '')]
            if matching_companies:
                print(f"✅ Found {len(matching_companies)} clients with company matching 'Management'")
            else:
                print("⚠️  No companies found matching 'Management' (may be expected)")
        
        # Test 4: Search with our test client
        if self.created_ids['cliente']:
            success4, response4 = self.run_test(
                "GET /api/buscar?q=Test - Search for Test Client",
                "GET",
                "buscar?q=Test",
                200
            )
            
            if success4 and isinstance(response4, dict):
                vehiculos = response4.get('vehiculos', [])
                clientes = response4.get('clientes', [])
                
                print(f"✅ Search by 'Test' returned {len(vehiculos)} vehicles and {len(clientes)} clients")
                
                # Check if our test client is found
                our_client_found = any(c.get('id') == self.created_ids['cliente'] for c in clientes)
                if our_client_found:
                    print("✅ Our test client found in search results")
                else:
                    print("❌ Our test client not found in search results")
                    success4 = False
                
                # Check if our test vehicle is found (should be included via client relationship)
                our_vehicle_found = any(v.get('id') == self.created_ids['vehiculo'] for v in vehiculos)
                if our_vehicle_found:
                    print("✅ Our test vehicle found in search results (via client relationship)")
                else:
                    print("⚠️  Our test vehicle not found in search results")
        else:
            success4 = True  # Skip if no test client
            print("⚠️  Skipping test client search - no test client available")
        
        # Test 5: Empty search (should return empty results)
        success5, response5 = self.run_test(
            "GET /api/buscar?q= - Empty Search",
            "GET",
            "buscar?q=",
            200
        )
        
        if success5 and isinstance(response5, dict):
            vehiculos = response5.get('vehiculos', [])
            clientes = response5.get('clientes', [])
            
            if len(vehiculos) == 0 and len(clientes) == 0:
                print("✅ Empty search correctly returned no results")
            else:
                print(f"⚠️  Empty search returned {len(vehiculos)} vehicles and {len(clientes)} clients")
        
        # Summary
        all_tests_passed = success1 and success2 and success3 and success4 and success5
        
        print(f"\n📊 GENERALIZED SEARCH TESTS SUMMARY:")
        print(f"   ✅ Search by license plate: {'PASSED' if success1 else 'FAILED'}")
        print(f"   ✅ Search by client name: {'PASSED' if success2 else 'FAILED'}")
        print(f"   ✅ Search by company name: {'PASSED' if success3 else 'FAILED'}")
        print(f"   ✅ Search test client: {'PASSED' if success4 else 'FAILED'}")
        print(f"   ✅ Empty search handling: {'PASSED' if success5 else 'FAILED'}")
        
        return all_tests_passed

    def test_filtrado_ordenes(self):
        """Test NEW FUNCTIONALITY: Order filtering"""
        print("\n" + "="*50)
        print("TESTING NEW FUNCTIONALITY: FILTRADO DE ÓRDENES")
        print("="*50)
        
        # First, create some test orders with different states
        if not self.created_ids['cliente'] or not self.created_ids['vehiculo']:
            print("❌ Skipping order filtering tests - missing client or vehicle ID")
            return False
        
        # Create additional orders with different states for testing
        test_orders = []
        
        # Order 1: Active order (recibido)
        orden1_data = {
            "vehiculo_id": self.created_ids['vehiculo'],
            "cliente_id": self.created_ids['cliente'],
            "diagnostico": "Test active order",
            "observaciones": "Active order for filtering test"
        }
        
        success_create1, response_create1 = self.run_test(
            "Create Active Test Order",
            "POST",
            "ordenes",
            200,
            data=orden1_data
        )
        
        if success_create1 and isinstance(response_create1, dict):
            test_orders.append(response_create1.get('id'))
        
        # Order 2: Update one to delivered state
        if test_orders:
            update_data = {"estado": "entregado"}
            success_update, _ = self.run_test(
                "Update Order to Delivered",
                "PUT",
                f"ordenes/{test_orders[0]}",
                200,
                data=update_data
            )
        
        # Test 1: Get active orders (filtro=activas)
        success1, response1 = self.run_test(
            "GET /api/ordenes?filtro=activas - Get Active Orders Only",
            "GET",
            "ordenes?filtro=activas",
            200
        )
        
        if success1 and isinstance(response1, list):
            print(f"✅ Active orders filter returned {len(response1)} orders")
            
            # Verify all returned orders are NOT delivered
            non_delivered_count = sum(1 for order in response1 if order.get('estado') != 'entregado')
            if non_delivered_count == len(response1):
                print("✅ All active orders are non-delivered (correct filtering)")
            else:
                print(f"❌ Found {len(response1) - non_delivered_count} delivered orders in active filter")
                success1 = False
            
            # Show states of active orders
            estados_activos = [order.get('estado') for order in response1]
            print(f"   Active order states: {set(estados_activos)}")
        
        # Test 2: Get delivered orders (filtro=entregadas)
        success2, response2 = self.run_test(
            "GET /api/ordenes?filtro=entregadas - Get Delivered Orders Only",
            "GET",
            "ordenes?filtro=entregadas",
            200
        )
        
        if success2 and isinstance(response2, list):
            print(f"✅ Delivered orders filter returned {len(response2)} orders")
            
            # Verify all returned orders are delivered
            delivered_count = sum(1 for order in response2 if order.get('estado') == 'entregado')
            if delivered_count == len(response2):
                print("✅ All returned orders are delivered (correct filtering)")
            else:
                print(f"❌ Found {len(response2) - delivered_count} non-delivered orders in delivered filter")
                success2 = False
            
            # Show states of delivered orders
            estados_entregados = [order.get('estado') for order in response2]
            print(f"   Delivered order states: {set(estados_entregados)}")
        
        # Test 3: Get all orders (filtro=todas)
        success3, response3 = self.run_test(
            "GET /api/ordenes?filtro=todas - Get All Orders",
            "GET",
            "ordenes?filtro=todas",
            200
        )
        
        if success3 and isinstance(response3, list):
            print(f"✅ All orders filter returned {len(response3)} orders")
            
            # Verify we get both active and delivered orders
            active_in_all = sum(1 for order in response3 if order.get('estado') != 'entregado')
            delivered_in_all = sum(1 for order in response3 if order.get('estado') == 'entregado')
            
            print(f"   Active orders in 'all': {active_in_all}")
            print(f"   Delivered orders in 'all': {delivered_in_all}")
            
            # Verify counts match individual filters
            if len(response1) == active_in_all and len(response2) == delivered_in_all:
                print("✅ Order counts match between individual filters and 'all' filter")
            else:
                print(f"❌ Count mismatch: active filter={len(response1)}, delivered filter={len(response2)}, all active={active_in_all}, all delivered={delivered_in_all}")
                success3 = False
        
        # Test 4: Get orders without filter (should return all)
        success4, response4 = self.run_test(
            "GET /api/ordenes - Get Orders Without Filter",
            "GET",
            "ordenes",
            200
        )
        
        if success4 and isinstance(response4, list):
            print(f"✅ Orders without filter returned {len(response4)} orders")
            
            # Should be same as filtro=todas
            if len(response4) == len(response3):
                print("✅ No filter returns same count as 'todas' filter")
            else:
                print(f"❌ Count mismatch: no filter={len(response4)}, todas filter={len(response3)}")
                success4 = False
        
        # Test 5: Verify filter parameter validation
        success5, response5 = self.run_test(
            "GET /api/ordenes?filtro=invalid - Invalid Filter Parameter",
            "GET",
            "ordenes?filtro=invalid",
            200  # Should still return 200 but treat as no filter
        )
        
        if success5 and isinstance(response5, list):
            print(f"✅ Invalid filter parameter handled gracefully, returned {len(response5)} orders")
            
            # Should return all orders (same as no filter)
            if len(response5) == len(response4):
                print("✅ Invalid filter treated as no filter (correct behavior)")
            else:
                print(f"❌ Invalid filter behavior unexpected: got {len(response5)}, expected {len(response4)}")
                success5 = False
        
        # Summary
        all_tests_passed = success1 and success2 and success3 and success4 and success5
        
        print(f"\n📊 ORDER FILTERING TESTS SUMMARY:")
        print(f"   ✅ Active orders filter: {'PASSED' if success1 else 'FAILED'}")
        print(f"   ✅ Delivered orders filter: {'PASSED' if success2 else 'FAILED'}")
        print(f"   ✅ All orders filter: {'PASSED' if success3 else 'FAILED'}")
        print(f"   ✅ No filter (default): {'PASSED' if success4 else 'FAILED'}")
        print(f"   ✅ Invalid filter handling: {'PASSED' if success5 else 'FAILED'}")
        
        return all_tests_passed

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