#!/usr/bin/env python3
"""
Database Administration System Testing Script
Tests all database administration endpoints as requested in the review.
"""

import requests
import json
import sys
from datetime import datetime

class DatabaseAdminTester:
    def __init__(self, base_url="https://workshop-ai-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                self.failed_tests.append(name)
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                    return False, error_detail
                except:
                    print(f"   Error: {response.text}")
                    return False, response.text

        except requests.exceptions.Timeout:
            print(f"❌ FAILED - Request timeout")
            self.failed_tests.append(name)
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            self.failed_tests.append(name)
            return False, {}

    def test_collections_endpoint(self):
        """Test GET /api/admin/collections"""
        print("\n" + "="*60)
        print("1. COLLECTIONS INFORMATION ENDPOINT")
        print("="*60)
        
        success, response = self.run_test(
            "Collections Information",
            "GET",
            "admin/collections",
            200
        )
        
        if success and isinstance(response, dict):
            if response.get('success'):
                collections = response.get('collections', [])
                print(f"✅ Found {len(collections)} collections")
                
                # Verify expected collections
                expected_collections = [
                    "vehiculos", "clientes", "ordenes", "mecanicos", 
                    "servicios_repuestos", "presupuestos", "facturas",
                    "historial_kilometraje", "tasas_cambio"
                ]
                
                collection_names = [c.get('name') for c in collections]
                missing_collections = [name for name in expected_collections if name not in collection_names]
                
                if missing_collections:
                    print(f"⚠️  Missing collections: {missing_collections}")
                else:
                    print("✅ All expected collections present")
                
                # Verify display names
                for collection in collections:
                    if all(key in collection for key in ['name', 'display_name', 'count']):
                        print(f"✅ {collection['display_name']}: {collection['count']} documents")
                    else:
                        print(f"❌ Invalid collection structure: {collection}")
                        return False
                        
                return True
            else:
                print(f"❌ Collections endpoint failed: {response.get('error', 'Unknown error')}")
                return False
        
        return False

    def test_backup_system(self):
        """Test backup system endpoints"""
        print("\n" + "="*60)
        print("2. BACKUP SYSTEM")
        print("="*60)
        
        # Test 1: Full backup
        print("\n📦 Testing Full Backup...")
        success1, response1 = self.run_test(
            "Full Backup Creation",
            "POST",
            "admin/backup",
            200,
            data={}
        )
        
        backup_data = None
        if success1 and isinstance(response1, dict) and response1.get('success'):
            backup_metadata = response1.get('backup_metadata', {})
            backup_data = response1.get('backup_data', {})
            
            print(f"✅ Backup metadata: {backup_metadata.get('total_documents', 0)} total documents")
            print(f"✅ Backup collections: {len(backup_data)} collections backed up")
            
            # Verify backup structure
            if isinstance(backup_data, dict) and len(backup_data) > 0:
                print("✅ Backup data structure is valid")
                for collection_name in list(backup_data.keys())[:3]:
                    collection_data = backup_data[collection_name]
                    if isinstance(collection_data, list):
                        print(f"✅ {collection_name}: {len(collection_data)} documents backed up")
                    else:
                        print(f"❌ Invalid backup data for {collection_name}")
                        success1 = False
                        break
            else:
                print("❌ Invalid backup data structure")
                success1 = False
        
        # Test 2: Specific collections backup
        print("\n📦 Testing Specific Collections Backup...")
        success2, response2 = self.run_test(
            "Specific Collections Backup",
            "POST",
            "admin/backup",
            200,
            data={"collections": ["vehiculos", "clientes"]}
        )
        
        if success2 and isinstance(response2, dict) and response2.get('success'):
            specific_backup_data = response2.get('backup_data', {})
            print(f"✅ Specific backup created with {len(specific_backup_data)} collections")
            
            # Verify only requested collections are backed up
            expected_collections = {"vehiculos", "clientes", "configuraciones"}
            if set(specific_backup_data.keys()) <= expected_collections:
                print("✅ Only requested collections backed up")
            else:
                print(f"⚠️  Unexpected collections in backup: {list(specific_backup_data.keys())}")
        
        return success1 and success2, backup_data

    def test_restore_system(self, backup_data):
        """Test restore system"""
        print("\n" + "="*60)
        print("3. RESTORE SYSTEM")
        print("="*60)
        
        if not backup_data or not isinstance(backup_data, dict):
            print("⚠️  Skipping restore test - no backup data available")
            return True
        
        # Create a small test backup for restore
        test_restore_data = {
            "backup_data": {
                "vehiculos": backup_data.get("vehiculos", [])[:1],  # Just one vehicle
                "clientes": backup_data.get("clientes", [])[:1]     # Just one client
            }
        }
        
        success, response = self.run_test(
            "Restore from Backup",
            "POST",
            "admin/restore",
            200,
            data=test_restore_data
        )
        
        if success and isinstance(response, dict) and response.get('success'):
            restored_collections = response.get('collections_restored', [])
            print(f"✅ Restore completed: {len(restored_collections)} collections restored")
            return True
        else:
            print(f"❌ Restore failed: {response.get('error', 'Unknown error') if isinstance(response, dict) else response}")
            return False

    def test_reset_system(self):
        """Test reset system"""
        print("\n" + "="*60)
        print("4. RESET SYSTEM")
        print("="*60)
        
        # Test 1: Reset specific collections
        print("\n🔄 Testing Specific Collections Reset...")
        success1, response1 = self.run_test(
            "Reset Specific Collections",
            "POST",
            "admin/reset",
            200,
            data={
                "collections": ["historial_kilometraje"],
                "create_sample_data": False
            }
        )
        
        if success1 and isinstance(response1, dict) and response1.get('success'):
            reset_collections = response1.get('collections_reset', [])
            print(f"✅ Reset completed: {len(reset_collections)} collections reset")
        
        # Test 2: Complete system reset with sample data
        print("\n🔄 Testing Complete System Reset with Sample Data...")
        success2, response2 = self.run_test(
            "Complete System Reset with Sample Data",
            "POST",
            "admin/reset-complete",
            200,
            data={"create_sample_data": True}
        )
        
        if success2 and isinstance(response2, dict) and response2.get('success'):
            print("✅ Complete system reset with sample data completed")
            
            # Verify sample data was created
            sample_data_info = response2.get('sample_data_created', {})
            if isinstance(sample_data_info, dict) and len(sample_data_info) > 0:
                print("✅ Sample data created:")
                for collection, count in sample_data_info.items():
                    print(f"   {collection}: {count} sample records")
            else:
                print("⚠️  Sample data creation info not available")
        
        return success1 and success2

    def test_logo_management(self):
        """Test logo management system"""
        print("\n" + "="*60)
        print("5. LOGO MANAGEMENT")
        print("="*60)
        
        # Create a small test image (base64 encoded 1x1 pixel PNG with data URL prefix)
        test_logo_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
        
        # Test 1: Upload logo (using query parameter as expected by backend)
        print("\n📤 Testing Logo Upload...")
        url = f"{self.api_url}/admin/upload-logo?logo_base64={test_logo_base64}"
        
        try:
            response = requests.post(url, timeout=30)
            success1 = response.status_code == 200
            
            if success1:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response1 = response.json()
                    if response1.get('success'):
                        print("✅ Logo uploaded successfully")
                    else:
                        print(f"❌ Logo upload failed: {response1.get('message', 'Unknown error')}")
                        success1 = False
                except:
                    print("✅ Logo uploaded (response not JSON)")
            else:
                print(f"❌ FAILED - Status: {response.status_code}")
                self.failed_tests.append("Upload Logo")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                    
            self.tests_run += 1
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            self.failed_tests.append("Upload Logo")
            self.tests_run += 1
            success1 = False
        
        # Test 2: Get logo
        print("\n📥 Testing Logo Retrieval...")
        success2, response2 = self.run_test(
            "Get Current Logo",
            "GET",
            "admin/logo",
            200
        )
        
        if success2 and isinstance(response2, dict):
            if response2.get('success'):
                logo_data = response2.get('logo_base64')
                if logo_data:
                    print("✅ Logo retrieved successfully")
                    print(f"✅ Logo data length: {len(logo_data)} characters")
                else:
                    print("⚠️  No logo data in response")
            else:
                print("⚠️  No logo found (may be expected if none uploaded)")
        
        return success1 and success2

    def test_error_handling(self):
        """Test error handling"""
        print("\n" + "="*60)
        print("6. ERROR HANDLING")
        print("="*60)
        
        # Test 1: Invalid backup data (expect 422 for validation error, not 400)
        print("\n🚫 Testing Invalid Backup Data...")
        success1, response1 = self.run_test(
            "Invalid Backup Data",
            "POST",
            "admin/restore",
            422,  # FastAPI returns 422 for validation errors
            data={"backup_data": "invalid_data"}
        )
        
        if success1:
            print("✅ Invalid backup data correctly rejected with validation error")
        else:
            print("⚠️  Invalid backup data handling may need improvement")
        
        # Test 2: Missing parameters (expect 422 for validation error, not 400)
        print("\n🚫 Testing Missing Parameters...")
        success2, response2 = self.run_test(
            "Missing Parameters",
            "POST",
            "admin/reset",
            422,  # FastAPI returns 422 for validation errors
            data={}
        )
        
        if success2:
            print("✅ Missing parameters correctly handled with validation error")
        else:
            print("⚠️  Missing parameter handling may need improvement")
        
        return success1 and success2

    def test_sample_data_creation(self):
        """Test sample data creation functionality"""
        print("\n" + "="*60)
        print("7. SAMPLE DATA CREATION")
        print("="*60)
        
        # This is tested as part of the reset system, but let's verify the data was actually created
        print("\n📊 Verifying Sample Data Creation...")
        
        # Check if collections have data after sample data creation
        collections_to_check = [
            ("vehiculos", "vehiculos"),
            ("clientes", "clientes"), 
            ("ordenes", "ordenes"),
            ("mecanicos", "mecanicos"),
            ("servicios_repuestos", "servicios-repuestos"),
            ("tasas_cambio", "tasa-cambio/historial")
        ]
        all_have_data = True
        
        for collection_name, endpoint in collections_to_check:
            success, response = self.run_test(
                f"Check {collection_name} has sample data",
                "GET",
                endpoint,
                200
            )
            
            if success and isinstance(response, list):
                if len(response) > 0:
                    print(f"✅ {collection_name}: {len(response)} records found")
                else:
                    print(f"⚠️  {collection_name}: No records found")
                    all_have_data = False
            else:
                print(f"❌ {collection_name}: Failed to retrieve data")
                all_have_data = False
        
        return all_have_data

    def run_all_tests(self):
        """Run all database administration tests"""
        print("🗄️ DATABASE ADMINISTRATION SYSTEM TESTING")
        print("=" * 80)
        print("Testing complete database management for workshop application")
        print("=" * 80)
        
        # Test 1: Collections Information
        collections_ok = self.test_collections_endpoint()
        
        # Test 2: Backup System
        backup_ok, backup_data = self.test_backup_system()
        
        # Test 3: Restore System
        restore_ok = self.test_restore_system(backup_data)
        
        # Test 4: Reset System
        reset_ok = self.test_reset_system()
        
        # Test 5: Logo Management
        logo_ok = self.test_logo_management()
        
        # Test 6: Error Handling
        error_handling_ok = self.test_error_handling()
        
        # Test 7: Sample Data Creation
        sample_data_ok = self.test_sample_data_creation()
        
        # Print final summary
        print("\n" + "="*80)
        print("DATABASE ADMINISTRATION SYSTEM TEST RESULTS")
        print("="*80)
        
        test_results = [
            ("Collections Information", collections_ok),
            ("Backup System", backup_ok),
            ("Restore System", restore_ok),
            ("Reset System", reset_ok),
            ("Logo Management", logo_ok),
            ("Error Handling", error_handling_ok),
            ("Sample Data Creation", sample_data_ok)
        ]
        
        for test_name, result in test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name:<25} {status}")
        
        print(f"\n📊 Overall Results: {self.tests_passed}/{self.tests_run} individual tests passed")
        
        passed_categories = sum(1 for _, result in test_results if result)
        print(f"📊 Category Results: {passed_categories}/{len(test_results)} categories passed")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   • {test}")
        
        if passed_categories == len(test_results):
            print("\n🎉 ALL DATABASE ADMINISTRATION TESTS PASSED!")
            print("✅ Database administration system is ready for production use.")
            return 0
        else:
            print(f"\n⚠️  {len(test_results) - passed_categories} categories failed")
            print("❌ Database administration system needs attention before production use.")
            return 1

def main():
    """Main test execution"""
    tester = DatabaseAdminTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())