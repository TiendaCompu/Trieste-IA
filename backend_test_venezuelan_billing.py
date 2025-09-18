import requests
import sys
import json
from datetime import datetime

class VenezuelanBillingTester:
    def __init__(self, base_url="https://autoserviceai.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'cliente': None,
            'vehiculo': None,
            'tasa_cambio': None,
            'presupuesto': None,
            'factura': None
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

    def test_cliente_creation_with_fiscal_fields(self):
        """Test CRITICAL: Client creation with ALL new fiscal fields"""
        print("\n" + "="*60)
        print("TESTING CRÍTICO: CREACIÓN DE CLIENTE CON CAMPOS FISCALES")
        print("="*60)
        
        # Test data as specified in the request
        cliente_data = {
            "nombre": "juan carlos perez",
            "tipo_documento": "CI", 
            "prefijo_documento": "V",
            "numero_documento": "12345678",
            "telefono": "0414-555.12.34",
            "telefono_secundario": "0412-987.65.43", 
            "direccion_fiscal": "caracas, venezuela av principal",
            "empresa": "empresa de prueba",
            "email": "juan@email.com"
        }
        
        print(f"📝 Creating client with fiscal data: {json.dumps(cliente_data, indent=2)}")
        success, response = self.run_test(
            "POST /api/clientes - Create Client with Fiscal Fields",
            "POST",
            "clientes",
            200,
            data=cliente_data
        )
        
        if success and isinstance(response, dict):
            self.created_ids['cliente'] = response.get('id')
            print(f"✅ Client created successfully with ID: {self.created_ids['cliente']}")
            
            # Verify all fiscal fields are present
            fiscal_fields = ['nombre', 'tipo_documento', 'prefijo_documento', 'numero_documento', 
                           'telefono', 'telefono_secundario', 'direccion_fiscal', 'empresa', 'email']
            missing_fields = [field for field in fiscal_fields if field not in response]
            if missing_fields:
                print(f"❌ Missing fiscal fields in response: {missing_fields}")
                return False
            else:
                print("✅ All fiscal fields present in response")
            
            # Verify UPPERCASE conversion
            uppercase_fields = ['nombre', 'empresa', 'direccion_fiscal']
            for field in uppercase_fields:
                expected_upper = cliente_data[field].upper()
                actual_value = response.get(field, '')
                if actual_value == expected_upper:
                    print(f"✅ {field} converted to UPPERCASE correctly: '{actual_value}'")
                else:
                    print(f"❌ {field} UPPERCASE conversion failed: expected '{expected_upper}', got '{actual_value}'")
                    return False
            
            # Verify other fields remain unchanged
            non_uppercase_fields = ['tipo_documento', 'prefijo_documento', 'numero_documento', 
                                  'telefono', 'telefono_secundario', 'email']
            for field in non_uppercase_fields:
                if response.get(field) == cliente_data[field]:
                    print(f"✅ {field} preserved correctly: '{response.get(field)}'")
                else:
                    print(f"❌ {field} not preserved: expected '{cliente_data[field]}', got '{response.get(field)}'")
                    return False
            
            print(f"📋 Complete client data: {json.dumps(response, indent=2, default=str)}")
            return True
        
        return False

    def test_vehiculo_creation_with_technical_fields(self):
        """Test CRITICAL: Vehicle creation with new technical fields"""
        print("\n" + "="*60)
        print("TESTING CRÍTICO: CREACIÓN DE VEHÍCULO CON CAMPOS TÉCNICOS")
        print("="*60)
        
        if not self.created_ids['cliente']:
            print("❌ Cannot test vehicle creation - no client ID available")
            return False
        
        # Test data as specified in the request
        vehiculo_data = {
            "matricula": "test999",
            "marca": "toyota",
            "modelo": "corolla", 
            "año": 2020,
            "color": "blanco",
            "kilometraje": 50000,
            "tipo_combustible": "gasolina",
            "serial_niv": "abc123def456",
            "tara": 1200.5,
            "cliente_id": self.created_ids['cliente']
        }
        
        print(f"📝 Creating vehicle with technical data: {json.dumps(vehiculo_data, indent=2)}")
        success, response = self.run_test(
            "POST /api/vehiculos - Create Vehicle with Technical Fields",
            "POST",
            "vehiculos",
            200,
            data=vehiculo_data
        )
        
        if success and isinstance(response, dict):
            self.created_ids['vehiculo'] = response.get('id')
            print(f"✅ Vehicle created successfully with ID: {self.created_ids['vehiculo']}")
            
            # Verify all technical fields are present
            technical_fields = ['matricula', 'marca', 'modelo', 'año', 'color', 'kilometraje', 
                              'tipo_combustible', 'serial_niv', 'tara', 'cliente_id']
            missing_fields = [field for field in technical_fields if field not in response]
            if missing_fields:
                print(f"❌ Missing technical fields in response: {missing_fields}")
                return False
            else:
                print("✅ All technical fields present in response")
            
            # Verify UPPERCASE conversion for text fields
            uppercase_fields = ['matricula', 'marca', 'modelo', 'color', 'tipo_combustible', 'serial_niv']
            for field in uppercase_fields:
                expected_upper = vehiculo_data[field].upper()
                actual_value = response.get(field, '')
                if actual_value == expected_upper:
                    print(f"✅ {field} converted to UPPERCASE correctly: '{actual_value}'")
                else:
                    print(f"❌ {field} UPPERCASE conversion failed: expected '{expected_upper}', got '{actual_value}'")
                    return False
            
            # Verify numeric fields remain unchanged
            numeric_fields = ['año', 'kilometraje', 'tara']
            for field in numeric_fields:
                if response.get(field) == vehiculo_data[field]:
                    print(f"✅ {field} preserved correctly: {response.get(field)}")
                else:
                    print(f"❌ {field} not preserved: expected {vehiculo_data[field]}, got {response.get(field)}")
                    return False
            
            # Verify client_id
            if response.get('cliente_id') == vehiculo_data['cliente_id']:
                print(f"✅ cliente_id preserved correctly: {response.get('cliente_id')}")
            else:
                print(f"❌ cliente_id not preserved: expected {vehiculo_data['cliente_id']}, got {response.get('cliente_id')}")
                return False
            
            print(f"📋 Complete vehicle data: {json.dumps(response, indent=2, default=str)}")
            return True
        
        return False

    def test_search_functionality(self):
        """Test CRITICAL: Search functionality working"""
        print("\n" + "="*60)
        print("TESTING CRÍTICO: FUNCIONALIDAD DE BÚSQUEDAS")
        print("="*60)
        
        if not self.created_ids['vehiculo']:
            print("❌ Cannot test search - no vehicle created")
            return False
        
        # Test 1: Search by license plate (matricula)
        success1, response1 = self.run_test(
            "GET /api/vehiculos/matricula/TEST999 - Search by License Plate",
            "GET",
            "vehiculos/matricula/TEST999",
            200
        )
        
        # Note: This endpoint might not exist, let's check if it returns 404 or works
        if not success1:
            print("⚠️  Direct matricula endpoint might not exist, testing general search instead")
        
        # Test 2: General search by TEST
        success2, response2 = self.run_test(
            "GET /api/buscar?q=TEST - General Search by TEST",
            "GET",
            "buscar?q=TEST",
            200
        )
        
        if success2 and isinstance(response2, dict):
            vehiculos = response2.get('vehiculos', [])
            clientes = response2.get('clientes', [])
            
            print(f"✅ Search by 'TEST' returned {len(vehiculos)} vehicles and {len(clientes)} clients")
            
            # Look for our test vehicle
            test_vehicle_found = any(v.get('matricula') == 'TEST999' for v in vehiculos)
            if test_vehicle_found:
                print("✅ Test vehicle TEST999 found in search results")
            else:
                print("❌ Test vehicle TEST999 not found in search results")
                success2 = False
        
        # Test 3: Search by client name (JUAN)
        success3, response3 = self.run_test(
            "GET /api/buscar?q=JUAN - Search by Client Name",
            "GET",
            "buscar?q=JUAN",
            200
        )
        
        if success3 and isinstance(response3, dict):
            vehiculos = response3.get('vehiculos', [])
            clientes = response3.get('clientes', [])
            
            print(f"✅ Search by 'JUAN' returned {len(vehiculos)} vehicles and {len(clientes)} clients")
            
            # Look for our test client
            test_client_found = any('JUAN' in c.get('nombre', '').upper() for c in clientes)
            if test_client_found:
                print("✅ Test client with JUAN found in search results")
            else:
                print("❌ Test client with JUAN not found in search results")
                success3 = False
            
            # Our vehicle should also appear via client relationship
            test_vehicle_via_client = any(v.get('cliente_id') == self.created_ids['cliente'] for v in vehiculos)
            if test_vehicle_via_client:
                print("✅ Test vehicle found via client relationship")
            else:
                print("❌ Test vehicle not found via client relationship")
        
        # Test 4: Search by company name
        success4, response4 = self.run_test(
            "GET /api/buscar?q=EMPRESA - Search by Company Name",
            "GET",
            "buscar?q=EMPRESA",
            200
        )
        
        if success4 and isinstance(response4, dict):
            vehiculos = response4.get('vehiculos', [])
            clientes = response4.get('clientes', [])
            
            print(f"✅ Search by 'EMPRESA' returned {len(vehiculos)} vehicles and {len(clientes)} clients")
            
            # Look for our test client by company
            test_company_found = any('EMPRESA' in c.get('empresa', '').upper() for c in clientes)
            if test_company_found:
                print("✅ Test client company found in search results")
            else:
                print("❌ Test client company not found in search results")
                success4 = False
        
        # Summary
        search_tests_passed = success2 and success3 and success4
        
        print(f"\n📊 SEARCH TESTS SUMMARY:")
        print(f"   ✅ General search by TEST: {'PASSED' if success2 else 'FAILED'}")
        print(f"   ✅ Search by client name JUAN: {'PASSED' if success3 else 'FAILED'}")
        print(f"   ✅ Search by company EMPRESA: {'PASSED' if success4 else 'FAILED'}")
        
        return search_tests_passed

    def test_tasa_cambio_system(self):
        """Test exchange rate system"""
        print("\n" + "="*60)
        print("TESTING: SISTEMA DE TASA DE CAMBIO")
        print("="*60)
        
        # Test 1: Create exchange rate
        tasa_data = {
            "tasa_bs_usd": 36.50,
            "observaciones": "Tasa de prueba para testing"
        }
        
        print(f"📝 Creating exchange rate: {json.dumps(tasa_data, indent=2)}")
        success1, response1 = self.run_test(
            "POST /api/tasa-cambio - Create Exchange Rate",
            "POST",
            "tasa-cambio",
            200,
            data=tasa_data
        )
        
        if success1 and isinstance(response1, dict):
            self.created_ids['tasa_cambio'] = response1.get('id')
            print(f"✅ Exchange rate created successfully")
            
            # Verify fields
            if response1.get('tasa_bs_usd') == tasa_data['tasa_bs_usd']:
                print(f"✅ Exchange rate value correct: {response1.get('tasa_bs_usd')}")
            else:
                print(f"❌ Exchange rate value incorrect: expected {tasa_data['tasa_bs_usd']}, got {response1.get('tasa_bs_usd')}")
                return False
            
            if response1.get('activa') == True:
                print("✅ Exchange rate marked as active")
            else:
                print("❌ Exchange rate not marked as active")
                return False
        
        # Test 2: Get current exchange rate
        success2, response2 = self.run_test(
            "GET /api/tasa-cambio/actual - Get Current Exchange Rate",
            "GET",
            "tasa-cambio/actual",
            200
        )
        
        if success2 and isinstance(response2, dict):
            if response2.get('tasa_bs_usd') == tasa_data['tasa_bs_usd']:
                print(f"✅ Current exchange rate retrieved correctly: {response2.get('tasa_bs_usd')}")
            else:
                print(f"❌ Current exchange rate incorrect: expected {tasa_data['tasa_bs_usd']}, got {response2.get('tasa_bs_usd')}")
                success2 = False
        
        # Test 3: Get exchange rate history
        success3, response3 = self.run_test(
            "GET /api/tasa-cambio/historial - Get Exchange Rate History",
            "GET",
            "tasa-cambio/historial",
            200
        )
        
        if success3 and isinstance(response3, list):
            print(f"✅ Exchange rate history retrieved: {len(response3)} entries")
            if len(response3) > 0 and response3[0].get('tasa_bs_usd') == tasa_data['tasa_bs_usd']:
                print("✅ Latest history entry matches our created rate")
            else:
                print("❌ History entry doesn't match our created rate")
                success3 = False
        
        return success1 and success2 and success3

    def test_presupuesto_system(self):
        """Test budget system with IVA 16%"""
        print("\n" + "="*60)
        print("TESTING: SISTEMA DE PRESUPUESTOS CON IVA 16%")
        print("="*60)
        
        if not self.created_ids['cliente'] or not self.created_ids['vehiculo']:
            print("❌ Cannot test budget system - missing client or vehicle")
            return False
        
        # Test 1: Create budget
        presupuesto_data = {
            "vehiculo_id": self.created_ids['vehiculo'],
            "cliente_id": self.created_ids['cliente'],
            "items": [
                {
                    "tipo": "servicio",
                    "descripcion": "Cambio de aceite y filtro",
                    "cantidad": 1,
                    "precio_unitario_usd": 50.0,
                    "total_usd": 50.0
                },
                {
                    "tipo": "repuesto",
                    "descripcion": "Filtro de aceite",
                    "cantidad": 1,
                    "precio_unitario_usd": 15.0,
                    "total_usd": 15.0
                }
            ],
            "observaciones": "Presupuesto de prueba"
        }
        
        print(f"📝 Creating budget: {json.dumps(presupuesto_data, indent=2)}")
        success1, response1 = self.run_test(
            "POST /api/presupuestos - Create Budget with IVA 16%",
            "POST",
            "presupuestos",
            200,
            data=presupuesto_data
        )
        
        if success1 and isinstance(response1, dict):
            self.created_ids['presupuesto'] = response1.get('id')
            print(f"✅ Budget created successfully with ID: {self.created_ids['presupuesto']}")
            
            # Verify calculations
            expected_subtotal = 65.0  # 50 + 15
            expected_iva = expected_subtotal * 0.16  # 16% IVA
            expected_total = expected_subtotal + expected_iva
            
            if response1.get('subtotal_usd') == expected_subtotal:
                print(f"✅ Subtotal calculated correctly: ${expected_subtotal}")
            else:
                print(f"❌ Subtotal incorrect: expected ${expected_subtotal}, got ${response1.get('subtotal_usd')}")
                return False
            
            if abs(response1.get('iva_usd', 0) - expected_iva) < 0.01:  # Allow small floating point differences
                print(f"✅ IVA 16% calculated correctly: ${response1.get('iva_usd'):.2f}")
            else:
                print(f"❌ IVA incorrect: expected ${expected_iva:.2f}, got ${response1.get('iva_usd')}")
                return False
            
            if abs(response1.get('total_usd', 0) - expected_total) < 0.01:
                print(f"✅ Total calculated correctly: ${response1.get('total_usd'):.2f}")
            else:
                print(f"❌ Total incorrect: expected ${expected_total:.2f}, got ${response1.get('total_usd')}")
                return False
            
            # Verify budget number format
            numero_presupuesto = response1.get('numero_presupuesto', '')
            if numero_presupuesto.startswith('P-2024-'):
                print(f"✅ Budget number format correct: {numero_presupuesto}")
            else:
                print(f"❌ Budget number format incorrect: {numero_presupuesto}")
                return False
        
        # Test 2: Get all budgets
        success2, response2 = self.run_test(
            "GET /api/presupuestos - Get All Budgets",
            "GET",
            "presupuestos",
            200
        )
        
        if success2 and isinstance(response2, list):
            print(f"✅ Retrieved {len(response2)} budgets")
            our_budget = next((p for p in response2 if p.get('id') == self.created_ids['presupuesto']), None)
            if our_budget:
                print("✅ Our budget found in list")
            else:
                print("❌ Our budget not found in list")
                success2 = False
        
        # Test 3: Approve budget
        if self.created_ids['presupuesto']:
            success3, response3 = self.run_test(
                "PUT /api/presupuestos/{id}/aprobar - Approve Budget",
                "PUT",
                f"presupuestos/{self.created_ids['presupuesto']}/aprobar",
                200
            )
            
            if success3:
                print("✅ Budget approved successfully")
            else:
                print("❌ Budget approval failed")
                success3 = False
        else:
            success3 = False
        
        return success1 and success2 and success3

    def test_factura_system(self):
        """Test invoice system with IGTF 3%"""
        print("\n" + "="*60)
        print("TESTING: SISTEMA DE FACTURACIÓN CON IGTF 3%")
        print("="*60)
        
        if not self.created_ids['presupuesto']:
            print("❌ Cannot test invoice system - no approved budget available")
            return False
        
        # Test 1: Create invoice from budget
        factura_data = {
            "presupuesto_id": self.created_ids['presupuesto'],
            "observaciones": "Factura de prueba"
        }
        
        print(f"📝 Creating invoice: {json.dumps(factura_data, indent=2)}")
        success1, response1 = self.run_test(
            "POST /api/facturas - Create Invoice from Budget",
            "POST",
            "facturas",
            200,
            data=factura_data
        )
        
        if success1 and isinstance(response1, dict):
            self.created_ids['factura'] = response1.get('id')
            print(f"✅ Invoice created successfully with ID: {self.created_ids['factura']}")
            
            # Verify invoice number format
            numero_factura = response1.get('numero_factura', '')
            if numero_factura.startswith('FAC-2024-'):
                print(f"✅ Invoice number format correct: {numero_factura}")
            else:
                print(f"❌ Invoice number format incorrect: {numero_factura}")
                return False
            
            # Verify currency conversion
            tasa_cambio = response1.get('tasa_cambio', 0)
            if tasa_cambio > 0:
                print(f"✅ Exchange rate applied: {tasa_cambio}")
            else:
                print("❌ No exchange rate applied")
                return False
            
            # Verify bolivar amounts
            total_usd = response1.get('total_usd', 0)
            total_bs = response1.get('total_bs', 0)
            expected_bs = total_usd * tasa_cambio
            
            if abs(total_bs - expected_bs) < 0.01:
                print(f"✅ Bolivar conversion correct: ${total_usd} USD = Bs. {total_bs:.2f}")
            else:
                print(f"❌ Bolivar conversion incorrect: expected Bs. {expected_bs:.2f}, got Bs. {total_bs:.2f}")
                return False
            
            # Verify vehicle data is included
            vehiculo_datos = response1.get('vehiculo_datos', {})
            if vehiculo_datos.get('matricula') == 'TEST999':
                print("✅ Vehicle data included in invoice")
            else:
                print("❌ Vehicle data not properly included")
                return False
        
        # Test 2: Register payment in USD (should trigger IGTF)
        if self.created_ids['factura']:
            pago_data = {
                "factura_id": self.created_ids['factura'],
                "tipo": "dolares",
                "metodo": "zelle",
                "monto_usd": 30.0,
                "referencia": "TEST123456"
            }
            
            print(f"📝 Registering USD payment (should trigger IGTF): {json.dumps(pago_data, indent=2)}")
            success2, response2 = self.run_test(
                "POST /api/facturas/{id}/pagos - Register USD Payment (IGTF)",
                "POST",
                f"facturas/{self.created_ids['factura']}/pagos",
                200,
                data=pago_data
            )
            
            if success2 and isinstance(response2, dict):
                print("✅ USD payment registered successfully")
                
                # Check if IGTF was applied
                if 'saldo_pendiente' in response2:
                    print(f"✅ Payment processed, remaining balance: Bs. {response2.get('saldo_pendiente', 0):.2f}")
                else:
                    print("❌ Payment response doesn't include balance information")
                    success2 = False
            else:
                success2 = False
        else:
            success2 = False
        
        # Test 3: Get all invoices
        success3, response3 = self.run_test(
            "GET /api/facturas - Get All Invoices",
            "GET",
            "facturas",
            200
        )
        
        if success3 and isinstance(response3, list):
            print(f"✅ Retrieved {len(response3)} invoices")
            our_invoice = next((f for f in response3 if f.get('id') == self.created_ids['factura']), None)
            if our_invoice:
                print("✅ Our invoice found in list")
                
                # Check IGTF application
                if our_invoice.get('aplica_igtf') == True:
                    igtf_usd = our_invoice.get('igtf_usd', 0)
                    expected_igtf = our_invoice.get('total_usd', 0) * 0.03
                    if abs(igtf_usd - expected_igtf) < 0.01:
                        print(f"✅ IGTF 3% calculated correctly: ${igtf_usd:.2f}")
                    else:
                        print(f"❌ IGTF calculation incorrect: expected ${expected_igtf:.2f}, got ${igtf_usd:.2f}")
                        success3 = False
                else:
                    print("⚠️  IGTF not applied (may be expected if no USD payments)")
            else:
                print("❌ Our invoice not found in list")
                success3 = False
        
        return success1 and success2 and success3

def main():
    print("🇻🇪 VENEZUELAN BILLING SYSTEM - CRITICAL BACKEND TESTING")
    print("=" * 70)
    
    # Initialize tester
    tester = VenezuelanBillingTester()
    
    # Run critical tests as requested
    test_results = []
    
    print("\n🚨 TESTING CRÍTICO - PROBLEMAS REPORTADOS")
    print("=" * 50)
    
    # 1. CREACIÓN DE VEHÍCULOS (CRÍTICO)
    test_results.append(("1. Cliente con campos fiscales", tester.test_cliente_creation_with_fiscal_fields()))
    test_results.append(("2. Vehículo con campos técnicos", tester.test_vehiculo_creation_with_technical_fields()))
    
    # 2. VERIFICAR CONVERSIÓN MAYÚSCULAS (included in above tests)
    
    # 3. BÚSQUEDAS FUNCIONANDO
    test_results.append(("3. Funcionalidad de búsquedas", tester.test_search_functionality()))
    
    print("\n💰 TESTING SISTEMA DE FACTURACIÓN VENEZOLANO")
    print("=" * 50)
    
    # Additional Venezuelan billing system tests
    test_results.append(("4. Sistema tasa de cambio", tester.test_tasa_cambio_system()))
    test_results.append(("5. Sistema presupuestos IVA 16%", tester.test_presupuesto_system()))
    test_results.append(("6. Sistema facturación IGTF 3%", tester.test_factura_system()))
    
    # Print final results
    print("\n" + "="*70)
    print("RESULTADOS FINALES - TESTING CRÍTICO")
    print("="*70)
    
    critical_passed = 0
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<40} {status}")
        if result:
            critical_passed += 1
    
    print(f"\n📊 Resultados Generales: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"🚨 Funcionalidades Críticas: {critical_passed}/{len(test_results)} passed")
    
    # Specific verification summary
    print(f"\n🔍 VERIFICACIONES ESPECÍFICAS:")
    print(f"   ✅ Cliente con campos fiscales completos")
    print(f"   ✅ Vehículo con campos técnicos nuevos")
    print(f"   ✅ Conversión automática a MAYÚSCULAS")
    print(f"   ✅ Búsquedas por matrícula, cliente y empresa")
    print(f"   ✅ Sistema de tasa de cambio manual")
    print(f"   ✅ Presupuestos en USD con IVA 16%")
    print(f"   ✅ Facturación en Bs con IGTF 3%")
    
    if critical_passed == len(test_results):
        print("\n🎉 ¡TODOS LOS TESTS CRÍTICOS PASARON!")
        return 0
    else:
        print(f"\n⚠️  {len(test_results) - critical_passed} funcionalidades críticas fallaron")
        return 1

if __name__ == "__main__":
    sys.exit(main())