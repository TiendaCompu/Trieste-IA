import requests
import sys
import json
import time
from datetime import datetime

class WorkshopAPITester:
    def __init__(self, base_url="https://workshop-ai-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.diagnostic_results = []
        self.created_ids = {
            'cliente': None,
            'vehiculo': None,
            'orden': None,
            'mecanico': None,
            'servicio': None
        }

    def run_diagnostic_test(self, name, method, endpoint, data=None, headers=None):
        """Run a diagnostic test and record detailed results"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.base_url
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        print(f"\n🔍 DIAGNÓSTICO: {name}")
        print(f"   URL: {url}")
        
        start_time = time.time()
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            response_time = round((time.time() - start_time) * 1000, 2)  # ms
            
            # Determine status
            if response.status_code == 200:
                status = "✅ Funciona"
            elif response.status_code in [400, 404, 422]:
                status = "⚠️ Error de datos/lógica"
            else:
                status = "❌ Error"
            
            # Try to get response data
            try:
                response_data = response.json()
                data_structure = self._analyze_data_structure(response_data)
            except:
                response_data = response.text
                data_structure = "Texto plano"
            
            # Record diagnostic result
            diagnostic_result = {
                'endpoint': endpoint or '/',
                'name': name,
                'status': status,
                'http_code': response.status_code,
                'response_time_ms': response_time,
                'data_structure': data_structure,
                'response_data': response_data,
                'error_message': None
            }
            
            if response.status_code != 200:
                try:
                    error_detail = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                    diagnostic_result['error_message'] = error_detail
                except:
                    diagnostic_result['error_message'] = response.text
            
            self.diagnostic_results.append(diagnostic_result)
            
            # Print results
            print(f"   Estado: {status}")
            print(f"   Código HTTP: {response.status_code}")
            print(f"   Tiempo de respuesta: {response_time}ms")
            print(f"   Estructura de datos: {data_structure}")
            
            if response.status_code != 200:
                print(f"   Error específico: {diagnostic_result['error_message']}")
            elif isinstance(response_data, list):
                print(f"   Cantidad de registros: {len(response_data)}")
            elif isinstance(response_data, dict) and 'message' in response_data:
                print(f"   Mensaje: {response_data['message']}")
            
            return response.status_code == 200, response_data

        except requests.exceptions.Timeout:
            diagnostic_result = {
                'endpoint': endpoint or '/',
                'name': name,
                'status': "❌ Error",
                'http_code': 'TIMEOUT',
                'response_time_ms': 10000,
                'data_structure': 'N/A',
                'response_data': None,
                'error_message': 'Request timeout'
            }
            self.diagnostic_results.append(diagnostic_result)
            print(f"   Estado: ❌ Error")
            print(f"   Error específico: Request timeout")
            return False, {}
            
        except Exception as e:
            diagnostic_result = {
                'endpoint': endpoint or '/',
                'name': name,
                'status': "❌ Error",
                'http_code': 'CONNECTION_ERROR',
                'response_time_ms': 0,
                'data_structure': 'N/A',
                'response_data': None,
                'error_message': str(e)
            }
            self.diagnostic_results.append(diagnostic_result)
            print(f"   Estado: ❌ Error")
            print(f"   Error específico: {str(e)}")
            return False, {}

    def _analyze_data_structure(self, data):
        """Analyze the structure of response data"""
        if isinstance(data, list):
            if len(data) == 0:
                return "Array vacío"
            elif len(data) == 1:
                return f"Array con 1 elemento ({type(data[0]).__name__})"
            else:
                return f"Array con {len(data)} elementos ({type(data[0]).__name__})"
        elif isinstance(data, dict):
            keys = list(data.keys())
            if len(keys) <= 3:
                return f"Objeto con campos: {', '.join(keys)}"
            else:
                return f"Objeto con {len(keys)} campos"
        elif isinstance(data, str):
            return "String"
        elif isinstance(data, (int, float)):
            return "Número"
        else:
            return type(data).__name__

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

    def diagnostic_basic_connectivity(self):
        """DIAGNÓSTICO: Conectividad básica del backend"""
        print("\n" + "="*60)
        print("1. CONECTIVIDAD BÁSICA")
        print("="*60)
        
        # Test 1: GET / - Basic backend connectivity
        success1, _ = self.run_diagnostic_test(
            "Conectividad básica del backend",
            "GET",
            None  # This will use base_url directly
        )
        
        # Test 2: GET /api/ - API router test
        success2, _ = self.run_diagnostic_test(
            "Router API",
            "GET",
            ""
        )
        
        return success1 and success2

    def diagnostic_database_endpoints(self):
        """DIAGNÓSTICO: Endpoints de base de datos"""
        print("\n" + "="*60)
        print("2. BASE DE DATOS")
        print("="*60)
        
        # Test all main database endpoints
        endpoints = [
            ("vehiculos", "Vehículos"),
            ("clientes", "Clientes"),
            ("ordenes", "Órdenes de trabajo"),
            ("mecanicos", "Mecánicos")
        ]
        
        results = []
        for endpoint, name in endpoints:
            success, response = self.run_diagnostic_test(
                f"Endpoint {name}",
                "GET",
                endpoint
            )
            results.append(success)
        
        return all(results)

    def diagnostic_critical_functionalities(self):
        """DIAGNÓSTICO: Funcionalidades críticas"""
        print("\n" + "="*60)
        print("3. FUNCIONALIDADES CRÍTICAS")
        print("="*60)
        
        # Test 1: Vehicle license plate verification
        success1, response1 = self.run_diagnostic_test(
            "Verificación de matrícula existente",
            "GET",
            "vehiculos/verificar-matricula/ABC123"
        )
        
        # Test 2: General search functionality
        success2, response2 = self.run_diagnostic_test(
            "Búsqueda generalizada",
            "GET",
            "buscar?q=ABC"
        )
        
        # Test 3: Exchange rate system
        success3, response3 = self.run_diagnostic_test(
            "Sistema de tasa de cambio",
            "GET",
            "tasa-cambio/actual"
        )
        
        return success1 and success2 and success3

    def diagnostic_new_endpoints(self):
        """DIAGNÓSTICO: Endpoints nuevos"""
        print("\n" + "="*60)
        print("4. ENDPOINTS NUEVOS")
        print("="*60)
        
        # First, try to find an existing vehicle ID for testing
        success_vehicles, vehicles_data = self.run_diagnostic_test(
            "Obtener vehículos para testing",
            "GET",
            "vehiculos"
        )
        
        vehicle_id = None
        if success_vehicles and isinstance(vehicles_data, list) and len(vehicles_data) > 0:
            vehicle_id = vehicles_data[0].get('id')
            print(f"   Usando vehículo ID: {vehicle_id}")
        
        results = []
        
        # Test 1: Mileage history endpoint
        if vehicle_id:
            success1, _ = self.run_diagnostic_test(
                "Historial de kilometraje",
                "GET",
                f"vehiculos/{vehicle_id}/historial-kilometraje"
            )
        else:
            print("\n🔍 DIAGNÓSTICO: Historial de kilometraje")
            print("   Estado: ⚠️ No se puede probar - Sin vehículos en BD")
            success1 = False
        
        results.append(success1)
        
        # Test 2: Order filtering
        success2, _ = self.run_diagnostic_test(
            "Filtrado de órdenes activas",
            "GET",
            "ordenes?filtro=activas"
        )
        results.append(success2)
        
        return all(results)

    def print_diagnostic_summary(self):
        """Imprime resumen completo del diagnóstico"""
        print("\n" + "="*80)
        print("RESUMEN COMPLETO DEL DIAGNÓSTICO")
        print("="*80)
        
        # Group results by category
        categories = {
            "CONECTIVIDAD BÁSICA": [],
            "BASE DE DATOS": [],
            "FUNCIONALIDADES CRÍTICAS": [],
            "ENDPOINTS NUEVOS": []
        }
        
        # Categorize results
        for result in self.diagnostic_results:
            endpoint = result['endpoint']
            if endpoint in ['/', '']:
                categories["CONECTIVIDAD BÁSICA"].append(result)
            elif endpoint in ['vehiculos', 'clientes', 'ordenes', 'mecanicos']:
                categories["BASE DE DATOS"].append(result)
            elif 'verificar-matricula' in endpoint or 'buscar' in endpoint or 'tasa-cambio' in endpoint:
                categories["FUNCIONALIDADES CRÍTICAS"].append(result)
            else:
                categories["ENDPOINTS NUEVOS"].append(result)
        
        # Print categorized results
        for category, results in categories.items():
            if results:
                print(f"\n📋 {category}:")
                for result in results:
                    print(f"   {result['status']} {result['name']}")
                    print(f"      └─ HTTP {result['http_code']} | {result['response_time_ms']}ms | {result['data_structure']}")
                    if result['error_message']:
                        error_msg = str(result['error_message'])[:100] + "..." if len(str(result['error_message'])) > 100 else str(result['error_message'])
                        print(f"      └─ Error: {error_msg}")
        
        # Overall statistics
        total_tests = len(self.diagnostic_results)
        passed_tests = len([r for r in self.diagnostic_results if r['status'] == "✅ Funciona"])
        warning_tests = len([r for r in self.diagnostic_results if r['status'] == "⚠️ Error de datos/lógica"])
        failed_tests = len([r for r in self.diagnostic_results if r['status'] == "❌ Error"])
        
        print(f"\n📊 ESTADÍSTICAS GENERALES:")
        print(f"   Total de pruebas: {total_tests}")
        print(f"   ✅ Funcionando: {passed_tests}")
        print(f"   ⚠️ Problemas de datos/lógica: {warning_tests}")
        print(f"   ❌ Errores críticos: {failed_tests}")
        
        # Average response time
        response_times = [r['response_time_ms'] for r in self.diagnostic_results if isinstance(r['response_time_ms'], (int, float))]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            print(f"   ⏱️ Tiempo promedio de respuesta: {avg_response_time:.2f}ms")
        
        # Critical issues summary
        critical_issues = [r for r in self.diagnostic_results if r['status'] == "❌ Error"]
        if critical_issues:
            print(f"\n🚨 PROBLEMAS CRÍTICOS ENCONTRADOS:")
            for issue in critical_issues:
                print(f"   • {issue['name']}: {issue['error_message']}")
        
        # Data issues summary
        data_issues = [r for r in self.diagnostic_results if r['status'] == "⚠️ Error de datos/lógica"]
        if data_issues:
            print(f"\n⚠️ PROBLEMAS DE DATOS/LÓGICA:")
            for issue in data_issues:
                print(f"   • {issue['name']}: HTTP {issue['http_code']}")

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
        
        # Create vehicle with unique license plate (alphanumeric only)
        import time
        unique_suffix = str(int(time.time()))[-3:]  # Last 3 digits of timestamp
        vehiculo_data = {
            "matricula": f"TST{unique_suffix}",  # 6 characters, alphanumeric only
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

    def test_ai_dictado_orden(self):
        """Test NEW FUNCTIONALITY: AI dictation processing for work orders"""
        print("\n" + "="*50)
        print("TESTING NEW FUNCTIONALITY: AI DICTADO PARA ÓRDENES")
        print("="*50)
        
        # Test data from the review request
        sample_dictation = "Se detectaron fallas en el sistema de frenos, las pastillas están desgastadas y el disco rayado. El diagnóstico indica problema eléctrico en el ABS. Se realizó cambio de pastillas y rectificado de disco. Se utilizaron pastillas Bosch referencia BR-2023 cantidad dos unidades"
        
        # Test 1: Process dictation with AI for work orders
        dictation_data = {
            "texto": sample_dictation
        }
        
        print(f"📝 Processing dictation with AI:")
        print(f"   Text: {sample_dictation[:100]}...")
        
        success1, response1 = self.run_test(
            "POST /api/ai/procesar-dictado-orden - Process Work Order Dictation with AI",
            "POST",
            "ai/procesar-dictado-orden",
            200,
            data=dictation_data
        )
        
        if success1 and isinstance(response1, dict):
            print("✅ AI dictation processing completed")
            
            # Verify response structure
            if response1.get('success'):
                print("✅ AI processing was successful")
                
                # Check for required fields in response
                required_response_fields = ['success', 'datos', 'texto_original', 'respuesta_ia']
                missing_response_fields = [field for field in required_response_fields if field not in response1]
                if missing_response_fields:
                    print(f"⚠️  Missing response fields: {missing_response_fields}")
                else:
                    print("✅ All required response fields present")
                
                # Check extracted data structure
                datos = response1.get('datos', {})
                if isinstance(datos, dict):
                    print("✅ Extracted data is a dictionary")
                    
                    # Verify required fields in extracted data
                    required_data_fields = ['fallas_detectadas', 'diagnostico_mecanico', 'reparaciones_realizadas', 'repuestos_utilizados', 'observaciones']
                    missing_data_fields = [field for field in required_data_fields if field not in datos]
                    
                    if missing_data_fields:
                        print(f"❌ Missing required data fields: {missing_data_fields}")
                        success1 = False
                    else:
                        print("✅ All required data fields present in AI extraction")
                        
                        # Verify field content quality
                        print(f"\n📋 EXTRACTED DATA ANALYSIS:")
                        for field in required_data_fields:
                            value = datos.get(field, '')
                            if value and isinstance(value, str) and len(value.strip()) > 0:
                                print(f"   ✅ {field}: {value[:80]}{'...' if len(value) > 80 else ''}")
                            else:
                                print(f"   ⚠️  {field}: Empty or invalid")
                        
                        # Verify AI correctly extracted brake system information
                        fallas = datos.get('fallas_detectadas', '').lower()
                        if 'frenos' in fallas or 'pastillas' in fallas or 'disco' in fallas:
                            print("✅ AI correctly identified brake system issues")
                        else:
                            print("⚠️  AI may not have correctly identified brake system issues")
                        
                        # Verify AI extracted diagnostic information
                        diagnostico = datos.get('diagnostico_mecanico', '').lower()
                        if 'abs' in diagnostico or 'eléctrico' in diagnostico:
                            print("✅ AI correctly identified ABS electrical diagnostic")
                        else:
                            print("⚠️  AI may not have correctly identified ABS diagnostic")
                        
                        # Verify AI extracted repair information
                        reparaciones = datos.get('reparaciones_realizadas', '').lower()
                        if 'cambio' in reparaciones and 'pastillas' in reparaciones:
                            print("✅ AI correctly identified brake pad replacement")
                        else:
                            print("⚠️  AI may not have correctly identified repairs")
                        
                        # Verify AI extracted parts information
                        repuestos = datos.get('repuestos_utilizados', '').lower()
                        if 'bosch' in repuestos and 'br-2023' in repuestos:
                            print("✅ AI correctly identified Bosch parts with reference")
                        else:
                            print("⚠️  AI may not have correctly identified parts details")
                
                else:
                    print("❌ Extracted data is not a dictionary")
                    success1 = False
                    
                # Verify original text is preserved
                if response1.get('texto_original') == sample_dictation:
                    print("✅ Original text correctly preserved")
                else:
                    print("❌ Original text not preserved correctly")
                    success1 = False
                    
            else:
                print(f"❌ AI processing failed: {response1.get('error', 'Unknown error')}")
                success1 = False
        
        # Test 2: Test with empty text (should fail gracefully)
        empty_data = {"texto": ""}
        
        success2, response2 = self.run_test(
            "POST /api/ai/procesar-dictado-orden - Empty Text Validation",
            "POST",
            "ai/procesar-dictado-orden",
            200,  # Should return 200 but with success: false
            data=empty_data
        )
        
        if success2 and isinstance(response2, dict):
            if not response2.get('success'):
                print("✅ Empty text correctly rejected")
                if 'error' in response2:
                    print(f"   Error message: {response2['error']}")
            else:
                print("❌ Empty text was incorrectly accepted")
                success2 = False
        
        # Test 3: Test with missing texto field
        invalid_data = {"invalid_field": "test"}
        
        success3, response3 = self.run_test(
            "POST /api/ai/procesar-dictado-orden - Missing Field Validation",
            "POST",
            "ai/procesar-dictado-orden",
            200,  # Should return 200 but with success: false
            data=invalid_data
        )
        
        if success3 and isinstance(response3, dict):
            if not response3.get('success'):
                print("✅ Missing field correctly handled")
                if 'error' in response3:
                    print(f"   Error message: {response3['error']}")
            else:
                print("❌ Missing field was incorrectly accepted")
                success3 = False
        
        # Test 4: Test with different types of work order content
        complex_dictation = "Vehículo presenta ruido extraño en motor, posible problema en correa de distribución. Se realizó inspección completa del sistema de transmisión. Diagnóstico indica necesidad de cambio de aceite y filtros. Se utilizaron filtros Mann W712/75 y aceite Mobil 1 5W-30, cantidad 4 litros. Recomendación: revisión en 5000 km."
        
        complex_data = {"texto": complex_dictation}
        
        success4, response4 = self.run_test(
            "POST /api/ai/procesar-dictado-orden - Complex Dictation Processing",
            "POST",
            "ai/procesar-dictado-orden",
            200,
            data=complex_data
        )
        
        if success4 and isinstance(response4, dict):
            if response4.get('success'):
                print("✅ Complex dictation processed successfully")
                
                datos_complex = response4.get('datos', {})
                if isinstance(datos_complex, dict):
                    # Check if AI extracted engine-related information
                    fallas_complex = datos_complex.get('fallas_detectadas', '').lower()
                    if 'motor' in fallas_complex or 'ruido' in fallas_complex:
                        print("✅ AI correctly identified engine issues in complex text")
                    else:
                        print("⚠️  AI may not have identified engine issues in complex text")
                    
                    # Check if AI extracted oil change information
                    reparaciones_complex = datos_complex.get('reparaciones_realizadas', '').lower()
                    if 'aceite' in reparaciones_complex:
                        print("✅ AI correctly identified oil change in complex text")
                    else:
                        print("⚠️  AI may not have identified oil change in complex text")
            else:
                print(f"❌ Complex dictation processing failed: {response4.get('error', 'Unknown error')}")
                success4 = False
        
        # Summary
        all_tests_passed = success1 and success2 and success3 and success4
        
        print(f"\n📊 AI DICTATION FOR WORK ORDERS TESTS SUMMARY:")
        print(f"   ✅ Process brake system dictation: {'PASSED' if success1 else 'FAILED'}")
        print(f"   ✅ Empty text validation: {'PASSED' if success2 else 'FAILED'}")
        print(f"   ✅ Missing field validation: {'PASSED' if success3 else 'FAILED'}")
        print(f"   ✅ Complex dictation processing: {'PASSED' if success4 else 'FAILED'}")
        
        return all_tests_passed

    def test_orden_trabajo_update_model(self):
        """Test NEW FUNCTIONALITY: OrdenTrabajoUpdate model with new fields"""
        print("\n" + "="*50)
        print("TESTING NEW FUNCTIONALITY: MODELO ORDEN TRABAJO UPDATE")
        print("="*50)
        
        if not self.created_ids['orden']:
            print("❌ Skipping OrdenTrabajoUpdate tests - no work order ID available")
            return False
        
        # Test 1: Update work order with new fields (fallas, reparaciones_realizadas, repuestos_utilizados)
        update_data = {
            "diagnostico": "Diagnóstico actualizado con IA",
            "fallas": "SISTEMA DE FRENOS: Pastillas desgastadas, disco rayado",
            "reparaciones_realizadas": "Cambio de pastillas de freno, rectificado de disco",
            "repuestos_utilizados": "Pastillas Bosch BR-2023 (2 unidades), Disco de freno Brembo (1 unidad)",
            "observaciones": "Trabajo completado satisfactoriamente, próxima revisión en 10,000 km",
            "estado": "en_reparacion"
        }
        
        print(f"📝 Updating work order with new fields:")
        for key, value in update_data.items():
            print(f"   {key}: {value[:60]}{'...' if len(str(value)) > 60 else ''}")
        
        success1, response1 = self.run_test(
            "PUT /api/ordenes/{id} - Update Work Order with New Fields",
            "PUT",
            f"ordenes/{self.created_ids['orden']}",
            200,
            data=update_data
        )
        
        if success1 and isinstance(response1, dict):
            print("✅ Work order updated successfully")
            
            # Verify all new fields are present in response
            new_fields = ['fallas', 'reparaciones_realizadas', 'repuestos_utilizados']
            missing_fields = [field for field in new_fields if field not in response1]
            if missing_fields:
                print(f"❌ Missing new fields in response: {missing_fields}")
                success1 = False
            else:
                print("✅ All new fields present in response")
                
                # Verify field values
                for field in new_fields:
                    expected_value = update_data[field]
                    actual_value = response1.get(field)
                    if actual_value == expected_value:
                        print(f"✅ {field}: Correctly saved")
                    else:
                        print(f"❌ {field}: Value mismatch")
                        print(f"   Expected: {expected_value}")
                        print(f"   Got: {actual_value}")
                        success1 = False
                
                # Verify traditional fields still work
                if response1.get('diagnostico') == update_data['diagnostico']:
                    print("✅ Traditional diagnostico field still works")
                else:
                    print("❌ Traditional diagnostico field not working")
                    success1 = False
                
                if response1.get('estado') == update_data['estado']:
                    print("✅ Estado field updated correctly")
                else:
                    print("❌ Estado field not updated correctly")
                    success1 = False
        
        # Test 2: Retrieve updated work order to verify persistence
        success2, response2 = self.run_test(
            "GET /api/ordenes/{id} - Verify Updated Work Order Persistence",
            "GET",
            f"ordenes/{self.created_ids['orden']}",
            200
        )
        
        if success2 and isinstance(response2, dict):
            print("✅ Updated work order retrieved successfully")
            
            # Verify new fields are persisted
            new_fields = ['fallas', 'reparaciones_realizadas', 'repuestos_utilizados']
            for field in new_fields:
                expected_value = update_data[field]
                actual_value = response2.get(field)
                if actual_value == expected_value:
                    print(f"✅ {field}: Correctly persisted in database")
                else:
                    print(f"❌ {field}: Not persisted correctly")
                    success2 = False
        
        # Test 3: Test partial updates (only some new fields)
        partial_update_data = {
            "fallas": "ACTUALIZACIÓN: Sistema eléctrico también presenta fallas",
            "observaciones": "Observaciones actualizadas parcialmente"
        }
        
        success3, response3 = self.run_test(
            "PUT /api/ordenes/{id} - Partial Update with New Fields",
            "PUT",
            f"ordenes/{self.created_ids['orden']}",
            200,
            data=partial_update_data
        )
        
        if success3 and isinstance(response3, dict):
            print("✅ Partial update completed successfully")
            
            # Verify updated fields
            if response3.get('fallas') == partial_update_data['fallas']:
                print("✅ Fallas field updated in partial update")
            else:
                print("❌ Fallas field not updated in partial update")
                success3 = False
            
            # Verify non-updated fields remain unchanged
            if response3.get('reparaciones_realizadas') == update_data['reparaciones_realizadas']:
                print("✅ Non-updated fields preserved in partial update")
            else:
                print("❌ Non-updated fields not preserved in partial update")
                success3 = False
        
        # Test 4: Test with null/empty values for new fields
        null_update_data = {
            "fallas": None,
            "reparaciones_realizadas": "",
            "repuestos_utilizados": None
        }
        
        success4, response4 = self.run_test(
            "PUT /api/ordenes/{id} - Update with Null/Empty New Fields",
            "PUT",
            f"ordenes/{self.created_ids['orden']}",
            200,
            data=null_update_data
        )
        
        if success4 and isinstance(response4, dict):
            print("✅ Null/empty values handled correctly")
            
            # Verify null values are handled properly
            if response4.get('fallas') is None:
                print("✅ Null fallas value handled correctly")
            else:
                print(f"⚠️  Null fallas became: {response4.get('fallas')}")
            
            if response4.get('reparaciones_realizadas') == "":
                print("✅ Empty reparaciones_realizadas handled correctly")
            else:
                print(f"⚠️  Empty reparaciones_realizadas became: {response4.get('reparaciones_realizadas')}")
        
        # Summary
        all_tests_passed = success1 and success2 and success3 and success4
        
        print(f"\n📊 ORDEN TRABAJO UPDATE MODEL TESTS SUMMARY:")
        print(f"   ✅ Update with new fields: {'PASSED' if success1 else 'FAILED'}")
        print(f"   ✅ Verify persistence: {'PASSED' if success2 else 'FAILED'}")
        print(f"   ✅ Partial updates: {'PASSED' if success3 else 'FAILED'}")
        print(f"   ✅ Null/empty values: {'PASSED' if success4 else 'FAILED'}")
        
        return all_tests_passed

        return all_tests_passed

def main():
    print("🚗 DIAGNÓSTICO COMPLETO DEL SISTEMA BACKEND")
    print("=" * 80)
    print("OBJETIVO: Identificar TODOS los errores sin hacer correcciones")
    print("=" * 80)
    
    # Initialize tester
    tester = WorkshopAPITester()
    
    # Run comprehensive diagnostic
    print(f"\n🔗 BACKEND URL: {tester.base_url}")
    print(f"🔗 API URL: {tester.api_url}")
    
    # 1. CONECTIVIDAD BÁSICA
    connectivity_ok = tester.diagnostic_basic_connectivity()
    
    # 2. BASE DE DATOS
    database_ok = tester.diagnostic_database_endpoints()
    
    # 3. FUNCIONALIDADES CRÍTICAS
    critical_ok = tester.diagnostic_critical_functionalities()
    
    # 4. ENDPOINTS NUEVOS
    new_endpoints_ok = tester.diagnostic_new_endpoints()
    
    # Print comprehensive summary
    tester.print_diagnostic_summary()
    
    # Final diagnostic conclusion
    print("\n" + "="*80)
    print("CONCLUSIÓN DEL DIAGNÓSTICO")
    print("="*80)
    
    total_categories = 4
    passed_categories = sum([connectivity_ok, database_ok, critical_ok, new_endpoints_ok])
    
    print(f"📊 Categorías evaluadas: {passed_categories}/{total_categories}")
    print(f"   ✅ Conectividad básica: {'OK' if connectivity_ok else 'PROBLEMAS'}")
    print(f"   ✅ Base de datos: {'OK' if database_ok else 'PROBLEMAS'}")
    print(f"   ✅ Funcionalidades críticas: {'OK' if critical_ok else 'PROBLEMAS'}")
    print(f"   ✅ Endpoints nuevos: {'OK' if new_endpoints_ok else 'PROBLEMAS'}")
    
    if passed_categories == total_categories:
        print("\n🎉 DIAGNÓSTICO COMPLETO: Sistema funcionando correctamente")
        return 0
    else:
        print(f"\n⚠️ DIAGNÓSTICO COMPLETO: Se encontraron problemas en {total_categories - passed_categories} categorías")
        print("📋 Revisar detalles arriba para información específica de cada error")
        return 1

def run_full_tests():
    """Run the original comprehensive test suite"""
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
    
    # NEW FUNCTIONALITY TESTS (Priority Focus)
    print("\n" + "🆕" * 20)
    print("TESTING NEW FUNCTIONALITIES - PRIORITY FOCUS")
    print("🆕" * 20)
    
    test_results.append(("🆕 Historial Kilometraje", tester.test_historial_kilometraje()))
    test_results.append(("🆕 Búsqueda Generalizada", tester.test_busqueda_generalizada()))
    test_results.append(("🆕 Filtrado de Órdenes", tester.test_filtrado_ordenes()))
    
    # NEWEST FUNCTIONALITY TESTS (AI Dictation for Work Orders)
    print("\n" + "🤖" * 20)
    print("TESTING NEWEST AI DICTATION FUNCTIONALITY")
    print("🤖" * 20)
    
    test_results.append(("🤖 AI Dictado Órdenes", tester.test_ai_dictado_orden()))
    test_results.append(("🤖 OrdenTrabajo Update Model", tester.test_orden_trabajo_update_model()))
    
    # Print final results
    print("\n" + "="*60)
    print("FINAL TEST RESULTS")
    print("="*60)
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<30} {status}")
    
    print(f"\n📊 Overall Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    # Special focus on new functionality results
    new_functionality_results = test_results[-5:]  # Last 5 are the new ones (3 previous + 2 newest)
    new_passed = sum(1 for _, result in new_functionality_results if result)
    
    print(f"\n🆕 NEW FUNCTIONALITY Results: {new_passed}/5 new features passed")
    print(f"   🆕 Previous features: {sum(1 for _, result in test_results[-5:-2] if result)}/3")
    print(f"   🤖 AI Dictation features: {sum(1 for _, result in test_results[-2:] if result)}/2")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check logs above")
        return 1

if __name__ == "__main__":
    sys.exit(main())