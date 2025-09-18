#!/usr/bin/env python3
"""
Script para resetear la base de datos del taller mecánico
Limpia todas las colecciones y crea datos de prueba iniciales
"""
import asyncio
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

# Configuración de la base de datos
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

async def reset_database():
    """Resetea completamente la base de datos"""
    print("🔄 Conectando a MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.get_default_database()
    
    # Limpiar todas las colecciones
    print("🗑️  Limpiando base de datos...")
    collections = await db.list_collection_names()
    for collection_name in collections:
        await db[collection_name].drop()
        print(f"   - Eliminada colección: {collection_name}")
    
    print("✅ Base de datos limpiada completamente")
    
    # Crear datos de prueba
    await create_sample_data(db)
    
    # Cerrar conexión
    client.close()
    print("🎉 ¡Base de datos resetada exitosamente!")

async def create_sample_data(db):
    """Crea datos de prueba iniciales"""
    print("📊 Creando datos de prueba...")
    
    # 1. Crear tasa de cambio inicial
    print("💱 Creando tasa de cambio...")
    tasa_cambio = {
        "id": "tasa-001",
        "tasa_bs_usd": 36.5,
        "fecha_actualizacion": datetime.now(timezone.utc).isoformat(),
        "observaciones": "TASA INICIAL DEL SISTEMA",
        "activa": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tasas_cambio.insert_one(tasa_cambio)
    
    # 2. Crear clientes de prueba
    print("👥 Creando clientes...")
    clientes = [
        {
            "id": "cliente-001",
            "nombre": "JUAN CARLOS RODRIGUEZ",
            "tipo_documento": "CI",
            "prefijo_documento": "V",
            "numero_documento": "12345678",
            "telefono": "0414-555.12.34",
            "telefono_secundario": "0412-987.65.43",
            "direccion_fiscal": "CARACAS, VENEZUELA - AV BOLIVAR CC SAMBIL",
            "empresa": "EMPRESA EJEMPLO C.A.",
            "email": "juan@empresa.com",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "cliente-002", 
            "nombre": "MARIA GONZALEZ PEREZ",
            "tipo_documento": "CI",
            "prefijo_documento": "V",
            "numero_documento": "87654321",
            "telefono": "0424-777.88.99",
            "telefono_secundario": "",
            "direccion_fiscal": "VALENCIA, CARABOBO - URB LOS MANGOS CALLE 5",
            "empresa": "",
            "email": "maria.gonzalez@email.com",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "cliente-003",
            "nombre": "TRANSPORTES UNIDOS DEL SUR",
            "tipo_documento": "RIF",
            "prefijo_documento": "J",
            "numero_documento": "123456789",
            "telefono": "0212-555.00.11",
            "telefono_secundario": "0414-222.33.44",
            "direccion_fiscal": "MARACAIBO, ZULIA - ZONA INDUSTRIAL NORTE AV 5 JULIO",
            "empresa": "TRANSPORTES UNIDOS DEL SUR C.A.",
            "email": "admin@transportesunidos.com",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.clientes.insert_many(clientes)
    
    # 3. Crear vehículos de prueba
    print("🚗 Creando vehículos...")
    vehiculos = [
        {
            "id": "vehiculo-001",
            "matricula": "ABC123",
            "marca": "TOYOTA",
            "modelo": "COROLLA",
            "año": 2020,
            "color": "BLANCO",
            "kilometraje": 45000,
            "tipo_combustible": "GASOLINA",
            "serial_niv": "1HGBH41JXMN109186",
            "tara": 1200.5,
            "foto_vehiculo": "",
            "cliente_id": "cliente-001",
            "foto_matricula": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "vehiculo-002",
            "matricula": "XYZ789",
            "marca": "FORD",
            "modelo": "FIESTA",
            "año": 2019,
            "color": "AZUL",
            "kilometraje": 32000,
            "tipo_combustible": "GASOLINA",
            "serial_niv": "3FADP4BJ8KM123456",
            "tara": 1100.0,
            "foto_vehiculo": "",
            "cliente_id": "cliente-002",
            "foto_matricula": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "vehiculo-003",
            "matricula": "TRK456",
            "marca": "CHEVROLET",
            "modelo": "NPR",
            "año": 2018,
            "color": "BLANCO",
            "kilometraje": 85000,
            "tipo_combustible": "DIESEL",
            "serial_niv": "JS2RE58W6XK123789",
            "tara": 3500.0,
            "foto_vehiculo": "",
            "cliente_id": "cliente-003",
            "foto_matricula": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.vehiculos.insert_many(vehiculos)
    
    # 4. Crear mecánicos de prueba
    print("🔧 Creando mecánicos...")
    mecanicos = [
        {
            "id": "mecanico-001",
            "nombre": "CARLOS RODRIGUEZ",
            "especialidad": "motor",
            "telefono": "0414-111.22.33",
            "whatsapp": "0414-111.22.33",
            "avatar": "",
            "estado": "disponible",
            "activo": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "mecanico-002",
            "nombre": "LUIS MARTINEZ",
            "especialidad": "frenos",
            "telefono": "0424-444.55.66",
            "whatsapp": "0424-444.55.66",
            "avatar": "",
            "estado": "disponible",
            "activo": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "mecanico-003",
            "nombre": "ANA GUTIERREZ",
            "especialidad": "electricidad",
            "telefono": "0412-777.88.99",
            "whatsapp": "0412-777.88.99",
            "avatar": "",
            "estado": "vacaciones",
            "activo": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.mecanicos.insert_many(mecanicos)
    
    # 5. Crear servicios/repuestos de prueba
    print("🛠️  Creando servicios y repuestos...")
    servicios = [
        {
            "id": "servicio-001",
            "nombre": "CAMBIO DE ACEITE",
            "tipo": "servicio",
            "precio": 25.00,
            "descripcion": "CAMBIO DE ACEITE COMPLETO CON FILTRO",
            "activo": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "servicio-002",
            "nombre": "ALINEACION Y BALANCEO",
            "tipo": "servicio", 
            "precio": 35.00,
            "descripcion": "ALINEACION Y BALANCEO DE RUEDAS",
            "activo": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "repuesto-001",
            "nombre": "FILTRO DE ACEITE",
            "tipo": "repuesto",
            "precio": 8.50,
            "descripcion": "FILTRO DE ACEITE UNIVERSAL",
            "activo": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "repuesto-002",
            "nombre": "PASTILLAS DE FRENO",
            "tipo": "repuesto",
            "precio": 45.00,
            "descripcion": "PASTILLAS DE FRENO DELANTERAS",
            "activo": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.servicios_repuestos.insert_many(servicios)
    
    # 6. Crear órdenes de trabajo de prueba
    print("📋 Creando órdenes de trabajo...")
    ordenes = [
        {
            "id": "orden-001",
            "vehiculo_id": "vehiculo-001",
            "cliente_id": "cliente-001",
            "mecanico_id": "mecanico-001",
            "diagnostico": "VEHICULO INGRESA PARA CAMBIO DE ACEITE Y REVISION GENERAL",
            "estado": "recibido",
            "servicios_aplicados": [],
            "total": 0.0,
            "observaciones": "CLIENTE SOLICITA REVISION COMPLETA",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "orden-002",
            "vehiculo_id": "vehiculo-002",
            "cliente_id": "cliente-002", 
            "mecanico_id": "mecanico-002",
            "diagnostico": "PROBLEMA EN SISTEMA DE FRENOS - RUIDO AL FRENAR",
            "estado": "diagnosticando",
            "servicios_aplicados": [],
            "total": 0.0,
            "observaciones": "REVISAR PASTILLAS Y DISCOS DE FRENO",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "orden-003",
            "vehiculo_id": "vehiculo-003",
            "cliente_id": "cliente-003",
            "mecanico_id": "mecanico-001",
            "diagnostico": "MANTENIMIENTO PREVENTIVO FLOTA - 80000 KM",
            "estado": "entregado",
            "servicios_aplicados": [
                {
                    "id": "servicio-001",
                    "nombre": "CAMBIO DE ACEITE",
                    "cantidad": 1,
                    "precio_unitario": 25.00,
                    "total": 25.00
                }
            ],
            "total": 25.00,
            "observaciones": "MANTENIMIENTO COMPLETADO - VEHICULO ENTREGADO",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.ordenes_trabajo.insert_many(ordenes)
    
    print("✅ Datos de prueba creados exitosamente")
    print("\n📊 RESUMEN DE DATOS CREADOS:")
    print(f"   - Clientes: {len(clientes)}")
    print(f"   - Vehículos: {len(vehiculos)}")
    print(f"   - Mecánicos: {len(mecanicos)}")
    print(f"   - Servicios/Repuestos: {len(servicios)}")
    print(f"   - Órdenes de trabajo: {len(ordenes)}")
    print(f"   - Tasa de cambio: {tasa_cambio['tasa_bs_usd']} Bs/USD")

if __name__ == "__main__":
    asyncio.run(reset_database())