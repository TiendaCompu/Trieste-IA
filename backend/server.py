from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import base64
import io
from PIL import Image

# Import AI integrations
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Sistema de Taller Mecánico", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize AI Chat
def get_ai_chat():
    return LlmChat(
        api_key=os.environ.get('EMERGENT_LLM_KEY'),
        session_id=str(uuid.uuid4()),
        system_message="""Eres un asistente especializado en talleres mecánicos. Tu trabajo es extraer información específica de vehículos a partir de texto dictado o imágenes de matrículas.

Cuando recibas información, extrae y estructura los siguientes datos en formato JSON:
- matricula: número de matrícula/placa del vehículo
- marca: marca del vehículo (Toyota, Honda, etc.)
- modelo: modelo específico del vehículo
- año: año del vehículo
- color: color del vehículo
- kilometraje: kilometraje actual si se menciona
- cliente_nombre: nombre del cliente
- cliente_telefono: teléfono del cliente si se menciona
- cliente_empresa: nombre de la empresa si es una flota
- observaciones: cualquier observación adicional sobre el estado del vehículo

Si algún dato no está disponible, usa null. Responde SOLO con el JSON, sin texto adicional."""
    ).with_model("openai", "gpt-4o")

# Define Models
class Cliente(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    telefono: Optional[str] = None
    empresa: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClienteCreate(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    empresa: Optional[str] = None
    email: Optional[str] = None

class Vehiculo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    matricula: str
    marca: str
    modelo: str
    año: Optional[int] = None
    color: Optional[str] = None
    kilometraje: Optional[int] = None
    cliente_id: str
    foto_matricula: Optional[str] = None  # Base64 encoded
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VehiculoCreate(BaseModel):
    matricula: str
    marca: str
    modelo: str
    año: Optional[int] = None
    color: Optional[str] = None
    kilometraje: Optional[int] = None
    cliente_id: str
    foto_matricula: Optional[str] = None

class MecanicoEspecialista(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    especialidad: str  # "motor", "transmision", "frenos", "electricidad", "suspension"
    telefono: Optional[str] = None
    activo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MecanicoCreate(BaseModel):
    nombre: str
    especialidad: str
    telefono: Optional[str] = None
    activo: bool = True

class ServicioRepuesto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tipo: str  # "servicio" o "repuesto"
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServicioRepuestoCreate(BaseModel):
    tipo: str
    nombre: str
    descripcion: Optional[str] = None
    precio: float

class OrdenTrabajo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vehiculo_id: str
    cliente_id: str
    mecanico_id: Optional[str] = None
    diagnostico: Optional[str] = None
    servicios_repuestos: List[Dict[str, Any]] = []  # [{"id": "service_id", "cantidad": 1, "precio": 100}]
    estado: str = "recibido"  # "recibido", "diagnosticando", "presupuestado", "aprobado", "en_reparacion", "terminado", "entregado"
    presupuesto_total: Optional[float] = None
    fecha_ingreso: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    fecha_estimada_entrega: Optional[datetime] = None
    observaciones: Optional[str] = None
    aprobado_cliente: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrdenTrabajoCreate(BaseModel):
    vehiculo_id: str
    cliente_id: str
    diagnostico: Optional[str] = None
    observaciones: Optional[str] = None

class OrdenTrabajoUpdate(BaseModel):
    mecanico_id: Optional[str] = None
    diagnostico: Optional[str] = None
    servicios_repuestos: Optional[List[Dict[str, Any]]] = None
    estado: Optional[str] = None
    presupuesto_total: Optional[float] = None
    fecha_estimada_entrega: Optional[datetime] = None
    observaciones: Optional[str] = None
    aprobado_cliente: Optional[bool] = None

class AIExtraRequest(BaseModel):
    texto_dictado: Optional[str] = None
    imagen_base64: Optional[str] = None

# Helper functions
def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    """Parse datetime strings back from MongoDB"""
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and key.endswith(('_at', 'fecha_')):
                try:
                    item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    pass
    return item

# AI Routes
@api_router.post("/ai/extraer-datos")
async def extraer_datos_vehiculo(request: AIExtraRequest):
    """Extrae datos del vehículo usando IA a partir de texto dictado o imagen de matrícula"""
    try:
        chat = get_ai_chat()
        
        if request.imagen_base64:
            # Procesar imagen de matrícula
            try:
                # Decode base64 image
                image_data = base64.b64decode(request.imagen_base64.split(',')[1] if ',' in request.imagen_base64 else request.imagen_base64)
                
                # Save temporarily for AI processing
                temp_path = f"/tmp/matricula_{uuid.uuid4()}.jpg"
                with open(temp_path, "wb") as f:
                    f.write(image_data)
                
                # Create file content for AI
                image_file = FileContentWithMimeType(
                    file_path=temp_path,
                    mime_type="image/jpeg"
                )
                
                user_message = UserMessage(
                    text="Extrae la información de la matrícula/placa de este vehículo y cualquier otra información visible del vehículo (marca, modelo, color, etc.). Responde en formato JSON.",
                    file_contents=[image_file]
                )
                
                response = await chat.send_message(user_message)
                
                # Clean up temp file
                try:
                    os.remove(temp_path)
                except:
                    pass
                    
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error procesando imagen: {str(e)}")
        
        elif request.texto_dictado:
            # Procesar texto dictado
            user_message = UserMessage(
                text=f"Extrae la información del vehículo del siguiente texto dictado: {request.texto_dictado}"
            )
            response = await chat.send_message(user_message)
        
        else:
            raise HTTPException(status_code=400, detail="Se requiere texto dictado o imagen")
        
        # Parse AI response
        try:
            # Clean the response to get just the JSON
            json_str = response.strip()
            if json_str.startswith('```json'):
                json_str = json_str[7:-3]
            elif json_str.startswith('```'):
                json_str = json_str[3:-3]
            
            datos_extraidos = json.loads(json_str)
            return {"success": True, "datos": datos_extraidos}
            
        except json.JSONDecodeError as e:
            # If JSON parsing fails, return the raw response for debugging
            return {"success": False, "error": "Error parsing AI response", "raw_response": response}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en extracción de datos: {str(e)}")

# Cliente Routes
@api_router.post("/clientes", response_model=Cliente)
async def crear_cliente(cliente: ClienteCreate):
    cliente_dict = prepare_for_mongo(cliente.dict())
    cliente_obj = Cliente(**cliente_dict)
    await db.clientes.insert_one(prepare_for_mongo(cliente_obj.dict()))
    return cliente_obj

@api_router.get("/clientes", response_model=List[Cliente])
async def obtener_clientes():
    clientes = await db.clientes.find().to_list(1000)
    return [Cliente(**parse_from_mongo(cliente)) for cliente in clientes]

@api_router.get("/clientes/{cliente_id}", response_model=Cliente)
async def obtener_cliente(cliente_id: str):
    cliente = await db.clientes.find_one({"id": cliente_id})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return Cliente(**parse_from_mongo(cliente))

# Verificar matrícula única
@api_router.get("/vehiculos/verificar-matricula/{matricula}")
async def verificar_matricula_unica(matricula: str):
    """Verifica si una matrícula ya existe en la base de datos"""
    vehiculo_existente = await db.vehiculos.find_one({"matricula": matricula.upper()})
    return {"existe": vehiculo_existente is not None, "matricula": matricula.upper()}

# Vehículo Routes
@api_router.post("/vehiculos", response_model=Vehiculo)
async def crear_vehiculo(vehiculo: VehiculoCreate):
    # Verificar que el cliente existe
    cliente = await db.clientes.find_one({"id": vehiculo.cliente_id})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Normalizar matrícula a mayúsculas y validar formato
    matricula_normalizada = vehiculo.matricula.upper().strip()
    
    # Validar formato de matrícula (4-7 caracteres alfanuméricos)
    import re
    if not re.match(r'^[A-Z0-9]{4,7}$', matricula_normalizada):
        raise HTTPException(
            status_code=400, 
            detail="Matrícula inválida. Debe tener 4-7 caracteres alfanuméricos sin símbolos"
        )
    
    # Verificar que la matrícula no existe
    vehiculo_existente = await db.vehiculos.find_one({"matricula": matricula_normalizada})
    if vehiculo_existente:
        raise HTTPException(status_code=400, detail="Esta matrícula ya está registrada")
    
    # Crear vehículo con matrícula normalizada
    vehiculo_dict = prepare_for_mongo(vehiculo.dict())
    vehiculo_dict["matricula"] = matricula_normalizada
    vehiculo_obj = Vehiculo(**vehiculo_dict)
    await db.vehiculos.insert_one(prepare_for_mongo(vehiculo_obj.dict()))
    return vehiculo_obj

@api_router.get("/vehiculos", response_model=List[Vehiculo])
async def obtener_vehiculos():
    vehiculos = await db.vehiculos.find().to_list(1000)
    return [Vehiculo(**parse_from_mongo(vehiculo)) for vehiculo in vehiculos]

@api_router.get("/vehiculos/{vehiculo_id}", response_model=Vehiculo)
async def obtener_vehiculo(vehiculo_id: str):
    vehiculo = await db.vehiculos.find_one({"id": vehiculo_id})
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return Vehiculo(**parse_from_mongo(vehiculo))

# Mecánico Routes
@api_router.post("/mecanicos", response_model=MecanicoEspecialista)
async def crear_mecanico(mecanico: MecanicoCreate):
    mecanico_dict = prepare_for_mongo(mecanico.dict())
    mecanico_obj = MecanicoEspecialista(**mecanico_dict)
    await db.mecanicos.insert_one(prepare_for_mongo(mecanico_obj.dict()))
    return mecanico_obj

@api_router.get("/mecanicos", response_model=List[MecanicoEspecialista])
async def obtener_mecanicos():
    mecanicos = await db.mecanicos.find().to_list(1000)
    return [MecanicoEspecialista(**parse_from_mongo(mecanico)) for mecanico in mecanicos]

@api_router.get("/mecanicos/activos", response_model=List[MecanicoEspecialista])
async def obtener_mecanicos_activos():
    mecanicos = await db.mecanicos.find({"activo": True}).to_list(1000)
    return [MecanicoEspecialista(**parse_from_mongo(mecanico)) for mecanico in mecanicos]

# Servicios y Repuestos Routes
@api_router.post("/servicios-repuestos", response_model=ServicioRepuesto)
async def crear_servicio_repuesto(item: ServicioRepuestoCreate):
    item_dict = prepare_for_mongo(item.dict())
    item_obj = ServicioRepuesto(**item_dict)
    await db.servicios_repuestos.insert_one(prepare_for_mongo(item_obj.dict()))
    return item_obj

@api_router.get("/servicios-repuestos", response_model=List[ServicioRepuesto])
async def obtener_servicios_repuestos():
    items = await db.servicios_repuestos.find().to_list(1000)
    return [ServicioRepuesto(**parse_from_mongo(item)) for item in items]

@api_router.get("/servicios-repuestos/tipo/{tipo}", response_model=List[ServicioRepuesto])
async def obtener_por_tipo(tipo: str):
    items = await db.servicios_repuestos.find({"tipo": tipo}).to_list(1000)
    return [ServicioRepuesto(**parse_from_mongo(item)) for item in items]

# Órdenes de Trabajo Routes
@api_router.post("/ordenes", response_model=OrdenTrabajo)
async def crear_orden_trabajo(orden: OrdenTrabajoCreate):
    # Verificar que vehículo y cliente existen
    vehiculo = await db.vehiculos.find_one({"id": orden.vehiculo_id})
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    cliente = await db.clientes.find_one({"id": orden.cliente_id})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    orden_dict = prepare_for_mongo(orden.dict())
    orden_obj = OrdenTrabajo(**orden_dict)
    await db.ordenes_trabajo.insert_one(prepare_for_mongo(orden_obj.dict()))
    return orden_obj

@api_router.get("/ordenes", response_model=List[OrdenTrabajo])
async def obtener_ordenes_trabajo():
    ordenes = await db.ordenes_trabajo.find().sort("created_at", -1).to_list(1000)
    return [OrdenTrabajo(**parse_from_mongo(orden)) for orden in ordenes]

@api_router.get("/ordenes/{orden_id}", response_model=OrdenTrabajo)
async def obtener_orden_trabajo(orden_id: str):
    orden = await db.ordenes_trabajo.find_one({"id": orden_id})
    if not orden:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
    return OrdenTrabajo(**parse_from_mongo(orden))

@api_router.put("/ordenes/{orden_id}", response_model=OrdenTrabajo)
async def actualizar_orden_trabajo(orden_id: str, actualizacion: OrdenTrabajoUpdate):
    orden = await db.ordenes_trabajo.find_one({"id": orden_id})
    if not orden:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
    
    # Preparar datos para actualización
    update_data = {k: v for k, v in actualizacion.dict().items() if v is not None}
    update_data = prepare_for_mongo(update_data)
    
    await db.ordenes_trabajo.update_one({"id": orden_id}, {"$set": update_data})
    
    # Obtener orden actualizada
    orden_actualizada = await db.ordenes_trabajo.find_one({"id": orden_id})
    return OrdenTrabajo(**parse_from_mongo(orden_actualizada))

# Dashboard Routes
@api_router.get("/dashboard/estadisticas")
async def obtener_estadisticas():
    """Obtiene estadísticas generales del taller"""
    total_ordenes = await db.ordenes_trabajo.count_documents({})
    ordenes_activas = await db.ordenes_trabajo.count_documents({
        "estado": {"$in": ["recibido", "diagnosticando", "presupuestado", "aprobado", "en_reparacion"]}
    })
    total_vehiculos = await db.vehiculos.count_documents({})
    total_clientes = await db.clientes.count_documents({})
    
    # Estadísticas por estado
    pipeline = [
        {"$group": {"_id": "$estado", "count": {"$sum": 1}}}
    ]
    estados_ordenes = await db.ordenes_trabajo.aggregate(pipeline).to_list(100)
    
    return {
        "total_ordenes": total_ordenes,
        "ordenes_activas": ordenes_activas,
        "total_vehiculos": total_vehiculos,
        "total_clientes": total_clientes,
        "estados_ordenes": {item["_id"]: item["count"] for item in estados_ordenes}
    }

# Historial de vehículo
@api_router.get("/vehiculos/{vehiculo_id}/historial")
async def obtener_historial_vehiculo(vehiculo_id: str):
    """Obtiene el historial completo de reparaciones de un vehículo"""
    ordenes = await db.ordenes_trabajo.find({"vehiculo_id": vehiculo_id}).sort("created_at", -1).to_list(1000)
    return [OrdenTrabajo(**parse_from_mongo(orden)) for orden in ordenes]

# Test route
@api_router.get("/")
async def root():
    return {"message": "Sistema de Taller Mecánico API funcionando"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()