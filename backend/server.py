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
    nombre: str  # Nombre o Razón Social
    tipo_documento: str  # "CI" o "RIF"
    prefijo_documento: str  # V-, E-, J-, G-
    numero_documento: str  # 12345678 o 12345678-9
    telefono: Optional[str] = None
    telefono_secundario: Optional[str] = None
    direccion_fiscal: str  # Campo requerido para facturación
    empresa: Optional[str] = None
    email: str  # Campo requerido para facturación
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClienteCreate(BaseModel):
    nombre: str
    tipo_documento: str
    prefijo_documento: str
    numero_documento: str
    telefono: Optional[str] = None
    telefono_secundario: Optional[str] = None
    direccion_fiscal: str
    empresa: Optional[str] = None
    email: str

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
    whatsapp: Optional[str] = None  # Número de WhatsApp
    avatar: Optional[str] = None  # URL o base64 de la imagen
    estado: str = "disponible"  # "disponible", "fuera_servicio", "vacaciones", "inactivo"
    activo: bool = True  # Para compatibilidad
    ubicacion_actual: Optional[str] = None  # Para futuro control de asistencia
    ultimo_acceso: Optional[datetime] = None  # Para control automático
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MecanicoCreate(BaseModel):
    nombre: str
    especialidad: str
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    avatar: Optional[str] = None
    estado: str = "disponible"
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

