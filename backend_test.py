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
        """Test mechanic operations"""
        print("\n" + "="*50)
        print("TESTING MECHANIC OPERATIONS")
        print("="*50)
        
        # Create mechanic
        mecanico_data = {
            "nombre": "Test Mechanic",
            "especialidad": "motor",
            "telefono": "987654321",
            "activo": True
        }
        
        success, response = self.run_test(
            "Create Mechanic",
            "POST",
            "mecanicos",
            200,
            data=mecanico_data
        )
        
        if success and isinstance(response, dict):
            self.created_ids['mecanico'] = response.get('id')
        
        # Get all mechanics
        success2, _ = self.run_test(
            "Get All Mechanics",
            "GET",
            "mecanicos",
            200
        )
        
        # Get active mechanics
        success3, _ = self.run_test(
            "Get Active Mechanics",
            "GET",
            "mecanicos/activos",
            200
        )
        
        return success and success2 and success3

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