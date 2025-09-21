#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Cargar variables de entorno
load_dotenv(Path('/app/backend/.env'))

async def debug_mongo():
    # Conectar a MongoDB
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Conectado a MongoDB: {mongo_url}")
    print(f"Base de datos: {db_name}")
    print("-" * 50)
    
    # Listar todas las colecciones
    collections = await db.list_collection_names()
    print(f"Colecciones encontradas: {collections}")
    print("-" * 50)
    
    # Verificar órdenes en diferentes posibles colecciones
    possible_order_collections = ['ordenes', 'orders', 'orden', 'ordenes_trabajo']
    
    for collection_name in possible_order_collections:
        if collection_name in collections:
            collection = db[collection_name]
            count = await collection.count_documents({})
            print(f"Colección '{collection_name}': {count} documentos")
            
            if count > 0:
                # Mostrar algunos documentos
                docs = await collection.find({}).limit(2).to_list(length=None)
                print(f"Primeros 2 documentos de '{collection_name}':")
                for i, doc in enumerate(docs):
                    print(f"  Doc {i+1}: {doc.get('id', 'No ID')} - Estado: {doc.get('estado', 'No estado')}")
        else:
            print(f"Colección '{collection_name}': No existe")
    
    print("-" * 50)
    
    # Intentar borrar órdenes manualmente de la colección correcta
    if 'ordenes_trabajo' in collections:
        ordenes_collection = db['ordenes_trabajo']
        result = await ordenes_collection.delete_many({})
        print(f"Intentando borrar órdenes_trabajo: {result.deleted_count} documentos eliminados")
    
    # Verificar conteo después del borrado
    if 'ordenes_trabajo' in collections:
        new_count = await ordenes_collection.count_documents({})
        print(f"Conteo después del borrado: {new_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_mongo())