class HistorialKilometraje(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vehiculo_id: str
    kilometraje_anterior: int
    kilometraje_nuevo: int
    fecha_actualizacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    motivo: str = "Entrada al taller"
    observaciones: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HistorialKilometrajeCreate(BaseModel):
    vehiculo_id: str
    kilometraje_nuevo: int
    observaciones: Optional[str] = None

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

@api_router.put("/clientes/{cliente_id}", response_model=Cliente)
async def actualizar_cliente(cliente_id: str, datos: dict):
    """Actualiza los datos de un cliente"""
    cliente = await db.clientes.find_one({"id": cliente_id})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Campos permitidos para actualización
    campos_permitidos = ["nombre", "telefono", "empresa", "email"]
    datos_actualizacion = {k: v for k, v in datos.items() if k in campos_permitidos}
    datos_actualizacion = prepare_for_mongo(datos_actualizacion)
    
    await db.clientes.update_one({"id": cliente_id}, {"$set": datos_actualizacion})
    
    cliente_actualizado = await db.clientes.find_one({"id": cliente_id})
    return Cliente(**parse_from_mongo(cliente_actualizado))

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

# Actualizar vehículo (sin matrícula)
@api_router.put("/vehiculos/{vehiculo_id}", response_model=Vehiculo)
async def actualizar_vehiculo(vehiculo_id: str, datos: dict):
    """Actualiza los datos de un vehículo excepto la matrícula"""
    vehiculo = await db.vehiculos.find_one({"id": vehiculo_id})
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    # Verificar que el nuevo cliente existe si se está cambiando
    if "cliente_id" in datos and datos["cliente_id"] != vehiculo["cliente_id"]:
        cliente = await db.clientes.find_one({"id": datos["cliente_id"]})
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Campos permitidos para actualización (incluyendo cliente_id)
    campos_permitidos = ["marca", "modelo", "año", "color", "kilometraje", "cliente_id"]
    datos_actualizacion = {k: v for k, v in datos.items() if k in campos_permitidos}
    datos_actualizacion = prepare_for_mongo(datos_actualizacion)
    
    await db.vehiculos.update_one({"id": vehiculo_id}, {"$set": datos_actualizacion})
    
    vehiculo_actualizado = await db.vehiculos.find_one({"id": vehiculo_id})
    return Vehiculo(**parse_from_mongo(vehiculo_actualizado))

# Cambiar matrícula manteniendo historial
@api_router.post("/vehiculos/{vehiculo_id}/cambio-matricula")
async def cambiar_matricula_vehiculo(vehiculo_id: str, datos: dict):
    """Cambia la matrícula de un vehículo manteniendo su historial"""
    vehiculo = await db.vehiculos.find_one({"id": vehiculo_id})
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    matricula_nueva = datos.get("matricula_nueva", "").upper().strip()
    matricula_anterior = datos.get("matricula_anterior", "")
    motivo = datos.get("motivo", "")
    
    # Validar formato de nueva matrícula
    import re
    if not re.match(r'^[A-Z0-9]{4,7}$', matricula_nueva):
        raise HTTPException(
            status_code=400, 
            detail="Matrícula inválida. Debe tener 4-7 caracteres alfanuméricos"
        )
    
    # Verificar que la nueva matrícula no existe
    vehiculo_existente = await db.vehiculos.find_one({"matricula": matricula_nueva})
    if vehiculo_existente and vehiculo_existente["id"] != vehiculo_id:
        raise HTTPException(status_code=400, detail="La nueva matrícula ya está registrada")
    
    # Crear registro del cambio
    registro_cambio = {
        "id": str(uuid.uuid4()),
        "vehiculo_id": vehiculo_id,
        "matricula_anterior": matricula_anterior,
        "matricula_nueva": matricula_nueva,
        "motivo": motivo,
        "fecha_cambio": datetime.now(timezone.utc),
        "usuario": "sistema"  # En el futuro se puede agregar autenticación
    }
    
    await db.cambios_matricula.insert_one(prepare_for_mongo(registro_cambio))
    
    # Actualizar la matrícula del vehículo
    await db.vehiculos.update_one(
        {"id": vehiculo_id}, 
        {"$set": {"matricula": matricula_nueva}}
    )
    
    return {"success": True, "matricula_anterior": matricula_anterior, "matricula_nueva": matricula_nueva}

# Eliminar vehículo
@api_router.delete("/vehiculos/{vehiculo_id}")
async def eliminar_vehiculo(vehiculo_id: str):
    """Elimina un vehículo y todo su historial"""
    vehiculo = await db.vehiculos.find_one({"id": vehiculo_id})
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    # Verificar que no tenga órdenes activas
    ordenes_activas = await db.ordenes_trabajo.find({
        "vehiculo_id": vehiculo_id,
        "estado": {"$nin": ["terminado", "entregado"]}
    }).to_list(1)
    
    if ordenes_activas:
        raise HTTPException(
            status_code=400, 
            detail="No se puede eliminar: el vehículo tiene órdenes de trabajo activas"
        )
    
    # Crear registro de eliminación para auditoría
    registro_eliminacion = {
        "id": str(uuid.uuid4()),
        "vehiculo_eliminado": vehiculo,
        "fecha_eliminacion": datetime.now(timezone.utc),
        "usuario": "sistema"
    }
    await db.vehiculos_eliminados.insert_one(prepare_for_mongo(registro_eliminacion))
    
    # Eliminar vehículo
    await db.vehiculos.delete_one({"id": vehiculo_id})
    
    # Marcar órdenes como "vehículo eliminado" en lugar de eliminarlas
    await db.ordenes_trabajo.update_many(
        {"vehiculo_id": vehiculo_id},
        {"$set": {"vehiculo_eliminado": True, "matricula_original": vehiculo["matricula"]}}
    )
    
    return {"success": True, "matricula": vehiculo["matricula"]}

# Endpoint temporal para limpiar duplicados
@api_router.post("/admin/limpiar-duplicados")
async def limpiar_matriculas_duplicadas():
    """Elimina vehículos con matrículas duplicadas, manteniendo el más reciente"""
    vehiculos = await db.vehiculos.find().to_list(1000)
    matriculas_vistas = {}
    duplicados_eliminados = []
    
    # Normalizar todas las matrículas a mayúsculas primero
    for vehiculo in vehiculos:
        matricula_normalizada = vehiculo["matricula"].upper()
        await db.vehiculos.update_one(
            {"id": vehiculo["id"]}, 
            {"$set": {"matricula": matricula_normalizada}}
        )
    
    # Obtener vehículos actualizados
    vehiculos = await db.vehiculos.find().sort("created_at", -1).to_list(1000)
    
    for vehiculo in vehiculos:
        matricula = vehiculo["matricula"]
        if matricula in matriculas_vistas:
            # Es un duplicado, eliminar
            await db.vehiculos.delete_one({"id": vehiculo["id"]})
            duplicados_eliminados.append({
                "id": vehiculo["id"],
                "matricula": matricula,
                "created_at": vehiculo.get("created_at")
            })
        else:
            matriculas_vistas[matricula] = vehiculo
    
    return {
        "duplicados_eliminados": len(duplicados_eliminados),
        "detalles": duplicados_eliminados,
        "matriculas_unicas_restantes": len(matriculas_vistas)
    }

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

@api_router.put("/mecanicos/{mecanico_id}", response_model=MecanicoEspecialista)
async def actualizar_mecanico(mecanico_id: str, datos: dict):
    """Actualiza los datos de un mecánico"""
    mecanico = await db.mecanicos.find_one({"id": mecanico_id})
    if not mecanico:
        raise HTTPException(status_code=404, detail="Mecánico no encontrado")
    
    # Campos permitidos para actualización - incluye whatsapp y estado
    campos_permitidos = ["nombre", "especialidad", "telefono", "whatsapp", "avatar", "estado", "activo"]
    datos_actualizacion = {k: v for k, v in datos.items() if k in campos_permitidos}
    datos_actualizacion = prepare_for_mongo(datos_actualizacion)
    
    await db.mecanicos.update_one({"id": mecanico_id}, {"$set": datos_actualizacion})
    
    mecanico_actualizado = await db.mecanicos.find_one({"id": mecanico_id})
    return MecanicoEspecialista(**parse_from_mongo(mecanico_actualizado))

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

# Actualizar servicio/repuesto
@api_router.put("/servicios-repuestos/{item_id}", response_model=ServicioRepuesto)
async def actualizar_servicio_repuesto(item_id: str, datos: dict):
    """Actualiza un servicio o repuesto"""
    item = await db.servicios_repuestos.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    # Campos permitidos para actualización
    campos_permitidos = ["tipo", "nombre", "descripcion", "precio"]
    datos_actualizacion = {k: v for k, v in datos.items() if k in campos_permitidos}
    datos_actualizacion = prepare_for_mongo(datos_actualizacion)
    
    await db.servicios_repuestos.update_one({"id": item_id}, {"$set": datos_actualizacion})
    
    item_actualizado = await db.servicios_repuestos.find_one({"id": item_id})
    return ServicioRepuesto(**parse_from_mongo(item_actualizado))

# Eliminar servicio/repuesto
@api_router.delete("/servicios-repuestos/{item_id}")
async def eliminar_servicio_repuesto(item_id: str):
    """Elimina un servicio o repuesto del catálogo"""
    item = await db.servicios_repuestos.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    # Verificar si está siendo usado en alguna orden activa
    ordenes_con_item = await db.ordenes_trabajo.find({
        "servicios_repuestos.id": item_id,
        "estado": {"$nin": ["terminado", "entregado"]}
    }).to_list(1)
    
    if ordenes_con_item:
        raise HTTPException(
            status_code=400, 
            detail="No se puede eliminar: el item está siendo usado en órdenes activas"
        )
    
    await db.servicios_repuestos.delete_one({"id": item_id})
    return {"success": True, "item_eliminado": item["nombre"]}

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
async def obtener_ordenes_trabajo(estado: Optional[str] = None, filtro: Optional[str] = None):
    """
    Obtiene órdenes de trabajo con filtros opcionales
    - estado: filtrar por estado específico
    - filtro: 'activas' para estados no entregados, 'entregadas' para entregadas, 'todas' para todas
    """
    query = {}
    
    if estado:
        query["estado"] = estado
    elif filtro == "activas":
        # Estados activos (no entregadas)
        query["estado"] = {"$ne": "entregado"}
    elif filtro == "entregadas":
        # Solo órdenes entregadas
        query["estado"] = "entregado"
    # Si filtro es 'todas' o None, no agregar filtro
    
    ordenes = await db.ordenes_trabajo.find(query).sort("created_at", -1).to_list(1000)
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

# Historial de Kilometraje Routes
@api_router.post("/vehiculos/{vehiculo_id}/actualizar-kilometraje", response_model=HistorialKilometraje)
async def actualizar_kilometraje_vehiculo(vehiculo_id: str, datos: HistorialKilometrajeCreate):
    """Actualiza el kilometraje del vehículo y guarda historial"""
    # Verificar que el vehículo existe
    vehiculo = await db.vehiculos.find_one({"id": vehiculo_id})
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    # Validar que el nuevo kilometraje no sea inferior al anterior
    kilometraje_actual = vehiculo.get("kilometraje", 0)
    if datos.kilometraje_nuevo < kilometraje_actual:
        raise HTTPException(
            status_code=400, 
            detail=f"El kilometraje nuevo ({datos.kilometraje_nuevo}) no puede ser inferior al actual ({kilometraje_actual})"
        )
    
    # Crear registro de historial
    historial_data = datos.dict()
    historial_data["kilometraje_anterior"] = kilometraje_actual
    historial_obj = HistorialKilometraje(**historial_data)
    
    # Guardar historial en base de datos
    await db.historial_kilometraje.insert_one(prepare_for_mongo(historial_obj.dict()))
    
    # Actualizar kilometraje del vehículo
    await db.vehiculos.update_one(
        {"id": vehiculo_id}, 
        {"$set": {"kilometraje": datos.kilometraje_nuevo}}
    )
    
    return historial_obj

@api_router.get("/vehiculos/{vehiculo_id}/historial-kilometraje", response_model=List[HistorialKilometraje])
async def obtener_historial_kilometraje(vehiculo_id: str):
    """Obtiene el historial de kilometraje de un vehículo"""
    historial = await db.historial_kilometraje.find({"vehiculo_id": vehiculo_id}).sort("fecha_actualizacion", -1).to_list(1000)
    return [HistorialKilometraje(**parse_from_mongo(item)) for item in historial]

# Búsqueda Generalizada
@api_router.get("/buscar")
async def busqueda_generalizada(q: str):
    """Búsqueda generalizada por matrícula, nombre de cliente o empresa"""
    if not q or len(q.strip()) < 2:
        return {"vehiculos": [], "clientes": []}
    
    q = q.strip().upper()
    
    try:
        # Buscar vehículos por matrícula
        vehiculos_cursor = db.vehiculos.find({
            "matricula": {"$regex": q, "$options": "i"}
        }).limit(10)
        vehiculos_raw = await vehiculos_cursor.to_list(length=10)
        
        # Buscar clientes por nombre o empresa
        clientes_cursor = db.clientes.find({
            "$or": [
                {"nombre": {"$regex": q, "$options": "i"}},
                {"empresa": {"$regex": q, "$options": "i"}}
            ]
        }).limit(10)
        clientes_raw = await clientes_cursor.to_list(length=10)
        
        # Para cada cliente encontrado, buscar sus vehículos
        vehiculos_por_cliente = []
        for cliente in clientes_raw:
            vehiculos_cliente = await db.vehiculos.find({"cliente_id": cliente["id"]}).to_list(1000)
            vehiculos_por_cliente.extend(vehiculos_cliente)
        
        # Combinar y eliminar duplicados
        todos_vehiculos = vehiculos_raw + vehiculos_por_cliente
        vehiculos_unicos = {}
        for vehiculo in todos_vehiculos:
            vehiculos_unicos[vehiculo["id"]] = vehiculo
        
        # Convertir a modelos Pydantic para serialización correcta
        vehiculos_resultado = []
        for vehiculo_raw in vehiculos_unicos.values():
            try:
                # Crear objeto Vehiculo usando Pydantic
                vehiculo_obj = Vehiculo(**parse_from_mongo(vehiculo_raw))
                
                # Buscar cliente asociado
                cliente_raw = await db.clientes.find_one({"id": vehiculo_raw["cliente_id"]})
                cliente_obj = None
                if cliente_raw:
                    cliente_obj = Cliente(**parse_from_mongo(cliente_raw))
                
                # Crear respuesta con cliente incluido
                vehiculo_dict = vehiculo_obj.dict()
                vehiculo_dict["cliente"] = cliente_obj.dict() if cliente_obj else None
                
                vehiculos_resultado.append(vehiculo_dict)
            except Exception as e:
                print(f"Error processing vehicle {vehiculo_raw.get('id', 'unknown')}: {e}")
                continue
        
        # Convertir clientes a modelos Pydantic
        clientes_resultado = []
        for cliente_raw in clientes_raw:
            try:
                cliente_obj = Cliente(**parse_from_mongo(cliente_raw))
                clientes_resultado.append(cliente_obj.dict())
            except Exception as e:
                print(f"Error processing client {cliente_raw.get('id', 'unknown')}: {e}")
                continue
        
        return {
            "vehiculos": vehiculos_resultado[:10],
            "clientes": clientes_resultado[:10]
        }
        
    except Exception as e:
        print(f"Error in search: {e}")
        return {"vehiculos": [], "clientes": []}

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