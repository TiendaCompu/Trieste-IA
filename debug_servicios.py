#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Cargar variables de entorno
load_dotenv(Path('/app/backend/.env'))

async def debug_servicios():
    # Conectar a MongoDB
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Verificando servicios y repuestos...")
    print("-" * 50)
    
    # Verificar colección servicios_repuestos
    collection = db["servicios_repuestos"]
    count = await collection.count_documents({})
    print(f"Total documentos: {count}")
    
    # Mostrar estructura de documentos
    docs = await collection.find({}).limit(2).to_list(length=None)
    for i, doc in enumerate(docs):
        print(f"\nDocumento {i+1}:")
        for key, value in doc.items():
            print(f"  {key}: {value} ({type(value).__name__})")
    
    # Verificar documentos activos
    activos_count = await collection.count_documents({"activo": True})
    print(f"\nDocumentos con activo=True: {activos_count}")
    
    # Verificar otros valores del campo activo
    diferentes_activos = await collection.distinct("activo")
    print(f"Valores únicos del campo 'activo': {diferentes_activos}")
    
    # Actualizar todos los documentos para que tengan activo=True si no lo tienen
    update_result = await collection.update_many(
        {"activo": {"$exists": False}},
        {"$set": {"activo": True}}
    )
    print(f"Documentos actualizados (sin campo activo): {update_result.modified_count}")
    
    # Verificar nuevamente
    activos_count_final = await collection.count_documents({"activo": True})
    print(f"Documentos activos después de actualización: {activos_count_final}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_servicios())