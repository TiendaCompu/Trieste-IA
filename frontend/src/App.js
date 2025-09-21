import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Alert, AlertDescription } from "./components/ui/alert";
import { toast } from "sonner";
import { useDictado } from "./hooks/useDictado";
import BotonDictado from "./components/BotonDictado";
import { 
  Car, 
  Users, 
  Wrench, 
  ClipboardList, 
  Mic, 
  Camera, 
  Settings,
  Plus,
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  Edit,
  UserCheck,
  Package,
  DollarSign,
  Calendar,
  ArrowRight,
  FileText,
  PhoneCall,
  Trash2,
  X,
  ShoppingCart
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// CONFIGURACIÓN GLOBAL DE COLORES DEL SISTEMA
const COLORES_SISTEMA = {
  badgeAzul: "bg-blue-600 text-white hover:bg-blue-700 border-blue-600",
  iconoAzul: "bg-blue-100 text-blue-700",
  botonPrincipal: "bg-blue-600 hover:bg-blue-700 text-white"
};

// Funciones de formateo globales
const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const date = new Date(fecha);
  const dia = date.getDate().toString().padStart(2, '0');
  const mes = (date.getMonth() + 1).toString().padStart(2, '0');
  const año = date.getFullYear();
  return `${dia}/${mes}/${año}`;
};

const formatearTelefono = (telefono) => {
  if (!telefono) return '';
  // Remover caracteres no numéricos
  const numeros = telefono.replace(/\D/g, '');
  // Formatear como 0000-000.00.00
  if (numeros.length >= 11) {
    return `${numeros.slice(0, 4)}-${numeros.slice(4, 7)}.${numeros.slice(7, 9)}.${numeros.slice(9, 11)}`;
  }
  return telefono;
};

const validarTelefono = (telefono) => {
  const numeros = telefono.replace(/\D/g, '');
  return numeros.length >= 10 && numeros.length <= 11;
};

// Búsqueda Principal por Matrícula
const BusquedaMatricula = () => {
  const [matricula, setMatricula] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [vehiculoEncontrado, setVehiculoEncontrado] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [mostrarModalEntrada, setMostrarModalEntrada] = useState(false);
  const [nuevoKilometraje, setNuevoKilometraje] = useState('');
  const [observacionesKm, setObservacionesKm] = useState('');
  const navigate = useNavigate();

  // Hook de dictado para observaciones
  const { grabando, procesandoIA, campoActivo, iniciarDictado } = useDictado();

  // Función para manejar dictado de observaciones
  const handleDictadoObservaciones = async () => {
    const resultado = await iniciarDictado('general', 'observaciones');
    if (resultado.success && resultado.datos) {
      // Para observaciones simples, usar el texto procesado directamente
      const textoObservaciones = resultado.datos.observaciones || resultado.textoOriginal;
      setObservacionesKm(textoObservaciones);
    }
  };

  const validarMatricula = (valor) => {
    // Solo alfanuméricos, 4-7 caracteres, convertir a mayúsculas
    const limpio = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (limpio.length <= 7) {
      setMatricula(limpio);
    }
  };

  const buscarVehiculo = async () => {
    if (matricula.length < 4) {
      toast.error('La matrícula debe tener al menos 4 caracteres');
      return;
    }

    setBuscando(true);
    try {
      // Buscar vehículo por matrícula
      const response = await axios.get(`${API}/vehiculos`);
      const vehiculo = response.data.find(v => v.matricula === matricula);
      
      if (vehiculo) {
        // Vehículo encontrado, cargar datos del cliente
        const clienteRes = await axios.get(`${API}/clientes/${vehiculo.cliente_id}`);
        setVehiculoEncontrado(vehiculo);
        setCliente(clienteRes.data);
        setNuevoKilometraje(vehiculo.kilometraje?.toString() || '');
        toast.success('Vehículo encontrado');
        // Mostrar modal para preguntar si entra al taller
        setMostrarModalEntrada(true);
      } else {
        // Vehículo no encontrado, preguntar si desea agregarlo
        setVehiculoEncontrado(null);
        setCliente(null);
        
        // Mostrar confirmación para agregar vehículo nuevo
        const confirmar = window.confirm(
          `No se encontró un vehículo con matrícula "${matricula}".\n\n¿Desea registrar este vehículo nuevo?`
        );
        
        if (confirmar) {
          toast.success('Redirigiendo al registro de vehículo nuevo');
          navigate('/registro', { state: { matricula_predefinida: matricula } });
        } else {
          toast.info('Búsqueda cancelada');
        }
      }
    } catch (error) {
      console.error('Error buscando vehículo:', error);
      toast.error('Error en la búsqueda');
    } finally {
      setBuscando(false);
    }
  };

  const actualizarKilometraje = async () => {
    if (!nuevoKilometraje || isNaN(nuevoKilometraje)) {
      toast.error('Ingrese un kilometraje válido');
      return;
    }

    const kmNuevo = parseInt(nuevoKilometraje);
    const kmActual = vehiculoEncontrado.kilometraje || 0;

    if (kmNuevo < kmActual) {
      toast.error(`El kilometraje nuevo (${kmNuevo}) no puede ser inferior al actual (${kmActual})`);
      return;
    }

    try {
      await axios.post(`${API}/vehiculos/${vehiculoEncontrado.id}/actualizar-kilometraje`, {
        vehiculo_id: vehiculoEncontrado.id,
        kilometraje_nuevo: kmNuevo,
        observaciones: observacionesKm
      });

      toast.success('Kilometraje actualizado correctamente');

      // Actualizar el vehículo encontrado con el nuevo kilometraje
      setVehiculoEncontrado(prev => ({ ...prev, kilometraje: kmNuevo }));
      setMostrarModalEntrada(false);

      // Proceder a crear nueva orden
      crearNuevaOrden();
    } catch (error) {
      console.error('Error actualizando kilometraje:', error);
      toast.error(error.response?.data?.detail || 'Error actualizando el kilometraje');
    }
  };

  const saltarActualizacionKm = () => {
    setMostrarModalEntrada(false);
    crearNuevaOrden();
  };

  const crearNuevaOrden = () => {
    navigate('/registro', { 
      state: { 
        vehiculo_existente: vehiculoEncontrado,
        cliente_existente: cliente,
        crear_orden_directa: true
      }
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscarVehiculo();
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-center">Búsqueda por Matrícula</CardTitle>
        <CardDescription className="text-center">
          Ingresa la matrícula del vehículo para comenzar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 max-w-md mx-auto">
          <Input
            value={matricula}
            onChange={(e) => validarMatricula(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ej: ABC123"
            className="text-center text-lg font-mono tracking-wider uppercase"
            maxLength={7}
          />
          <Button 
            onClick={buscarVehiculo}
            disabled={buscando || matricula.length < 4}
            className="px-6"
          >
            {buscando ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {buscando ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
        
        <div className="text-center mt-2 text-sm text-gray-600">
          Formato: 4-7 caracteres alfanuméricos (sin símbolos)
        </div>

        {vehiculoEncontrado && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-green-800">
                  {vehiculoEncontrado.matricula} - {vehiculoEncontrado.marca} {vehiculoEncontrado.modelo}
                </h3>
                {cliente && (
                  <p className="text-sm text-green-700">
                    Propietario: {cliente.empresa ? `${cliente.empresa} - ${cliente.nombre}` : cliente.nombre}
                  </p>
                )}
                <p className="text-sm text-green-600">
                  Año: {vehiculoEncontrado.año} | Color: {vehiculoEncontrado.color} | 
                  KM: {vehiculoEncontrado.kilometraje?.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  onClick={() => navigate(`/vehiculo/${vehiculoEncontrado.id}`)}
                  variant="outline"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Ver Detalles
                </Button>
                <Button 
                  size="sm"
                  onClick={crearNuevaOrden}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Nueva Orden
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Entrada al Taller */}
        <Dialog open={mostrarModalEntrada} onOpenChange={setMostrarModalEntrada}>
          <DialogContent className="max-w-md dialog-content">
            <DialogHeader>
              <DialogTitle style={{color: 'var(--trieste-blue)'}}>
                ¿El vehículo entra al taller?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Vehículo:</strong> {vehiculoEncontrado?.matricula} - {vehiculoEncontrado?.marca} {vehiculoEncontrado?.modelo}
                </p>
                <p className="text-sm">
                  <strong>Propietario:</strong> {cliente?.empresa ? `${cliente.empresa} - ${cliente.nombre}` : cliente?.nombre}
                </p>
                <p className="text-sm">
                  <strong>Kilometraje actual:</strong> {vehiculoEncontrado?.kilometraje?.toLocaleString() || 'No registrado'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--trieste-blue)'}}>
                  Nuevo Kilometraje *
                </label>
                <Input
                  type="number"
                  value={nuevoKilometraje}
                  onChange={(e) => setNuevoKilometraje(e.target.value)}
                  placeholder="Kilometraje actual del vehículo"
                  min={vehiculoEncontrado?.kilometraje || 0}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Debe ser mayor o igual a {vehiculoEncontrado?.kilometraje?.toLocaleString() || 0} km
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium" style={{color: 'var(--trieste-blue)'}}>
                    Observaciones (opcional)
                  </label>
                  <BotonDictado
                    onDictado={handleDictadoObservaciones}
                    grabando={grabando}
                    procesandoIA={procesandoIA}
                    campoActivo={campoActivo}
                    campo="observaciones"
                    texto="Dictar"
                    size="sm"
                  />
                </div>
                <Textarea
                  value={observacionesKm}
                  onChange={(e) => setObservacionesKm(e.target.value)}
                  placeholder="Observaciones sobre la entrada al taller..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={saltarActualizacionKm}
                  className="flex-1"
                >
                  No actualizar
                </Button>
                <Button 
                  onClick={actualizarKilometraje}
                  className="btn-primary flex-1"
                  disabled={!nuevoKilometraje || isNaN(nuevoKilometraje)}
                >
                  Actualizar y Continuar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [ordenesRecientes, setOrdenesRecientes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      const [statsRes, ordenesRes] = await Promise.all([
        axios.get(`${API}/dashboard/estadisticas`),
        axios.get(`${API}/ordenes?filtro=activas`)
      ]);
      
      setEstadisticas(statsRes.data);
      setOrdenesRecientes(ordenesRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error cargando el dashboard');
    }
  };

  // CONFIGURACIÓN GLOBAL DE COLORES - TODOS LOS BADGES AZULES CON TEXTO BLANCO
  const badgeStyleAzul = "bg-blue-600 text-white hover:bg-blue-700 border-blue-600";
  
  const getEstadoBadge = (estado) => {
    const estadoConfig = {
      'recibido': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3 h-3" /> },
      'diagnosticando': { color: 'bg-yellow-100 text-yellow-800', icon: <Search className="w-3 h-3" /> },
      'presupuestado': { color: 'bg-purple-100 text-purple-800', icon: <AlertCircle className="w-3 h-3" /> },
      'aprobado': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      'en_reparacion': { color: 'bg-orange-100 text-orange-800', icon: <Wrench className="w-3 h-3" /> },
      'terminado': { color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-3 h-3" /> },
      'entregado': { color: 'bg-green-500 text-white', icon: <CheckCircle className="w-3 h-3" /> }
    };
    
    const config = estadoConfig[estado] || estadoConfig['recibido'];
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {estado.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (!estadisticas) {
    return <div className="flex items-center justify-center h-screen">Cargando dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard del Taller</h1>
      </div>

      {/* Búsqueda Principal por Matrícula */}
      <BusquedaMatricula />

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card-blue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Órdenes Activas</CardTitle>
            <ClipboardList className="large-icon text-yellow-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{estadisticas.ordenes_activas}</div>
            <p className="text-xs text-yellow-200">En proceso actualmente</p>
          </CardContent>
        </Card>

        <Card className="stat-card-yellow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{color: 'var(--trieste-blue)'}}>Total Órdenes</CardTitle>
            <Truck className="large-icon" style={{color: 'var(--trieste-blue)'}} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{color: 'var(--trieste-blue)'}}>{estadisticas.total_ordenes}</div>
            <p className="text-xs" style={{color: 'var(--trieste-blue)'}}>Órdenes registradas</p>
          </CardContent>
        </Card>

        <Card className="stat-card-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{color: 'var(--trieste-blue)'}}>Vehículos</CardTitle>
            <Car className="large-icon" style={{color: 'var(--trieste-blue)'}} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{color: 'var(--trieste-blue)'}}>{estadisticas.total_vehiculos}</div>
            <p className="text-xs" style={{color: 'var(--trieste-text-light)'}}>En base de datos</p>
          </CardContent>
        </Card>

        <Card className="stat-card-blue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Clientes</CardTitle>
            <Users className="large-icon text-yellow-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{estadisticas.total_clientes}</div>
            <p className="text-xs text-yellow-200">Empresas registradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Órdenes Recientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Órdenes de Trabajo Recientes</CardTitle>
              <CardDescription>Últimas órdenes ingresadas al sistema</CardDescription>
            </div>
            <Button onClick={() => navigate('/ordenes')} variant="outline">
              Ver Todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ordenesRecientes.map((orden) => (
              <div key={orden.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">Orden #{orden.id.slice(-8)}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(orden.fecha_ingreso).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Diagnóstico:</p>
                  <p className="text-sm">{orden.diagnostico || 'Pendiente'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getEstadoBadge(orden.estado)}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/orden/${orden.id}`)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Gestión de Órdenes de Trabajo
const OrdenesListado = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [tabActiva, setTabActiva] = useState('activas');
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarOrdenes(tabActiva);
  }, [tabActiva]);

  const cargarOrdenes = async (filtro = 'activas') => {
    setCargando(true);
    try {
      const response = await axios.get(`${API}/ordenes?filtro=${filtro}`);
      setOrdenes(response.data);
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      toast.error('Error cargando las órdenes');
    } finally {
      setCargando(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const estadoConfig = {
      'recibido': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3 h-3" /> },
      'diagnosticando': { color: 'bg-yellow-100 text-yellow-800', icon: <Search className="w-3 h-3" /> },
      'presupuestado': { color: 'bg-purple-100 text-purple-800', icon: <FileText className="w-3 h-3" /> },
      'aprobado': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      'en_reparacion': { color: 'bg-orange-100 text-orange-800', icon: <Wrench className="w-3 h-3" /> },
      'terminado': { color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-3 h-3" /> },
      'entregado': { color: 'bg-green-500 text-white', icon: <CheckCircle className="w-3 h-3" /> }
    };
    
    const config = estadoConfig[estado] || estadoConfig['recibido'];
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {estado.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-screen">Cargando órdenes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Órdenes de Trabajo</h1>
        <Button onClick={() => navigate('/registro')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Pestañas */}
      <Tabs value={tabActiva} onValueChange={setTabActiva} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activas" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Activas ({ordenes.length})
          </TabsTrigger>
          <TabsTrigger value="entregadas" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activas" className="space-y-4">
          <div className="text-sm text-gray-600">
            Órdenes en proceso: recibidas, diagnosticando, presupuestadas, aprobadas, en reparación y terminadas
          </div>
        </TabsContent>

        <TabsContent value="entregadas" className="space-y-4">
          <div className="text-sm text-gray-600">
            Historial de órdenes completadas y entregadas al cliente
          </div>
        </TabsContent>
      </Tabs>

      {/* Lista de Órdenes */}
      <div className="grid gap-4">
        {ordenes.map((orden) => (
          <Card key={orden.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Orden #{orden.id.slice(-8)}</h3>
                    {getEstadoBadge(orden.estado)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Ingreso: {new Date(orden.fecha_ingreso).toLocaleDateString('es-ES')}
                  </p>
                  {orden.diagnostico && (
                    <p className="text-sm"><strong>Diagnóstico:</strong> {orden.diagnostico}</p>
                  )}
                  {orden.presupuesto_total && (
                    <p className="text-sm"><strong>Presupuesto:</strong> ${orden.presupuesto_total.toFixed(2)}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/orden/${orden.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ordenes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay órdenes para mostrar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Detalle de Orden de Trabajo (mejorado con presupuestos)
const OrdenDetalle = () => {
  const { ordenId } = useParams();
  const [orden, setOrden] = useState(null);
  const [vehiculo, setVehiculo] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [mecanicos, setMecanicos] = useState([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para agregar servicios
  const [mostrarAgregarServicio, setMostrarAgregarServicio] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [cantidadServicio, setCantidadServicio] = useState(1);
  
  const navigate = useNavigate();

  useEffect(() => {
    cargarDetalles();
  }, [ordenId]);

  const cargarDetalles = async () => {
    try {
      const [ordenRes, mecanicosRes, serviciosRes] = await Promise.all([
        axios.get(`${API}/ordenes/${ordenId}`),
        axios.get(`${API}/mecanicos/activos`),
        axios.get(`${API}/servicios-repuestos`)
      ]);
      
      const ordenData = ordenRes.data;
      setOrden(ordenData);
      setMecanicos(mecanicosRes.data);
      setServiciosDisponibles(serviciosRes.data);

      // Cargar datos del vehículo y cliente
      try {
        const vehiculoRes = await axios.get(`${API}/vehiculos/${ordenData.vehiculo_id}`);
        setVehiculo(vehiculoRes.data);
      } catch (vehiculoError) {
        console.error('Error cargando vehículo:', vehiculoError);
        toast.error(`Error cargando vehículo: ${vehiculoError.response?.data?.detail || vehiculoError.message}`);
      }

      try {
        const clienteRes = await axios.get(`${API}/clientes/${ordenData.cliente_id}`);
        setCliente(clienteRes.data);
      } catch (clienteError) {
        console.error('Error cargando cliente:', clienteError);
        toast.error(`Error cargando cliente: ${clienteError.response?.data?.detail || clienteError.message}`);
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
      toast.error('Error cargando los detalles de la orden');
    } finally {
      setCargando(false);
    }
  };

  // OrdenDetalle está en modo SOLO LECTURA - todas las funciones de edición fueron movidas a OrdenEditar

  // OrdenDetalle está en modo SOLO LECTURA - las funciones de edición están en OrdenEditar

  const getEstadoBadge = (estado) => {
    const estadoConfig = {
      'recibido': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3 h-3" /> },
      'diagnosticando': { color: 'bg-yellow-100 text-yellow-800', icon: <Search className="w-3 h-3" /> },
      'presupuestado': { color: 'bg-purple-100 text-purple-800', icon: <FileText className="w-3 h-3" /> },
      'aprobado': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      'en_reparacion': { color: 'bg-orange-100 text-orange-800', icon: <Wrench className="w-3 h-3" /> },
      'terminado': { color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-3 h-3" /> },
      'entregado': { color: 'bg-green-500 text-white', icon: <CheckCircle className="w-3 h-3" /> }
    };
    
    const config = estadoConfig[estado] || estadoConfig['recibido'];
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {estado.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-screen">Cargando detalles...</div>;
  }

  if (!orden) {
    return <div className="text-center py-8">Orden no encontrada</div>;
  }

  const mecanicoAsignado = mecanicos.find(m => m.id === orden.mecanico_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orden #{orden.id.slice(-8)}</h1>
          <p className="text-gray-600 mt-1">
            Creada el {new Date(orden.fecha_ingreso).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getEstadoBadge(orden.estado)}
          <Button 
            onClick={() => navigate(`/orden/${orden.id}/editar`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button onClick={() => navigate('/ordenes')} variant="outline">
            Volver
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Cliente y Vehículo */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cliente && (
                <div className="space-y-2">
                  <p><strong>Nombre:</strong> {cliente.nombre}</p>
                  {cliente.empresa && <p><strong>Empresa:</strong> {cliente.empresa}</p>}
                  {cliente.telefono && (
                    <p className="flex items-center gap-2">
                      <strong>Teléfono:</strong> {cliente.telefono}
                      <Button size="sm" variant="outline">
                        <PhoneCall className="w-3 h-3" />
                      </Button>
                    </p>
                  )}
                  {cliente.email && <p><strong>Email:</strong> {cliente.email}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Información del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehiculo && (
                <div className="space-y-2">
                  <p><strong>Matrícula:</strong> {vehiculo.matricula}</p>
                  <p><strong>Marca/Modelo:</strong> {vehiculo.marca} {vehiculo.modelo}</p>
                  {vehiculo.año && <p><strong>Año:</strong> {vehiculo.año}</p>}
                  {vehiculo.color && <p><strong>Color:</strong> {vehiculo.color}</p>}
                  {vehiculo.kilometraje && <p><strong>Kilometraje:</strong> {vehiculo.kilometraje.toLocaleString()} km</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico y Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Diagnóstico</label>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {orden.diagnostico || 'Sin diagnóstico registrado'}
                  </p>
                </div>
                {orden.observaciones && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Observaciones</label>
                    <p className="text-sm bg-gray-50 p-3 rounded">{orden.observaciones}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Control - SOLO LECTURA */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                {getEstadoBadge(orden.estado)}
                <p className="text-sm text-gray-600 mt-2">
                  Estado actual de la orden
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mecánico Asignado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mecanicoAsignado ? (
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="font-medium text-green-800">{mecanicoAsignado.nombre}</p>
                    <p className="text-sm text-green-600">Especialidad: {mecanicoAsignado.especialidad}</p>
                    {mecanicoAsignado.telefono && (
                      <p className="text-sm text-green-600">Tel: {mecanicoAsignado.telefono}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-gray-600">Sin mecánico asignado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {orden.presupuesto_total && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Presupuesto Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${orden.presupuesto_total.toFixed(2)}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {orden.aprobado_cliente ? 'Aprobado por cliente' : 'Pendiente de aprobación'}
                </p>
                {!orden.aprobado_cliente && orden.presupuesto_total > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-700">
                      💡 Para aprobar/rechazar el presupuesto, usa el modo de edición
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Servicios y Repuestos - SOLO LECTURA */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios y Repuestos</CardTitle>
            </CardHeader>
            <CardContent>
              {orden.servicios_repuestos && orden.servicios_repuestos.length > 0 ? (
                <div className="space-y-3">
                  {orden.servicios_repuestos.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.nombre}</h4>
                          <Badge className={COLORES_SISTEMA.badgeAzul}>
                            {item.tipo}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.cantidad} × ${item.precio_unitario.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-600">
                          ${item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total del Presupuesto:</span>
                      <span className="text-green-600">${orden.presupuesto_total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No hay servicios agregados a esta orden</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Edición de Orden de Trabajo
const OrdenEditar = () => {
  const { ordenId } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [vehiculo, setVehiculo] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [mecanicos, setMecanicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // Estados editables
  const [diagnostico, setDiagnostico] = useState('');
  const [fallas, setFallas] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [mecanicoAsignado, setMecanicoAsignado] = useState('');
  const [estado, setEstado] = useState('');
  const [reparacionesRealizadas, setReparacionesRealizadas] = useState('');
  const [repuestosUtilizados, setRepuestosUtilizados] = useState('');
  
  // Estados para servicios y repuestos
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [repuestosExternos, setRepuestosExternos] = useState([]);
  const [nuevoRepuestoExterno, setNuevoRepuestoExterno] = useState({
    nombre: '',
    precio_usd: '',
    cantidad: 1,
    observaciones: ''
  });
  const [mostrarFormRepuesto, setMostrarFormRepuesto] = useState(false);

  // Estados para dictado
  const [grabando, setGrabando] = useState(false);
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [campoActivo, setCampoActivo] = useState('');

  useEffect(() => {
    cargarDatosOrden();
    cargarMecanicos();
    cargarServiciosDisponibles();
  }, [ordenId]);

  const cargarDatosOrden = async () => {
    try {
      const ordenRes = await axios.get(`${API}/ordenes/${ordenId}`);
      const ordenData = ordenRes.data;
      setOrden(ordenData);
      
      // Cargar datos del vehículo y cliente
      const [vehiculoRes, clienteRes] = await Promise.all([
        axios.get(`${API}/vehiculos/${ordenData.vehiculo_id}`),
        axios.get(`${API}/clientes/${ordenData.cliente_id}`)
      ]);
      
      setVehiculo(vehiculoRes.data);
      setCliente(clienteRes.data);
      
      // Pre-llenar campos editables
      setDiagnostico(ordenData.diagnostico || '');
      setFallas(ordenData.fallas || '');
      setObservaciones(ordenData.observaciones || '');
      setMecanicoAsignado(ordenData.mecanico_id || '');
      setEstado(ordenData.estado || '');
      setReparacionesRealizadas(ordenData.reparaciones_realizadas || '');
      setRepuestosUtilizados(ordenData.repuestos_utilizados || '');
      
      // Cargar servicios y repuestos existentes
      if (ordenData.servicios_repuestos && ordenData.servicios_repuestos.length > 0) {
        const serviciosTaller = ordenData.servicios_repuestos.filter(item => item.origen === 'taller');
        const repuestosExt = ordenData.servicios_repuestos.filter(item => item.origen === 'externo');
        
        setServiciosSeleccionados(serviciosTaller);
        setRepuestosExternos(repuestosExt);
      }
      
    } catch (error) {
      console.error('Error cargando orden:', error);
      toast.error('Error cargando los datos de la orden');
    } finally {
      setCargando(false);
    }
  };

  const cargarMecanicos = async () => {
    try {
      const response = await axios.get(`${API}/mecanicos/activos`);
      setMecanicos(response.data);
    } catch (error) {
      console.error('Error cargando mecánicos:', error);
    }
  };

  const cargarServiciosDisponibles = async () => {
    try {
      const response = await axios.get(`${API}/servicios-repuestos/activos`);
      setServiciosDisponibles(response.data);
    } catch (error) {
      console.error('Error cargando servicios:', error);
    }
  };

  const agregarServicioSeleccionado = (servicio) => {
    const yaSeleccionado = serviciosSeleccionados.find(s => s.id === servicio.id);
    if (!yaSeleccionado) {
      setServiciosSeleccionados(prev => [...prev, { ...servicio, cantidad: 1 }]);
    }
  };

  const removerServicioSeleccionado = (servicioId) => {
    setServiciosSeleccionados(prev => prev.filter(s => s.id !== servicioId));
  };

  const actualizarCantidadServicio = (servicioId, cantidad) => {
    setServiciosSeleccionados(prev => 
      prev.map(s => s.id === servicioId ? { ...s, cantidad: parseInt(cantidad) || 1 } : s)
    );
  };

  const agregarRepuestoExterno = () => {
    if (!nuevoRepuestoExterno.nombre.trim() || !nuevoRepuestoExterno.precio_usd) {
      toast.error('Completa el nombre y precio del repuesto');
      return;
    }

    const repuesto = {
      id: Date.now().toString(),
      ...nuevoRepuestoExterno,
      precio_usd: parseFloat(nuevoRepuestoExterno.precio_usd),
      tipo: 'externo'
    };

    setRepuestosExternos(prev => [...prev, repuesto]);
    setNuevoRepuestoExterno({
      nombre: '',
      precio_usd: '',
      cantidad: 1,
      observaciones: ''
    });
    setMostrarFormRepuesto(false);
    toast.success('Repuesto externo agregado');
  };

  const removerRepuestoExterno = (repuestoId) => {
    setRepuestosExternos(prev => prev.filter(r => r.id !== repuestoId));
  };

  const calcularTotalServiciosRepuestos = () => {
    const totalServicios = serviciosSeleccionados.reduce((total, servicio) => 
      total + (servicio.precio_usd * servicio.cantidad), 0
    );
    const totalRepuestosExternos = repuestosExternos.reduce((total, repuesto) => 
      total + (repuesto.precio_usd * repuesto.cantidad), 0
    );
    return totalServicios + totalRepuestosExternos;
  };

  // Funciones para dictado de órdenes
  const procesarDictadoOrdenConIA = async (textoDictado) => {
    setProcesandoIA(true);
    toast.info('🤖 Procesando dictado de orden con IA...');
    
    console.log('Texto de orden a procesar:', textoDictado);
    
    try {
      const response = await axios.post(`${API}/ai/procesar-dictado-orden`, {
        texto: textoDictado
      });

      console.log('Respuesta IA orden:', response.data);

      if (response.data.success && response.data.datos) {
        const datos = response.data.datos;
        
        // Llenar campos según lo que detecte la IA
        if (datos.fallas_detectadas && datos.fallas_detectadas.trim()) {
          setFallas(prev => prev ? `${prev}\n\n${datos.fallas_detectadas}` : datos.fallas_detectadas);
        }
        
        if (datos.diagnostico_mecanico && datos.diagnostico_mecanico.trim()) {
          setDiagnostico(prev => prev ? `${prev}\n\n${datos.diagnostico_mecanico}` : datos.diagnostico_mecanico);
        }
        
        if (datos.reparaciones_realizadas && datos.reparaciones_realizadas.trim()) {
          setReparacionesRealizadas(prev => prev ? `${prev}\n\n${datos.reparaciones_realizadas}` : datos.reparaciones_realizadas);
        }
        
        if (datos.repuestos_utilizados && datos.repuestos_utilizados.trim()) {
          setRepuestosUtilizados(prev => prev ? `${prev}\n\n${datos.repuestos_utilizados}` : datos.repuestos_utilizados);
        }
        
        if (datos.observaciones && datos.observaciones.trim()) {
          setObservaciones(prev => prev ? `${prev}\n\n${datos.observaciones}` : datos.observaciones);
        }

        toast.success('✅ Información extraída y aplicada correctamente');
      } else {
        toast.error('❌ La IA no pudo procesar la información: ' + (response.data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error procesando dictado de orden:', error);
      toast.error('❌ Error procesando el dictado: ' + (error.response?.data?.detail || error.message));
    } finally {
      setProcesandoIA(false);
    }
  };

  const handleVoiceInputOrden = async (campo = 'general') => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configuración para dictado de órdenes
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';
      recognition.maxAlternatives = 1;

      let textoFinal = '';
      let textoTemporal = '';
      
      setCampoActivo(campo);
      setGrabando(true);
      toast.info(`🎤 Grabando para ${campo}... Di "finalizar" para procesar`);

      recognition.onresult = (event) => {
        textoTemporal = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            textoFinal += transcript + ' ';
          } else {
            textoTemporal += transcript;
          }
        }

        // Verificar comandos de control
        const textoCompleto = (textoFinal + textoTemporal).toLowerCase();
        
        if (textoCompleto.includes('finalizar') || textoCompleto.includes('terminar') || textoCompleto.includes('procesar')) {
          recognition.stop();
        }
      };

      recognition.onend = () => {
        setGrabando(false);
        setCampoActivo('');
        
        if (textoFinal.trim()) {
          // Limpiar comandos de control del texto
          const textoLimpio = textoFinal
            .replace(/finalizar/gi, '')
            .replace(/terminar/gi, '')
            .replace(/procesar/gi, '')
            .trim();
          
          if (textoLimpio) {
            procesarDictadoOrdenConIA(textoLimpio);
          } else {
            toast.warning('No se detectó información para procesar');
          }
        } else {
          toast.warning('No se capturó audio válido');
        }
      };

      recognition.onerror = (event) => {
        console.error('Error de reconocimiento:', event.error);
        setGrabando(false);
        setCampoActivo('');
        toast.error('Error en el reconocimiento de voz: ' + event.error);
      };

      recognition.start();
    } else {
      toast.error('❌ Reconocimiento de voz no soportado en este navegador');
    }
  };

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      // Combinar servicios y repuestos en un solo array
      const serviciosRepuestosCompletos = [
        ...serviciosSeleccionados.map(s => ({ ...s, origen: 'taller' })),
        ...repuestosExternos.map(r => ({ ...r, origen: 'externo' }))
      ];

      await axios.put(`${API}/ordenes/${ordenId}`, {
        diagnostico: diagnostico,
        fallas: fallas,
        observaciones: observaciones,
        mecanico_id: mecanicoAsignado,
        estado: estado,
        reparaciones_realizadas: reparacionesRealizadas,
        repuestos_utilizados: repuestosUtilizados,
        servicios_repuestos: serviciosRepuestosCompletos
      });
      
      toast.success('Orden actualizada correctamente');
      navigate(`/orden/${ordenId}`);
    } catch (error) {
      console.error('Error guardando cambios:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  if (!orden) {
    return <div className="text-center p-8">Orden no encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Orden #{orden.id?.slice(-8)}</h1>
          <p className="text-gray-600">Modifica los detalles de la orden de trabajo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/orden/${ordenId}`)}>
            Cancelar
          </Button>
          <Button onClick={guardarCambios} disabled={guardando} className="btn-primary">
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Vehículo y Cliente */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Información del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Matrícula:</strong> {vehiculo?.matricula}</p>
              <p><strong>Vehículo:</strong> {vehiculo?.marca} {vehiculo?.modelo}</p>
              <p><strong>Año:</strong> {vehiculo?.año}</p>
              <p><strong>Color:</strong> {vehiculo?.color}</p>
              <p><strong>Kilometraje:</strong> {vehiculo?.kilometraje?.toLocaleString()} km</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Nombre:</strong> {cliente?.nombre}</p>
              <p><strong>Documento:</strong> {cliente?.prefijo_documento}-{cliente?.numero_documento}</p>
              <p><strong>Teléfono:</strong> {cliente?.telefono}</p>
              <p><strong>Email:</strong> {cliente?.email}</p>
              {cliente?.empresa && <p><strong>Empresa:</strong> {cliente?.empresa}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Formulario de Edición */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalles de la Orden</CardTitle>
                <Button
                  onClick={() => handleVoiceInputOrden('general')}
                  disabled={grabando || procesandoIA}
                  variant={grabando && campoActivo === 'general' ? "destructive" : "outline"}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Mic className={`w-4 h-4 ${grabando && campoActivo === 'general' ? 'animate-pulse' : ''}`} />
                  {grabando && campoActivo === 'general' ? 'Escuchando...' : 'Dictar Todo'}
                </Button>
              </div>
              {procesandoIA && (
                <div className="mt-2">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      🤖 Procesando dictado con IA... Esto puede tomar unos segundos.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Diagnóstico */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Diagnóstico Inicial *</label>
                  <Button
                    onClick={() => handleVoiceInputOrden('diagnostico')}
                    disabled={grabando || procesandoIA}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Mic className={`w-3 h-3 ${grabando && campoActivo === 'diagnostico' ? 'animate-pulse text-red-500' : ''}`} />
                    {grabando && campoActivo === 'diagnostico' ? 'Escuchando...' : 'Dictar'}
                  </Button>
                </div>
                <Textarea
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  placeholder="Describe el problema inicial reportado por el cliente..."
                  rows={3}
                />
              </div>

              {/* Fallas Detectadas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Fallas Detectadas</label>
                  <Button
                    onClick={() => handleVoiceInputOrden('fallas')}
                    disabled={grabando || procesandoIA}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Mic className={`w-3 h-3 ${grabando && campoActivo === 'fallas' ? 'animate-pulse text-red-500' : ''}`} />
                    {grabando && campoActivo === 'fallas' ? 'Escuchando...' : 'Dictar'}
                  </Button>
                </div>
                <Textarea
                  value={fallas}
                  onChange={(e) => setFallas(e.target.value)}
                  placeholder="Detalla las fallas encontradas durante la inspección..."
                  rows={4}
                />
              </div>

              {/* Reparaciones Realizadas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Reparaciones Realizadas</label>
                  <Button
                    onClick={() => handleVoiceInputOrden('reparaciones')}
                    disabled={grabando || procesandoIA}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Mic className={`w-3 h-3 ${grabando && campoActivo === 'reparaciones' ? 'animate-pulse text-red-500' : ''}`} />
                    {grabando && campoActivo === 'reparaciones' ? 'Escuchando...' : 'Dictar'}
                  </Button>
                </div>
                <Textarea
                  value={reparacionesRealizadas}
                  onChange={(e) => setReparacionesRealizadas(e.target.value)}
                  placeholder="Describe las reparaciones y trabajos realizados..."
                  rows={4}
                />
              </div>

              {/* Repuestos Utilizados */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Repuestos Utilizados</label>
                  <Button
                    onClick={() => handleVoiceInputOrden('repuestos')}
                    disabled={grabando || procesandoIA}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Mic className={`w-3 h-3 ${grabando && campoActivo === 'repuestos' ? 'animate-pulse text-red-500' : ''}`} />
                    {grabando && campoActivo === 'repuestos' ? 'Escuchando...' : 'Dictar'}
                  </Button>
                </div>
                <Textarea
                  value={repuestosUtilizados}
                  onChange={(e) => setRepuestosUtilizados(e.target.value)}
                  placeholder="Lista los repuestos utilizados con cantidades..."
                  rows={3}
                />
              </div>

              {/* Estado y Mecánico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Estado de la Orden</label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recibido">Recibido</SelectItem>
                      <SelectItem value="diagnosticando">Diagnosticando</SelectItem>
                      <SelectItem value="presupuestado">Presupuestado</SelectItem>
                      <SelectItem value="aprobado">Aprobado</SelectItem>
                      <SelectItem value="en_reparacion">En Reparación</SelectItem>
                      <SelectItem value="terminado">Terminado</SelectItem>
                      <SelectItem value="entregado">Entregado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mecánico Asignado</label>
                  <Select value={mecanicoAsignado} onValueChange={setMecanicoAsignado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mecánico" />
                    </SelectTrigger>
                    <SelectContent>
                      {mecanicos.map((mecanico) => (
                        <SelectItem key={mecanico.id} value={mecanico.id}>
                          {mecanico.nombre} - {mecanico.especialidad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Servicios y Repuestos del Taller */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Servicios y Repuestos</h3>
                  <Badge variant="secondary" className="text-sm">
                    Total: ${calcularTotalServiciosRepuestos().toFixed(2)} USD
                  </Badge>
                </div>

                {/* Servicios del Taller */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Servicios del Taller
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {serviciosDisponibles
                      .filter(servicio => servicio.tipo === 'servicio')
                      .map((servicio) => (
                      <div
                        key={servicio.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          serviciosSeleccionados.find(s => s.id === servicio.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => agregarServicioSeleccionado(servicio)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{servicio.descripcion}</p>
                            <p className="text-xs text-gray-500">${servicio.precio_usd} USD</p>
                          </div>
                          <Plus className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Servicios Seleccionados */}
                  {serviciosSeleccionados.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Servicios Seleccionados:</h5>
                      {serviciosSeleccionados.map((servicio) => (
                        <div key={servicio.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <span className="text-sm">{servicio.descripcion}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={servicio.cantidad}
                              onChange={(e) => actualizarCantidadServicio(servicio.id, e.target.value)}
                              className="w-16 px-2 py-1 text-sm border rounded"
                            />
                            <span className="text-sm font-medium">
                              ${(servicio.precio_usd * servicio.cantidad).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerServicioSeleccionado(servicio.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Repuestos del Taller */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Repuestos del Taller
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {serviciosDisponibles
                      .filter(servicio => servicio.tipo === 'repuesto')
                      .map((repuesto) => (
                      <div
                        key={repuesto.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          serviciosSeleccionados.find(s => s.id === repuesto.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => agregarServicioSeleccionado(repuesto)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{repuesto.descripcion}</p>
                            <p className="text-xs text-gray-500">${repuesto.precio_usd} USD</p>
                          </div>
                          <Plus className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Repuestos Externos */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Repuestos Externos
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarFormRepuesto(!mostrarFormRepuesto)}
                      className="flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </Button>
                  </div>

                  {/* Formulario Repuesto Externo */}
                  {mostrarFormRepuesto && (
                    <div className="p-4 border rounded-lg bg-gray-50 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <Input
                          placeholder="Nombre del repuesto"
                          value={nuevoRepuestoExterno.nombre}
                          onChange={(e) => setNuevoRepuestoExterno(prev => ({ ...prev, nombre: e.target.value }))}
                        />
                        <Input
                          type="number"
                          placeholder="Precio USD"
                          step="0.01"
                          value={nuevoRepuestoExterno.precio_usd}
                          onChange={(e) => setNuevoRepuestoExterno(prev => ({ ...prev, precio_usd: e.target.value }))}
                        />
                        <Input
                          type="number"
                          placeholder="Cantidad"
                          min="1"
                          value={nuevoRepuestoExterno.cantidad}
                          onChange={(e) => setNuevoRepuestoExterno(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
                        />
                        <div className="flex gap-2">
                          <Button onClick={agregarRepuestoExterno} size="sm" className="bg-green-600 hover:bg-green-700">
                            Agregar
                          </Button>
                          <Button variant="outline" onClick={() => setMostrarFormRepuesto(false)} size="sm">
                            Cancelar
                          </Button>
                        </div>
                      </div>
                      <Input
                        className="mt-2"
                        placeholder="Observaciones (opcional)"
                        value={nuevoRepuestoExterno.observaciones}
                        onChange={(e) => setNuevoRepuestoExterno(prev => ({ ...prev, observaciones: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Lista Repuestos Externos */}
                  {repuestosExternos.length > 0 && (
                    <div className="space-y-2">
                      {repuestosExternos.map((repuesto) => (
                        <div key={repuesto.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                          <div>
                            <p className="font-medium text-sm">{repuesto.nombre}</p>
                            <p className="text-xs text-gray-600">
                              Cantidad: {repuesto.cantidad} - ${repuesto.precio_usd} c/u
                            </p>
                            {repuesto.observaciones && (
                              <p className="text-xs text-gray-500">{repuesto.observaciones}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              ${(repuesto.precio_usd * repuesto.cantidad).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerRepuestoExterno(repuesto.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium mb-2">Observaciones Adicionales</label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales, recomendaciones, etc..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Gestión de Servicios y Repuestos
const ServiciosRepuestos = () => {
  const [items, setItems] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoItem, setEditandoItem] = useState(null);
  const [nuevoItem, setNuevoItem] = useState({
    tipo: 'servicio',
    nombre: '',
    descripcion: '',
    precio: ''
  });

  // Hook de dictado
  const { grabando, procesandoIA, campoActivo, iniciarDictado } = useDictado();

  // Función para manejar dictado de servicios
  const handleDictadoServicio = async () => {
    const resultado = await iniciarDictado('servicio', 'servicio');
    if (resultado.success && resultado.datos) {
      const datos = resultado.datos;
      setNuevoItem(prev => ({
        ...prev,
        tipo: datos.tipo || prev.tipo,
        nombre: datos.nombre || prev.nombre,
        descripcion: datos.descripcion || prev.descripcion,
        precio: datos.precio ? String(datos.precio) : prev.precio
      }));
    }
  };

  useEffect(() => {
    cargarItems();
  }, []);

  const cargarItems = async () => {
    try {
      const response = await axios.get(`${API}/servicios-repuestos`);
      setItems(response.data);
    } catch (error) {
      console.error('Error cargando servicios y repuestos:', error);
      toast.error('Error cargando el catálogo');
    }
  };

  const guardarItem = async () => {
    try {
      const itemData = {
        ...nuevoItem,
        precio: parseFloat(nuevoItem.precio)
      };

      if (editandoItem) {
        await axios.put(`${API}/servicios-repuestos/${editandoItem.id}`, itemData);
        toast.success('Item actualizado correctamente');
      } else {
        await axios.post(`${API}/servicios-repuestos`, itemData);
        toast.success('Item agregado correctamente');
      }

      setNuevoItem({ tipo: 'servicio', nombre: '', descripcion: '', precio: '' });
      setEditandoItem(null);
      setMostrarFormulario(false);
      cargarItems();
    } catch (error) {
      console.error('Error guardando item:', error);
      toast.error('Error al guardar el item');
    }
  };

  const editarItem = (item) => {
    setNuevoItem({
      tipo: item.tipo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      precio: item.precio.toString()
    });
    setEditandoItem(item);
    setMostrarFormulario(true);
  };

  const eliminarItem = async (itemId) => {
    if (window.confirm('¿Está seguro de eliminar este item del catálogo?')) {
      try {
        await axios.delete(`${API}/servicios-repuestos/${itemId}`);
        toast.success('Item eliminado correctamente');
        cargarItems();
      } catch (error) {
        console.error('Error eliminando item:', error);
        toast.error('Error al eliminar el item');
      }
    }
  };

  const itemsFiltrados = items.filter(item => {
    if (filtroTipo === 'todos') return true;
    return item.tipo === filtroTipo;
  });

  const servicios = items.filter(item => item.tipo === 'servicio');
  const repuestos = items.filter(item => item.tipo === 'repuesto');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Catálogo de Servicios y Repuestos</h1>
        <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {editandoItem ? 'Editar Item' : 'Agregar Nuevo Item'}
                </DialogTitle>
                <BotonDictado
                  onDictado={handleDictadoServicio}
                  grabando={grabando}
                  procesandoIA={procesandoIA}
                  campoActivo={campoActivo}
                  campo="servicio"
                  texto="Dictar"
                  size="sm"
                />
              </div>
              {procesandoIA && (
                <div className="mt-2">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      🤖 Procesando dictado de servicio/repuesto...
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo *</label>
                <Select 
                  value={nuevoItem.tipo}
                  onValueChange={(value) => setNuevoItem(prev => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="servicio">Servicio</SelectItem>
                    <SelectItem value="repuesto">Repuesto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Nombre *</label>
                <Input
                  value={nuevoItem.nombre}
                  onChange={(e) => setNuevoItem(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Cambio de aceite, Filtro de aire"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <Textarea
                  value={nuevoItem.descripcion}
                  onChange={(e) => setNuevoItem(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción detallada del servicio o repuesto"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Precio (USD) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={nuevoItem.precio}
                  onChange={(e) => setNuevoItem(prev => ({ ...prev, precio: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setMostrarFormulario(false);
                    setEditandoItem(null);
                    setNuevoItem({ tipo: 'servicio', nombre: '', descripcion: '', precio: '' });
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={guardarItem}
                  disabled={!nuevoItem.nombre || !nuevoItem.precio}
                >
                  {editandoItem ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{items.length}</div>
            <p className="text-sm text-gray-600">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{servicios.length}</div>
            <p className="text-sm text-gray-600">Servicios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{repuestos.length}</div>
            <p className="text-sm text-gray-600">Repuestos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${items.length > 0 ? (items.reduce((sum, item) => sum + item.precio, 0) / items.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-sm text-gray-600">Precio Promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={filtroTipo === 'todos' ? 'default' : 'outline'}
          onClick={() => setFiltroTipo('todos')}
        >
          Todos ({items.length})
        </Button>
        <Button 
          variant={filtroTipo === 'servicio' ? 'default' : 'outline'}
          onClick={() => setFiltroTipo('servicio')}
        >
          Servicios ({servicios.length})
        </Button>
        <Button 
          variant={filtroTipo === 'repuesto' ? 'default' : 'outline'}
          onClick={() => setFiltroTipo('repuesto')}
        >
          Repuestos ({repuestos.length})
        </Button>
      </div>

      {/* Lista de Items */}
      <div className="grid gap-4">
        {itemsFiltrados.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${COLORES_SISTEMA.iconoAzul}`}>
                    {item.tipo === 'servicio' ? <Wrench className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{item.nombre}</h3>
                      <Badge className={COLORES_SISTEMA.badgeAzul}>
                        {item.tipo === 'servicio' ? 'Servicio' : 'Repuesto'}
                      </Badge>
                    </div>
                    {item.descripcion && (
                      <p className="text-sm text-gray-600 mt-1">{item.descripcion}</p>
                    )}
                    <p className="text-lg font-bold text-green-600 mt-2">
                      ${item.precio.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editarItem(item)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eliminarItem(item.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {itemsFiltrados.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {filtroTipo === 'todos' 
                ? 'No hay items en el catálogo' 
                : `No hay ${filtroTipo}s registrados`}
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setMostrarFormulario(true)}
            >
              Agregar Primer Item
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Gestión de Mecánicos (mejorado con estados y WhatsApp)
const MecanicosList = () => {
  const [mecanicos, setMecanicos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoMecanico, setEditandoMecanico] = useState(null);
  const [nuevoMecanico, setNuevoMecanico] = useState({
    nombre: '', 
    especialidad: [], // CAMBIADO: Array para múltiples especialidades
    telefono: '', 
    whatsapp: '', 
    estado: 'disponible', 
    activo: true, 
    avatar: ''
  });

  // Hook de dictado
  const { grabando, procesandoIA, campoActivo, iniciarDictado } = useDictado();

  // Función para manejar dictado de mecánicos
  const handleDictadoMecanico = async () => {
    const resultado = await iniciarDictado('mecanico', 'mecanico');
    if (resultado.success && resultado.datos) {
      const datos = resultado.datos;
      setNuevoMecanico(prev => ({
        ...prev,
        nombre: datos.nombre || prev.nombre,
        especialidad: datos.especialidad || prev.especialidad,
        telefono: datos.telefono || prev.telefono,
        whatsapp: datos.whatsapp || prev.whatsapp,
        estado: datos.estado || prev.estado
      }));
    }
  };

  useEffect(() => {
    cargarMecanicos();
  }, []);

  const cargarMecanicos = async () => {
    try {
      const response = await axios.get(`${API}/mecanicos`);
      setMecanicos(response.data);
    } catch (error) {
      console.error('Error cargando mecánicos:', error);
      toast.error('Error cargando los mecánicos');
    }
  };

  const guardarMecanico = async () => {
    try {
      // Validar que haya al menos una especialidad
      if (!nuevoMecanico.especialidad || nuevoMecanico.especialidad.length === 0) {
        toast.error('Debe seleccionar al menos una especialidad');
        return;
      }

      // Validar teléfonos
      if (nuevoMecanico.telefono && !validarTelefono(nuevoMecanico.telefono)) {
        toast.error('Formato de teléfono inválido. Use 0000-000.00.00');
        return;
      }
      if (nuevoMecanico.whatsapp && !validarTelefono(nuevoMecanico.whatsapp)) {
        toast.error('Formato de WhatsApp inválido. Use 0000-000.00.00');
        return;
      }

      const mecanicoData = {
        ...nuevoMecanico,
        // Convertir array de especialidades a string para el backend (temporalmente)
        especialidad: Array.isArray(nuevoMecanico.especialidad) 
          ? nuevoMecanico.especialidad.join(', ') 
          : nuevoMecanico.especialidad,
        telefono: nuevoMecanico.telefono ? formatearTelefono(nuevoMecanico.telefono) : null,
        whatsapp: nuevoMecanico.whatsapp ? formatearTelefono(nuevoMecanico.whatsapp) : null
      };

      if (editandoMecanico) {
        await axios.put(`${API}/mecanicos/${editandoMecanico.id}`, mecanicoData);
        toast.success('Mecánico actualizado correctamente');
      } else {
        await axios.post(`${API}/mecanicos`, mecanicoData);
        toast.success('Mecánico agregado correctamente');
      }
      
      setNuevoMecanico({ nombre: '', especialidad: [], telefono: '', whatsapp: '', estado: 'disponible', activo: true, avatar: '' });
      setEditandoMecanico(null);
      setMostrarFormulario(false);
      cargarMecanicos();
    } catch (error) {
      console.error('Error guardando mecánico:', error);
      toast.error('Error guardando el mecánico');
    }
  };

  const cambiarEstadoMecanico = async (mecanicoId, nuevoEstado) => {
    try {
      await axios.put(`${API}/mecanicos/${mecanicoId}`, { estado: nuevoEstado });
      setMecanicos(prev => prev.map(m => 
        m.id === mecanicoId ? { ...m, estado: nuevoEstado } : m
      ));
      toast.success(`Estado cambiado a ${nuevoEstado.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      toast.error('Error al cambiar el estado');
    }
  };

  const editarMecanico = (mecanico) => {
    // Manejar especialidades - convertir string a array si es necesario
    let especialidadesArray;
    if (Array.isArray(mecanico.especialidad)) {
      especialidadesArray = mecanico.especialidad;
    } else if (typeof mecanico.especialidad === 'string') {
      // Si contiene comas, dividir. Si no, crear array con un elemento
      especialidadesArray = mecanico.especialidad.includes(',')
        ? mecanico.especialidad.split(',').map(e => e.trim())
        : [mecanico.especialidad];
    } else {
      especialidadesArray = [];
    }

    setNuevoMecanico({
      nombre: mecanico.nombre,
      especialidad: especialidadesArray,
      telefono: mecanico.telefono || '',
      whatsapp: mecanico.whatsapp || '',
      estado: mecanico.estado || 'disponible',
      activo: mecanico.activo,
      avatar: mecanico.avatar || ''
    });
    setEditandoMecanico(mecanico);
    setMostrarFormulario(true);
  };

  const eliminarMecanico = async (mecanico) => {
    const confirmar = window.confirm(
      `¿Está seguro de que desea eliminar al mecánico "${mecanico.nombre}"?\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmar) return;

    try {
      await axios.delete(`${API}/mecanicos/${mecanico.id}`);
      toast.success('Mecánico eliminado correctamente');
      cargarMecanicos();
    } catch (error) {
      console.error('Error eliminando mecánico:', error);
      toast.error('Error eliminando el mecánico');
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('La imagen debe ser menor a 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setNuevoMecanico(prev => ({ ...prev, avatar: e.target.result }));
        toast.success('Imagen cargada correctamente');
      };
      reader.readAsDataURL(file);
    }
  };

  const especialidades = [
    'motor', 'transmision', 'frenos', 'electricidad', 'suspension', 
    'climatizacion', 'neumaticos', 'carroceria', 'general'
  ];

  const estadosMecanico = [
    { valor: 'disponible', label: 'Disponible', color: 'bg-green-500', textColor: 'text-green-800' },
    { valor: 'fuera_servicio', label: 'Fuera de Servicio', color: 'bg-orange-500', textColor: 'text-orange-800' },
    { valor: 'vacaciones', label: 'Vacaciones', color: 'bg-blue-500', textColor: 'text-blue-800' },
    { valor: 'inactivo', label: 'Inactivo', color: 'bg-gray-500', textColor: 'text-gray-800' }
  ];

  const getEstadoConfig = (estado) => {
    return estadosMecanico.find(e => e.valor === estado) || estadosMecanico[0];
  };

  const getAvatarUrl = (avatar, nombre) => {
    if (avatar) return avatar;
    // Generar avatar por defecto con iniciales
    const iniciales = nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return `https://ui-avatars.com/api/?name=${iniciales}&background=000066&color=fcdf0c&size=80&font-size=0.4`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mecánicos Especialistas</h1>
        <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Mecánico
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md dialog-content">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle style={{color: 'var(--trieste-blue)'}}>
                  {editandoMecanico ? 'Editar Mecánico' : 'Agregar Nuevo Mecánico'}
                </DialogTitle>
                <BotonDictado
                  onDictado={handleDictadoMecanico}
                  grabando={grabando}
                  procesandoIA={procesandoIA}
                  campoActivo={campoActivo}
                  campo="mecanico"
                  texto="Dictar"
                  size="sm"
                />
              </div>
              {procesandoIA && (
                <div className="mt-2">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      🤖 Procesando dictado de mecánico...
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </DialogHeader>
            <div className="space-y-4">
              {/* Avatar Section */}
              <div className="text-center">
                <div className="mb-3">
                  <img
                    src={getAvatarUrl(nuevoMecanico.avatar, nuevoMecanico.nombre || 'NM')}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full mx-auto border-2"
                    style={{borderColor: 'var(--trieste-blue)'}}
                  />
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                      <span>
                        <Camera className="w-4 h-4 mr-2" />
                        Cambiar Avatar
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--trieste-blue)'}}>
                  Nombre *
                </label>
                <Input
                  value={nuevoMecanico.nombre}
                  onChange={(e) => setNuevoMecanico(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre completo del mecánico"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--trieste-blue)'}}>
                  Especialidades * (máximo 3)
                </label>
                <div className="space-y-2">
                  {/* Especialidades seleccionadas */}
                  {nuevoMecanico.especialidad.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {nuevoMecanico.especialidad.map((esp, index) => (
                        <Badge 
                          key={index} 
                          className={`${COLORES_SISTEMA.badgeAzul} cursor-pointer`}
                          onClick={() => {
                            const nuevasEspecialidades = nuevoMecanico.especialidad.filter((_, i) => i !== index);
                            setNuevoMecanico(prev => ({ ...prev, especialidad: nuevasEspecialidades }));
                          }}
                        >
                          {esp.charAt(0).toUpperCase() + esp.slice(1)}
                          <span className="ml-1">×</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Selector para agregar especialidades */}
                  {nuevoMecanico.especialidad.length < 3 && (
                    <Select 
                      value=""
                      onValueChange={(value) => {
                        if (value && !nuevoMecanico.especialidad.includes(value)) {
                          setNuevoMecanico(prev => ({ 
                            ...prev, 
                            especialidad: [...prev.especialidad, value]
                          }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Agregar especialidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {especialidades
                          .filter(esp => !nuevoMecanico.especialidad.includes(esp))
                          .map((esp) => (
                            <SelectItem key={esp} value={esp}>
                              {esp.charAt(0).toUpperCase() + esp.slice(1)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Click en las especialidades para removerlas. Máximo 3 especialidades.
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--trieste-blue)'}}>
                  Teléfono
                </label>
                <Input
                  value={nuevoMecanico.telefono}
                  onChange={(e) => setNuevoMecanico(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="0000-000.00.00"
                  maxLength={15}
                />
                <p className="text-xs text-gray-500 mt-1">Formato: 0000-000.00.00</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--trieste-blue)'}}>
                  WhatsApp
                </label>
                <Input
                  value={nuevoMecanico.whatsapp}
                  onChange={(e) => setNuevoMecanico(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="0000-000.00.00"
                  maxLength={15}
                />
                <p className="text-xs text-gray-500 mt-1">Número de WhatsApp (opcional)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--trieste-blue)'}}>
                  Estado Actual *
                </label>
                <Select 
                  value={nuevoMecanico.estado}
                  onValueChange={(value) => setNuevoMecanico(prev => ({ ...prev, estado: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosMecanico.map((estado) => (
                      <SelectItem key={estado.valor} value={estado.valor}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${estado.color}`}></div>
                          {estado.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setMostrarFormulario(false);
                    setEditandoMecanico(null);
                    setNuevoMecanico({ nombre: '', especialidad: [], telefono: '', whatsapp: '', estado: 'disponible', activo: true, avatar: '' });
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={guardarMecanico}
                  disabled={!nuevoMecanico.nombre || !nuevoMecanico.especialidad.length}
                  className="btn-primary"
                >
                  {editandoMecanico ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mecanicos.map((mecanico) => (
          <Card key={mecanico.id} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={getAvatarUrl(mecanico.avatar, mecanico.nombre)}
                    alt={`Avatar de ${mecanico.nombre}`}
                    className="w-12 h-12 rounded-full border-2"
                    style={{borderColor: 'var(--trieste-blue)'}}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getEstadoConfig(mecanico.estado || 'disponible').color}`}></div>
                      <h3 className="font-semibold" style={{color: 'var(--trieste-blue)'}}>{mecanico.nombre}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(() => {
                        // Manejar tanto arrays como strings para compatibilidad
                        let especialidades;
                        if (Array.isArray(mecanico.especialidad)) {
                          especialidades = mecanico.especialidad;
                        } else if (typeof mecanico.especialidad === 'string') {
                          // Si contiene comas, dividir. Si no, crear array con un elemento
                          especialidades = mecanico.especialidad.includes(',') 
                            ? mecanico.especialidad.split(',').map(e => e.trim())
                            : [mecanico.especialidad];
                        } else {
                          especialidades = ['Sin especialidad'];
                        }
                        
                        return especialidades.map((esp, index) => (
                          <Badge key={index} className={COLORES_SISTEMA.badgeAzul}>
                            {esp.charAt(0).toUpperCase() + esp.slice(1)}
                          </Badge>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Select 
                    value={mecanico.estado || 'disponible'} 
                    onValueChange={(nuevoEstado) => cambiarEstadoMecanico(mecanico.id, nuevoEstado)}
                  >
                    <SelectTrigger className="w-auto h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {estadosMecanico.map((estado) => (
                        <SelectItem key={estado.valor} value={estado.valor}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${estado.color}`}></div>
                            {estado.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editarMecanico(mecanico)}
                    className="h-8 w-8 p-0 border-blue-200 hover:bg-blue-50"
                    title="Editar mecánico"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eliminarMecanico(mecanico)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    title="Eliminar mecánico"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 mb-3">
                {mecanico.telefono && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <PhoneCall className="w-3 h-3" />
                    <span>{formatearTelefono(mecanico.telefono)}</span>
                  </div>
                )}
                
                {mecanico.whatsapp && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
                    </svg>
                    <span>{formatearTelefono(mecanico.whatsapp)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Agregado: {formatearFecha(mecanico.created_at)}</span>
                <Badge 
                  variant="outline" 
                  className={`${getEstadoConfig(mecanico.estado || 'disponible').textColor} border-current`}
                >
                  {getEstadoConfig(mecanico.estado || 'disponible').label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mecanicos.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay mecánicos registrados</p>
            <Button 
              className="mt-4" 
              onClick={() => setMostrarFormulario(true)}
            >
              Agregar Primer Mecánico
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Registro de Vehículo con IA (mejorado)
const RegistroVehiculo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [paso, setPaso] = useState(1);
  const [cliente, setCliente] = useState({ 
    nombre: '', 
    tipo_documento: 'CI', 
    prefijo_documento: 'V', 
    numero_documento: '',
    telefono: '', 
    telefono_secundario: '',
    direccion_fiscal: '',
    empresa: '', 
    email: '' 
  });
  const [vehiculo, setVehiculo] = useState({ 
    matricula: '', 
    marca: '', 
    modelo: '', 
    año: '', 
    color: '', 
    kilometraje: '',
    tipo_combustible: '',
    serial_niv: '',
    tara: '',
    foto_vehiculo: ''
  });
  const [grabando, setGrabando] = useState(false);
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [campoActivo, setCampoActivo] = useState('');
  const [fotoMatricula, setFotoMatricula] = useState(null);
  const [modoCreacionDirecta, setModoCreacionDirecta] = useState(false);
  const [verificandoMatricula, setVerificandoMatricula] = useState(false);
  const [vehiculoExistente, setVehiculoExistente] = useState(null);
  const [clienteExistente, setClienteExistente] = useState(null);
  
  // NUEVO: Estado para controlar si la matrícula es válida y habilitar otros campos
  const [matriculaValida, setMatriculaValida] = useState(false);
  
  // NUEVO: Estado para controlar si el documento del cliente es válido
  const [documentoClienteValido, setDocumentoClienteValido] = useState(false);
  const [verificandoDocumento, setVerificandoDocumento] = useState(false);

  // Funciones específicas para matrícula
  const iniciarDictadoMatricula = async () => {
    toast.info('🎤 Función de dictado para matrícula - Usando dictado de vehículo existente');
    // Reutilizar la función handleVoiceInput existente
    handleVoiceInput();
  };

  const iniciarCamaraMatricula = async () => {
    toast.info('📷 Iniciando captura de cámara para matrícula');
    // Usar el sistema avanzado de cámara
    await escanearDocumentoConCamara();
  };

  // NUEVA FUNCIÓN: Validar documento del cliente
  const validarDocumentoCliente = async (tipoDocumento, prefijoDocumento, numeroDocumento) => {
    // Validar formato
    const esValido = numeroDocumento && numeroDocumento.length >= 7;
    
    if (!esValido) {
      setDocumentoClienteValido(false);
      return;
    }

    try {
      setVerificandoDocumento(true);
      
      // Buscar cliente existente por documento
      const documentoCompleto = `${prefijoDocumento}-${numeroDocumento}`;
      const response = await axios.get(`${API}/clientes`);
      
      const clienteExistente = response.data.find(cliente => 
        cliente.prefijo_documento === prefijoDocumento && 
        cliente.numero_documento === numeroDocumento
      );

      if (clienteExistente) {
        // Cliente existente encontrado
        setCliente({
          ...clienteExistente,
          tipo_documento: tipoDocumento,
          prefijo_documento: prefijoDocumento,
          numero_documento: numeroDocumento
        });
        setDocumentoClienteValido(true);
        toast.success(`✅ Cliente existente: ${clienteExistente.nombre}`);
      } else {
        // Cliente nuevo - documento válido pero no existe
        setDocumentoClienteValido(true);
        toast.info('ℹ️ Cliente nuevo - Complete la información');
      }
    } catch (error) {
      console.error('Error validando documento:', error);
      toast.error('❌ Error validando documento');
      setDocumentoClienteValido(false);
    } finally {
      setVerificandoDocumento(false);
    }
  };

  // NUEVO SISTEMA DE CÁMARA AVANZADO
  const [camaraState, setCamaraState] = useState({
    dispositivos: [],
    dispositivoSeleccionado: '',
    mostrarSelector: false,
    streaming: false,
    canvas: null,
    video: null,
    tipoCaptura: 'documento'
  });

  // Obtener dispositivos de cámara disponibles
  const obtenerDispositivosCamara = async () => {
    try {
      // Solicitar permisos primero
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Obtener lista de dispositivos
      const dispositivos = await navigator.mediaDevices.enumerateDevices();
      const camaras = dispositivos.filter(dispositivo => dispositivo.kind === 'videoinput');
      
      console.log('Cámaras encontradas:', camaras);
      
      setCamaraState(prev => ({
        ...prev,
        dispositivos: camaras,
        dispositivoSeleccionado: camaras.length > 0 ? camaras[0].deviceId : ''
      }));
      
      return camaras;
    } catch (error) {
      console.error('Error obteniendo dispositivos de cámara:', error);
      toast.error('❌ Error accediendo a las cámaras');
      return [];
    }
  };

  // Iniciar streaming de cámara
  const iniciarStreamingCamara = async (deviceId = '') => {
    try {
      // Detener stream anterior si existe
      if (camaraState.video?.srcObject) {
        camaraState.video.srcObject.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Crear elemento video si no existe
      let video = camaraState.video;
      if (!video) {
        video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        setCamaraState(prev => ({ ...prev, video }));
      }

      video.srcObject = stream;
      
      setCamaraState(prev => ({
        ...prev,
        streaming: true,
        video
      }));

      return { video, stream };
    } catch (error) {
      console.error('Error iniciando streaming:', error);
      toast.error('❌ Error accediendo a la cámara');
      throw error;
    }
  };

  // Capturar imagen de la cámara
  const capturarImagenDeCamara = async () => {
    try {
      if (!camaraState.video) {
        throw new Error('Video no inicializado');
      }

      // Crear canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Configurar dimensiones
      canvas.width = camaraState.video.videoWidth;
      canvas.height = camaraState.video.videoHeight;
      
      // Dibujar frame actual
      ctx.drawImage(camaraState.video, 0, 0);
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      return imageData;
    } catch (error) {
      console.error('Error capturando imagen:', error);
      toast.error('❌ Error capturando imagen');
      throw error;
    }
  };

  // Función principal para escanear documento
  const escanearDocumentoConCamara = async (tipoCaptura = 'documento') => {
    try {
      // Obtener dispositivos disponibles
      const dispositivos = await obtenerDispositivosCamara();
      
      if (dispositivos.length === 0) {
        toast.error('❌ No se encontraron cámaras disponibles');
        return;
      }
      
      if (dispositivos.length === 1) {
        // Solo una cámara, usar directamente
        await iniciarCapturaCamara(dispositivos[0].deviceId, tipoCaptura);
      } else {
        // Múltiples cámaras, mostrar selector
        setCamaraState(prev => ({ ...prev, mostrarSelector: true, tipoCaptura }));
      }
    } catch (error) {
      console.error('Error escaneando documento:', error);
      toast.error('❌ Error iniciando escaneo');
    }
  };

  // Iniciar captura con cámara seleccionada
  const iniciarCapturaCamara = async (deviceId, tipoCaptura = 'documento') => {
    try {
      toast.info('📷 Preparando cámara para captura...');
      
      const { video, stream } = await iniciarStreamingCamara(deviceId);
      
      // Crear modal/overlay para mostrar vista previa
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `;
      
      const container = document.createElement('div');
      container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding: 20px;
        background: white;
        border-radius: 10px;
        max-width: 90vw;
        max-height: 90vh;
      `;
      
      const title = document.createElement('h3');
      title.textContent = tipoCaptura === 'vehiculo' ? '📷 Capturar Foto del Vehículo' : '📷 Escanear Documento - Enfocar matrícula o documento';
      title.style.cssText = 'margin: 0; color: #333; text-align: center;';
      
      video.style.cssText = `
        width: 100%;
        max-width: 640px;
        height: auto;
        border: 2px solid #3B82F6;
        border-radius: 8px;
      `;
      
      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.cssText = 'display: flex; gap: 10px;';
      
      const captureBtn = document.createElement('button');
      captureBtn.textContent = '📸 Capturar';
      captureBtn.style.cssText = `
        padding: 10px 20px;
        background: #3B82F6;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
      `;
      
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '❌ Cancelar';
      cancelBtn.style.cssText = `
        padding: 10px 20px;
        background: #EF4444;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      `;
      
      // Event listeners
      captureBtn.onclick = async () => {
        try {
          const imageData = await capturarImagenDeCamara();
          
          // Detener stream
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(overlay);
          
          // Manejar la imagen según el tipo de captura
          if (tipoCaptura === 'vehiculo') {
            // Para foto del vehículo, guardar directamente
            setVehiculo(prev => ({ ...prev, foto_vehiculo: imageData }));
            toast.success('✅ Foto del vehículo capturada');
          } else {
            // Para documentos, procesar con IA
            await procesarImagenConIA(imageData);
          }
        } catch (error) {
          toast.error('❌ Error capturando imagen');
        }
      };
      
      cancelBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(overlay);
        toast.info('📷 Captura cancelada');
      };
      
      // Ensamblar UI
      buttonsContainer.appendChild(captureBtn);
      buttonsContainer.appendChild(cancelBtn);
      container.appendChild(title);
      container.appendChild(video);
      container.appendChild(buttonsContainer);
      overlay.appendChild(container);
      document.body.appendChild(overlay);
      
      const mensaje = tipoCaptura === 'vehiculo' 
        ? '📷 Cámara lista - Enfoque el vehículo y haga clic en Capturar'
        : '📷 Cámara lista - Enfoque el documento y haga clic en Capturar';
      toast.success(mensaje);
      
    } catch (error) {
      console.error('Error iniciando captura:', error);
      toast.error('❌ Error iniciando captura de cámara');
    }
  };

  // Procesar imagen con IA
  const procesarImagenConIA = async (imageBase64) => {
    try {
      setProcesandoIA(true);
      toast.info('🤖 Procesando imagen con IA...');

      const response = await axios.post(`${API}/ai/procesar-imagen`, {
        imagen_base64: imageBase64
      });

      if (response.data.success && response.data.datos) {
        const datos = response.data.datos;
        
        // Procesar datos del vehículo
        if (datos.vehiculo) {
          if (datos.vehiculo.matricula) {
            validarMatricula(datos.vehiculo.matricula);
          }
          if (datos.vehiculo.marca) {
            setVehiculo(prev => ({ ...prev, marca: datos.vehiculo.marca }));
          }
          if (datos.vehiculo.modelo) {
            setVehiculo(prev => ({ ...prev, modelo: datos.vehiculo.modelo }));
          }
          if (datos.vehiculo.año) {
            setVehiculo(prev => ({ ...prev, año: parseInt(datos.vehiculo.año) }));
          }
          if (datos.vehiculo.color) {
            setVehiculo(prev => ({ ...prev, color: datos.vehiculo.color }));
          }
        }

        // Procesar datos del cliente
        if (datos.cliente) {
          if (datos.cliente.nombre) {
            setCliente(prev => ({ ...prev, nombre: datos.cliente.nombre }));
          }
          if (datos.cliente.tipo_documento && datos.cliente.prefijo_documento) {
            setCliente(prev => ({ 
              ...prev, 
              tipo_documento: datos.cliente.tipo_documento,
              prefijo_documento: datos.cliente.prefijo_documento
            }));
          }
          if (datos.cliente.numero_documento) {
            setCliente(prev => ({ ...prev, numero_documento: datos.cliente.numero_documento }));
            
            // Validar documento automáticamente
            if (datos.cliente.tipo_documento && datos.cliente.prefijo_documento) {
              validarDocumentoCliente(
                datos.cliente.tipo_documento, 
                datos.cliente.prefijo_documento, 
                datos.cliente.numero_documento
              );
            }
          }
        }

        toast.success('✅ Imagen procesada exitosamente');
      } else {
        toast.warning('⚠️ No se detectó información clara en la imagen');
      }
    } catch (error) {
      console.error('Error procesando imagen:', error);
      toast.error('❌ Error procesando la imagen');
    } finally {
      setProcesandoIA(false);
    }
  };



  useEffect(() => {
    // Cargar matrícula predefinida si viene del Dashboard
    if (location.state?.matricula_predefinida) {
      setVehiculo(prev => ({ 
        ...prev, 
        matricula: location.state.matricula_predefinida.toUpperCase() 
      }));
      toast.info(`Registro iniciado para matrícula: ${location.state.matricula_predefinida}`);
    }
  }, [location.state]);

  useEffect(() => {
    // Verificar si viene de búsqueda con datos predefinidos
    if (location.state) {
      if (location.state.vehiculo_existente && location.state.cliente_existente) {
        setVehiculo(location.state.vehiculo_existente);
        setCliente(location.state.cliente_existente);
        setModoCreacionDirecta(true);
        setPaso(3); // Ir directo a confirmación para crear orden
      }
    }
  }, [location.state]);

  const validarMatricula = (valor) => {
    // Solo alfanuméricos, 4-7 caracteres, convertir a mayúsculas
    const limpio = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (limpio.length <= 7) {
      setVehiculo(prev => ({ ...prev, matricula: limpio }));
      
      // VALIDACIÓN MEJORADA: La matrícula es válida si tiene 4-7 caracteres alfanuméricos
      const esValida = limpio.length >= 4 && /^[A-Z0-9]{4,7}$/.test(limpio);
      setMatriculaValida(esValida);
      
      if (esValida) {
        // Verificar en tiempo real si existe
        verificarMatriculaEnTiempoReal(limpio);
      } else {
        // Limpiar estados si no es válida
        setVehiculoExistente(null);
        setClienteExistente(null);
      }
    }
  };

  const verificarMatriculaUnica = async (matricula) => {
    try {
      const response = await axios.get(`${API}/vehiculos`);
      const existe = response.data.find(v => v.matricula === matricula && v.id !== vehiculo.id);
      if (existe) {
        toast.error('Esta matrícula ya está registrada');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error verificando matrícula:', error);
      return true; // Permitir en caso de error
    }
  };

  const verificarMatriculaEnTiempoReal = async (matricula) => {
    if (!matricula || matricula.length < 4) {
      setVehiculoExistente(null);
      setClienteExistente(null);
      return;
    }

    setVerificandoMatricula(true);
    try {
      const response = await axios.get(`${API}/vehiculos/verificar-matricula/${matricula}`);
      
      if (response.data.exists && response.data.vehiculo) {
        // Vehículo existe, cargar datos
        const vehiculoEncontrado = response.data.vehiculo;
        setVehiculoExistente(vehiculoEncontrado);
        
        // Cargar datos del cliente
        try {
          const clienteRes = await axios.get(`${API}/clientes/${vehiculoEncontrado.cliente_id}`);
          setClienteExistente(clienteRes.data);
          
          // Pre-llenar formulario del cliente también
          setCliente({
            nombre: clienteRes.data.nombre || '',
            tipo_documento: clienteRes.data.tipo_documento || 'CI',
            prefijo_documento: clienteRes.data.prefijo_documento || 'V',
            numero_documento: clienteRes.data.numero_documento || '',
            telefono: clienteRes.data.telefono || '',
            telefono_secundario: clienteRes.data.telefono_secundario || '',
            direccion_fiscal: clienteRes.data.direccion_fiscal || '',
            empresa: clienteRes.data.empresa || '',
            email: clienteRes.data.email || ''
          });
        } catch (error) {
          console.error('Error cargando cliente:', error);
        }
        
        // Pre-llenar formulario con datos existentes del vehículo
        setVehiculo(prev => ({
          ...prev,
          matricula: vehiculoEncontrado.matricula,
          marca: vehiculoEncontrado.marca,
          modelo: vehiculoEncontrado.modelo,
          año: vehiculoEncontrado.año?.toString() || '',
          color: vehiculoEncontrado.color || '',
          kilometraje: vehiculoEncontrado.kilometraje?.toString() || '',
          tipo_combustible: vehiculoEncontrado.tipo_combustible || '',
          serial_niv: vehiculoEncontrado.serial_niv || '',
          tara: vehiculoEncontrado.tara?.toString() || '',
          foto_vehiculo: vehiculoEncontrado.foto_vehiculo || ''
        }));
      } else {
        // Vehículo no existe
        setVehiculoExistente(null);
        setClienteExistente(null);
      }
    } catch (error) {
      console.error('Error verificando matrícula:', error);
      setVehiculoExistente(null);
      setClienteExistente(null);
    } finally {
      setVerificandoMatricula(false);
    }
  };

  const procesarDictadoConIA = async (textoDictado) => {
    setProcesandoIA(true);
    toast.info('🤖 Procesando dictado con IA...');
    
    console.log('Texto a procesar:', textoDictado);
    
    try {
      const response = await axios.post(`${API}/ai/procesar-dictado`, {
        texto: textoDictado,
        contexto: 'registro_vehiculo_cliente'
      });
      
      console.log('Respuesta del servidor:', response.data);
      
      if (response.data.success) {
        const datos = response.data.datos;
        let camposActualizados = [];
        
        console.log('Datos extraídos por IA:', datos);
        
        // Actualizar datos del cliente
        if (datos.cliente) {
          if (datos.cliente.nombre) {
            setCliente(prev => {
              const updated = { ...prev, nombre: datos.cliente.nombre.toUpperCase() };
              console.log('Actualizando nombre cliente:', updated.nombre);
              return updated;
            });
            camposActualizados.push('nombre cliente');
          }
          if (datos.cliente.telefono) {
            setCliente(prev => {
              const updated = { ...prev, telefono: datos.cliente.telefono };
              console.log('Actualizando teléfono:', updated.telefono);
              return updated;
            });
            camposActualizados.push('teléfono');
          }
          if (datos.cliente.empresa) {
            setCliente(prev => {
              const updated = { ...prev, empresa: datos.cliente.empresa.toUpperCase() };
              console.log('Actualizando empresa:', updated.empresa);
              return updated;
            });
            camposActualizados.push('empresa');
          }
          if (datos.cliente.email) {
            setCliente(prev => {
              const updated = { ...prev, email: datos.cliente.email.toLowerCase() };
              console.log('Actualizando email:', updated.email);
              return updated;
            });
            camposActualizados.push('email');
          }
          if (datos.cliente.direccion_fiscal) {
            setCliente(prev => {
              const updated = { ...prev, direccion_fiscal: datos.cliente.direccion_fiscal.toUpperCase() };
              console.log('Actualizando dirección fiscal:', updated.direccion_fiscal);
              return updated;
            });
            camposActualizados.push('dirección fiscal');
          }
          if (datos.cliente.tipo_documento && datos.cliente.numero_documento) {
            setCliente(prev => {
              const updated = { 
                ...prev, 
                tipo_documento: datos.cliente.tipo_documento,
                prefijo_documento: datos.cliente.prefijo_documento || 'V',
                numero_documento: datos.cliente.numero_documento
              };
              console.log('Actualizando documento:', updated.prefijo_documento + '-' + updated.numero_documento);
              return updated;
            });
            camposActualizados.push('documento');
          }
        }
        
        // Actualizar datos del vehículo
        if (datos.vehiculo) {
          if (datos.vehiculo.matricula) {
            setVehiculo(prev => {
              const updated = { ...prev, matricula: datos.vehiculo.matricula.toUpperCase() };
              console.log('Actualizando matrícula:', updated.matricula);
              return updated;
            });
            camposActualizados.push('matrícula');
          }
          if (datos.vehiculo.marca) {
            setVehiculo(prev => {
              const updated = { ...prev, marca: datos.vehiculo.marca.toUpperCase() };
              console.log('Actualizando marca:', updated.marca);
              return updated;
            });
            camposActualizados.push('marca');
          }
          if (datos.vehiculo.modelo) {
            setVehiculo(prev => {
              const updated = { ...prev, modelo: datos.vehiculo.modelo.toUpperCase() };
              console.log('Actualizando modelo:', updated.modelo);
              return updated;
            });
            camposActualizados.push('modelo');
          }
          if (datos.vehiculo.año) {
            setVehiculo(prev => {
              const updated = { ...prev, año: datos.vehiculo.año.toString() };
              console.log('Actualizando año:', updated.año);
              return updated;
            });
            camposActualizados.push('año');
          }
          if (datos.vehiculo.color) {
            setVehiculo(prev => {
              const updated = { ...prev, color: datos.vehiculo.color.toUpperCase() };
              console.log('Actualizando color:', updated.color);
              return updated;
            });
            camposActualizados.push('color');
          }
          if (datos.vehiculo.kilometraje) {
            setVehiculo(prev => {
              const updated = { ...prev, kilometraje: datos.vehiculo.kilometraje.toString() };
              console.log('Actualizando kilometraje:', updated.kilometraje);
              return updated;
            });
            camposActualizados.push('kilometraje');
          }
          if (datos.vehiculo.tipo_combustible) {
            setVehiculo(prev => {
              const updated = { ...prev, tipo_combustible: datos.vehiculo.tipo_combustible.toUpperCase() };
              console.log('Actualizando tipo combustible:', updated.tipo_combustible);
              return updated;
            });
            camposActualizados.push('tipo combustible');
          }
        }
        
        if (camposActualizados.length > 0) {
          toast.success(`✅ IA completó: ${camposActualizados.join(', ')}`);
        } else {
          toast.warning('IA no pudo extraer información específica del dictado');
        }
      } else {
        console.error('Error del servidor:', response.data.error);
        toast.error(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error procesando dictado con IA:', error);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
        toast.error(`Error del servidor: ${error.response.data?.error || error.response.statusText}`);
      } else {
        toast.error('Error de conexión con el servidor');
      }
    } finally {
      setProcesandoIA(false);
    }
  };

  const procesarConIA = async (textoOImagen, tipo) => {
    setProcesandoIA(true);
    try {
      const request = tipo === 'texto' 
        ? { texto_dictado: textoOImagen }
        : { imagen_base64: textoOImagen };

      const response = await axios.post(`${API}/ai/extraer-datos`, request);
      
      if (response.data.success) {
        const datos = response.data.datos;
        
        // Actualizar formularios con los datos extraídos
        if (datos.cliente_nombre) setCliente(prev => ({ ...prev, nombre: datos.cliente_nombre }));
        if (datos.cliente_telefono) setCliente(prev => ({ ...prev, telefono: datos.cliente_telefono }));
        if (datos.cliente_empresa) setCliente(prev => ({ ...prev, empresa: datos.cliente_empresa }));
        
        if (datos.matricula) setVehiculo(prev => ({ ...prev, matricula: datos.matricula }));
        if (datos.marca) setVehiculo(prev => ({ ...prev, marca: datos.marca }));
        if (datos.modelo) setVehiculo(prev => ({ ...prev, modelo: datos.modelo }));
        if (datos.año) setVehiculo(prev => ({ ...prev, año: datos.año.toString() }));
        if (datos.color) setVehiculo(prev => ({ ...prev, color: datos.color }));
        if (datos.kilometraje) setVehiculo(prev => ({ ...prev, kilometraje: datos.kilometraje.toString() }));
        
        toast.success('Datos extraídos correctamente con IA');
      } else {
        toast.error('Error al procesar con IA: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error procesando IA:', error);
      toast.error('Error al procesar con IA');
    } finally {
      setProcesandoIA(false);
    }
  };

  const handleVoiceInput = async () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configuración mejorada para dictado inteligente
      recognition.lang = 'es-ES';
      recognition.continuous = true;  // Permitir dictado continuo
      recognition.interimResults = true;  // Mostrar resultados mientras habla
      recognition.maxAlternatives = 1;
      
      // Variables para controlar el dictado
      let finalTranscript = '';
      let interimTranscript = '';

      setGrabando(true);
      
      // Determinar el comando de parada según la ventana actual
      const comandoParada = paso === 3 ? 'finalizar' : 'siguiente';
      toast.info(`🎤 Dictando... Diga "${comandoParada}" para procesar los datos`);
      
      recognition.onresult = (event) => {
        interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Mostrar texto en tiempo real
        const textoCompleto = (finalTranscript + interimTranscript).toLowerCase();
        console.log('Texto actual:', textoCompleto);
        
        // Detectar comandos de parada
        const detectedCommand = textoCompleto.includes('siguiente') || 
                               textoCompleto.includes('finalizar') ||
                               textoCompleto.includes('terminar') ||
                               textoCompleto.includes('procesar');
        
        if (detectedCommand && finalTranscript.trim()) {
          console.log('Comando detectado, procesando texto:', finalTranscript);
          recognition.stop();
          
          // Limpiar comandos del texto final
          const textoLimpio = finalTranscript
            .replace(/siguiente/gi, '')
            .replace(/finalizar/gi, '')
            .replace(/terminar/gi, '')
            .replace(/procesar/gi, '')
            .trim();
          
          if (textoLimpio) {
            procesarDictadoConIA(textoLimpio);
          } else {
            toast.warning('No se detectó información para procesar');
            setGrabando(false);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Error de reconocimiento de voz:', event.error);
        toast.error('Error en el reconocimiento de voz: ' + event.error);
        setGrabando(false);
      };

      recognition.onend = () => {
        setGrabando(false);
      };

      recognition.start();
    } else {
      toast.error('El reconocimiento de voz no está soportado en este navegador');
    }
  };

  // handleImageCapture function removed - replaced by escanearDocumentoConCamara

  const guardarRegistro = async () => {
    try {
      // Validaciones del cliente
      if (!cliente.nombre.trim()) {
        toast.error('El nombre del cliente es requerido');
        return;
      }
      if (!cliente.numero_documento.trim()) {
        toast.error('El número de documento es requerido');
        return;
      }
      if (!cliente.direccion_fiscal.trim()) {
        toast.error('La dirección fiscal es requerida para facturación');
        return;
      }
      if (!cliente.email.trim()) {
        toast.error('El email es requerido para facturación');
        return;
      }

      // Validaciones del vehículo
      if (!vehiculo.matricula || vehiculo.matricula.length < 4) {
        toast.error('La matrícula debe tener al menos 4 caracteres');
        return;
      }
      if (!vehiculo.marca.trim()) {
        toast.error('La marca del vehículo es requerida');
        return;
      }
      if (!vehiculo.modelo.trim()) {
        toast.error('El modelo del vehículo es requerido');
        return;
      }

      // Verificar que la matrícula sea única
      const matriculaValida = await verificarMatriculaUnica(vehiculo.matricula);
      if (!matriculaValida) {
        return;
      }

      if (modoCreacionDirecta) {
        // Solo crear orden para vehículo existente
        const ordenResponse = await axios.post(`${API}/ordenes`, {
          vehiculo_id: vehiculo.id,
          cliente_id: cliente.id,
          diagnostico: 'Nueva orden de trabajo - Pendiente diagnóstico inicial'
        });
        
        toast.success('Nueva orden creada exitosamente');
        navigate(`/orden/${ordenResponse.data.id}`);
        return;
      }

      // Crear cliente
      const clienteResponse = await axios.post(`${API}/clientes`, cliente);
      const clienteId = clienteResponse.data.id;
      
      // Crear vehículo
      const vehiculoData = {
        ...vehiculo,
        cliente_id: clienteId,
        año: vehiculo.año ? parseInt(vehiculo.año) : null,
        kilometraje: vehiculo.kilometraje ? parseInt(vehiculo.kilometraje) : null,
        tara: vehiculo.tara ? parseFloat(vehiculo.tara) : null,
        foto_matricula: fotoMatricula
      };
      
      const vehiculoResponse = await axios.post(`${API}/vehiculos`, vehiculoData);
      
      // Crear orden de trabajo inicial
      const ordenResponse = await axios.post(`${API}/ordenes`, {
        vehiculo_id: vehiculoResponse.data.id,
        cliente_id: clienteId,
        diagnostico: 'Vehículo recibido - Pendiente diagnóstico inicial'
      });
      
      toast.success('Vehículo registrado exitosamente');
      navigate(`/orden/${ordenResponse.data.id}`);
      
    } catch (error) {
      console.error('Error guardando registro:', error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Error al guardar el registro');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Registro de Vehículo</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleVoiceInput}
            disabled={grabando || procesandoIA}
            variant={grabando ? "destructive" : "outline"}
            className="flex items-center gap-2"
          >
            <Mic className={`w-4 h-4 ${grabando ? 'animate-pulse' : ''}`} />
            {grabando ? 'Escuchando...' : 'Dictar Información'}
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={procesandoIA}
            onClick={escanearDocumentoConCamara}
          >
            <Camera className={`w-4 h-4 ${procesandoIA ? 'animate-pulse' : ''}`} />
            {procesandoIA ? 'Analizando...' : 'Escanear Documento'}
          </Button>
          
          <div className="text-xs text-gray-500 mt-2">
            📸 <strong>Escáner inteligente:</strong> Captura matrícula, título de propiedad o documento vehicular
          </div>
        </div>
      </div>

      {procesandoIA && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Procesando información con Inteligencia Artificial...
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={paso.toString()} onValueChange={(value) => setPaso(parseInt(value))}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="1">Vehículo</TabsTrigger>
          <TabsTrigger value="2">Cliente</TabsTrigger>
          <TabsTrigger value="3">Confirmación</TabsTrigger>
        </TabsList>

        <TabsContent value="1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Vehículo</CardTitle>
              <CardDescription>Datos técnicos del vehículo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="block text-sm font-medium mb-2">Matrícula/Placa *</label>
                  
                  <div className="relative">
                    <Input
                      value={vehiculo.matricula}
                      onChange={(e) => {
                        const matricula = e.target.value.toUpperCase();
                        validarMatricula(matricula);
                        
                        // Verificar matrícula en tiempo real con debounce
                        clearTimeout(window.matriculaTimeout);
                        window.matriculaTimeout = setTimeout(() => {
                          if (matricula.length >= 4) {
                            verificarMatriculaEnTiempoReal(matricula);
                          }
                        }, 800);
                      }}
                      placeholder="Ingresa matrícula: ABC123, AB12CD, etc."
                      className={`uppercase font-mono tracking-wider text-center text-lg font-bold ${
                        vehiculoExistente ? 'border-orange-500 bg-orange-50' : 
                        matriculaValida ? 'border-green-500 bg-green-50' : 
                        vehiculo.matricula ? 'border-red-300 bg-red-50' : ''
                      }`}
                      maxLength={7}
                    />
                    {verificandoMatricula && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    {matriculaValida && !vehiculoExistente && (
                      <div className="absolute right-3 top-3">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Estado de la matrícula */}
                  <div className="mt-2">
                    {!vehiculo.matricula && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-blue-800 font-medium flex items-center gap-2">
                          <span>🔒</span> Ingrese la matrícula primero
                        </p>
                        <p className="text-blue-700 text-sm mt-1">
                          Use dictado 🎤, escaneo 📷 o escritura manual. Los demás campos se habilitarán después.
                        </p>
                      </div>
                    )}
                    
                    {vehiculo.matricula && !matriculaValida && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800 font-medium flex items-center gap-2">
                          <span>❌</span> Matrícula inválida
                        </p>
                        <p className="text-red-700 text-sm mt-1">
                          Debe tener 4-7 caracteres alfanuméricos (sin símbolos)
                        </p>
                      </div>
                    )}
                    
                    {matriculaValida && !vehiculoExistente && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-800 font-medium flex items-center gap-2">
                          <span>✅</span> Matrícula válida - Vehículo nuevo 
                        </p>
                        <p className="text-green-700 text-sm mt-1">
                          Ahora puede completar los datos del vehículo
                        </p>
                      </div>
                    )}
                    
                    {vehiculoExistente && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <p className="text-orange-800 font-medium flex items-center gap-2">
                          <span>⚠️</span> Vehículo existente encontrado
                        </p>
                        <p className="text-orange-700 text-sm mt-1">
                          <strong>{vehiculoExistente.marca} {vehiculoExistente.modelo}</strong> ({vehiculoExistente.año})
                        </p>
                        <p className="text-orange-700 text-sm">
                          Propietario: <strong>{clienteExistente?.nombre || 'Cargando cliente...'}</strong>
                        </p>
                        <p className="text-orange-600 text-xs mt-2">
                          ✏️ Los datos se han cargado para permitir modificaciones
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Use dictado para mayor rapidez o escanee documentos con la cámara
                  </p>
                </div>
                <div className={!matriculaValida ? 'opacity-50' : ''}>
                  <label className="block text-sm font-medium mb-2">
                    Marca * {!matriculaValida && <span className="text-red-500">(Bloqueado)</span>}
                  </label>
                  <Input
                    value={vehiculo.marca}
                    onChange={(e) => setVehiculo(prev => ({ ...prev, marca: e.target.value.toUpperCase() }))}
                    placeholder="TOYOTA, HONDA, ETC."
                    style={{textTransform: 'uppercase'}}
                    disabled={!matriculaValida}
                  />
                </div>
                <div className={!matriculaValida ? 'opacity-50' : ''}>
                  <label className="block text-sm font-medium mb-2">
                    Modelo * {!matriculaValida && <span className="text-red-500">(Bloqueado)</span>}
                  </label>
                  <Input
                    value={vehiculo.modelo}
                    onChange={(e) => setVehiculo(prev => ({ ...prev, modelo: e.target.value.toUpperCase() }))}
                    placeholder="MODELO DEL VEHÍCULO"
                    style={{textTransform: 'uppercase'}}
                    disabled={!matriculaValida}
                  />
                </div>
                <div className={!matriculaValida ? 'opacity-50' : ''}>
                  <label className="block text-sm font-medium mb-2">
                    Año {!matriculaValida && <span className="text-red-500">(Bloqueado)</span>}
                  </label>
                  <Input
                    type="number"
                    value={vehiculo.año}
                    onChange={(e) => setVehiculo(prev => ({ ...prev, año: e.target.value }))}
                    placeholder="2020"
                    min="1950"
                    max="2030"
                    disabled={!matriculaValida}
                  />
                </div>
                <div className={!matriculaValida ? 'opacity-50' : ''}>
                  <label className="block text-sm font-medium mb-2">
                    Color {!matriculaValida && <span className="text-red-500">(Bloqueado)</span>}
                  </label>
                  <Input
                    value={vehiculo.color}
                    onChange={(e) => setVehiculo(prev => ({ ...prev, color: e.target.value.toUpperCase() }))}
                    placeholder="BLANCO, NEGRO, ETC."
                    style={{textTransform: 'uppercase'}}
                    disabled={!matriculaValida}
                  />
                </div>
                <div className={!matriculaValida ? 'opacity-50' : ''}>
                  <label className="block text-sm font-medium mb-2">
                    Kilometraje {!matriculaValida && <span className="text-red-500">(Bloqueado)</span>}
                  </label>
                  <Input
                    type="number"
                    value={vehiculo.kilometraje}
                    onChange={(e) => setVehiculo(prev => ({ ...prev, kilometraje: e.target.value }))}
                    placeholder="100000"
                    disabled={!matriculaValida}
                  />
                </div>
                <div className={!matriculaValida ? 'opacity-50' : ''}>
                  <label className="block text-sm font-medium mb-2">
                    Tipo de Combustible {!matriculaValida && <span className="text-red-500">(Bloqueado)</span>}
                  </label>
                  <Select 
                    value={vehiculo.tipo_combustible}
                    onValueChange={(value) => setVehiculo(prev => ({ ...prev, tipo_combustible: value }))}
                    disabled={!matriculaValida}
                  >
                    <SelectTrigger className={!matriculaValida ? 'cursor-not-allowed' : ''}>
                      <SelectValue placeholder="TIPO DE COMBUSTIBLE" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GASOLINA">GASOLINA</SelectItem>
                      <SelectItem value="DIESEL">DIESEL</SelectItem>
                      <SelectItem value="GNV">GNV (GAS NATURAL)</SelectItem>
                      <SelectItem value="ELECTRICO">ELÉCTRICO</SelectItem>
                      <SelectItem value="HIBRIDO">HÍBRIDO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className={!matriculaValida ? 'opacity-50' : ''}>
                  <label className="block text-sm font-medium mb-2">
                    Serial N.I.V. {!matriculaValida && <span className="text-red-500">(Bloqueado)</span>}
                  </label>
                  <Input
                    value={vehiculo.serial_niv}
                    onChange={(e) => setVehiculo(prev => ({ ...prev, serial_niv: e.target.value.toUpperCase() }))}
                    placeholder="NÚMERO DE IDENTIFICACIÓN VEHICULAR"
                    style={{textTransform: 'uppercase'}}
                    disabled={!matriculaValida}
                  />
                </div>
                <div className={!matriculaValida ? 'opacity-50' : ''}>
                  <label className="block text-sm font-medium mb-2">
                    Tara (Peso en Kg) {!matriculaValida && <span className="text-red-500">(Bloqueado)</span>}
                  </label>
                  <Input
                    type="number"
                    value={vehiculo.tara}
                    onChange={(e) => setVehiculo(prev => ({ ...prev, tara: e.target.value }))}
                    placeholder="1500"
                    step="0.1"
                    disabled={!matriculaValida}
                  />
                </div>
              </div>

              {/* Sección de Fotografías */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fotografía del Vehículo</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {vehiculo.foto_vehiculo ? (
                      <div>
                        <img src={vehiculo.foto_vehiculo} alt="Vehículo" className="max-w-full h-32 object-cover mx-auto rounded mb-2" />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setVehiculo(prev => ({ ...prev, foto_vehiculo: '' }))}
                        >
                          Cambiar Foto
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            try {
                              await escanearDocumentoConCamara('vehiculo');
                            } catch (error) {
                              console.error('Error capturando foto:', error);
                              toast.error('Error capturando foto del vehículo');
                            }
                          }}
                          className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
                          disabled={procesandoIA}
                        >
                          <div className="text-center">
                            <Camera className={`w-8 h-8 text-gray-400 mx-auto mb-2 ${procesandoIA ? 'animate-pulse' : ''}`} />
                            <p className="text-sm text-gray-600">
                              {procesandoIA ? 'Capturando...' : 'Capturar foto del vehículo'}
                            </p>
                          </div>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {fotoMatricula && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Foto de la Matrícula</label>
                    <img src={fotoMatricula} alt="Matrícula" className="max-w-full h-32 object-cover border rounded" />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => setPaso(2)} 
                  disabled={!matriculaValida}
                  className={matriculaValida ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}
                >
                  {!matriculaValida 
                    ? '🔒 Ingrese matrícula válida primero' 
                    : 'Siguiente: Datos del Cliente ➡️'
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="2" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
              <CardDescription>Datos de la empresa o cliente individual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre/Razón Social *</label>
                  <Input
                    value={cliente.nombre}
                    onChange={(e) => setCliente(prev => ({ ...prev, nombre: e.target.value.toUpperCase() }))}
                    placeholder="NOMBRE COMPLETO O RAZÓN SOCIAL"
                    style={{textTransform: 'uppercase'}}
                  />
                </div>
                
                <div className="col-span-full">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Documento de Identidad * (PRIORIDAD)</label>
                    <div className="text-xs text-blue-600 font-medium">
                      📋 Validar documento primero
                    </div>
                  </div>
                  <div className="flex gap-2 relative">
                    <Select
                      value={cliente.tipo_documento && cliente.prefijo_documento ? `${cliente.tipo_documento}-${cliente.prefijo_documento}` : ''}
                      onValueChange={(value) => {
                        const [tipo, prefijo] = value.split('-');
                        setCliente(prev => ({ 
                          ...prev, 
                          tipo_documento: tipo, 
                          prefijo_documento: prefijo 
                        }));
                        
                        // Validar si ya hay número
                        if (cliente.numero_documento) {
                          validarDocumentoCliente(tipo, prefijo, cliente.numero_documento);
                        }
                      }}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CI-V">V-</SelectItem>
                        <SelectItem value="CI-E">E-</SelectItem>
                        <SelectItem value="RIF-J">J-</SelectItem>
                        <SelectItem value="RIF-G">G-</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={cliente.numero_documento}
                      onChange={(e) => {
                        const numero = e.target.value.replace(/\D/g, '');
                        setCliente(prev => ({ ...prev, numero_documento: numero }));
                        
                        // Validar documento con debounce
                        clearTimeout(window.documentoTimeout);
                        window.documentoTimeout = setTimeout(() => {
                          if (cliente.tipo_documento && cliente.prefijo_documento && numero.length >= 7) {
                            validarDocumentoCliente(cliente.tipo_documento, cliente.prefijo_documento, numero);
                          } else {
                            setDocumentoClienteValido(false);
                          }
                        }, 1000);
                      }}
                      placeholder={cliente.tipo_documento === 'RIF' ? '12345678-9' : '12345678'}
                      className={`flex-1 font-mono tracking-wide ${
                        documentoClienteValido ? 'border-green-500 bg-green-50' : 
                        cliente.numero_documento ? 'border-red-300 bg-red-50' : ''
                      }`}
                      maxLength={cliente.tipo_documento === 'RIF' ? 10 : 8}
                    />
                    {verificandoDocumento && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    {documentoClienteValido && (
                      <div className="absolute right-3 top-3">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Estado del documento */}
                  <div className="mt-2">
                    {!cliente.numero_documento && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-blue-800 font-medium flex items-center gap-2">
                          <span>🔒</span> Ingrese el documento de identidad primero
                        </p>
                        <p className="text-blue-700 text-sm mt-1">
                          V- o E- para personas, J- o G- para empresas. Los demás campos se habilitarán después.
                        </p>
                      </div>
                    )}
                    
                    {cliente.numero_documento && !documentoClienteValido && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800 font-medium flex items-center gap-2">
                          <span>❌</span> Documento inválido
                        </p>
                        <p className="text-red-700 text-sm mt-1">
                          {cliente.tipo_documento === 'RIF' ? 'Formato: J-12345678-9 o G-12345678-9' : 'Formato: V-12345678 o E-12345678 (mínimo 7 dígitos)'}
                        </p>
                      </div>
                    )}
                    
                    {documentoClienteValido && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-800 font-medium flex items-center gap-2">
                          <span>✅</span> Documento válido
                        </p>
                        <p className="text-green-700 text-sm mt-1">
                          {cliente.nombre ? `Cliente existente: ${cliente.nombre}` : 'Cliente nuevo - Complete la información restante'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    💡 El documento es obligatorio para verificar si el cliente ya existe en el sistema
                  </p>
                </div>

                <div className={!documentoClienteValido ? 'opacity-50' : ''}>
                  <label className="block text-sm font-medium mb-2">
                    Teléfono Principal {!documentoClienteValido && <span className="text-red-500">(Bloqueado)</span>}
                  </label>
                  <Input
                    value={cliente.telefono}
                    onChange={(e) => setCliente(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="0414-555.12.34"
                    disabled={!documentoClienteValido}
                  />
                </div>

                <div className={!documentoClienteValido ? 'opacity-50' : ''}>
                  <label className="block text-sm font-medium mb-2">
                    Teléfono Secundario {!documentoClienteValido && <span className="text-red-500">(Bloqueado)</span>}
                  </label>
                  <Input
                    value={cliente.telefono_secundario}
                    onChange={(e) => setCliente(prev => ({ ...prev, telefono_secundario: e.target.value }))}
                    placeholder="0412-987.65.43"
                    disabled={!documentoClienteValido}
                  />
                </div>

                <div className={`md:col-span-2 ${!documentoClienteValido ? 'opacity-50' : ''}`}>
                  <label className="block text-sm font-medium mb-2">
                    Dirección Fiscal * {!documentoClienteValido && <span className="text-red-500">(Bloqueado)</span>}
                  </label>
                  <Textarea
                    value={cliente.direccion_fiscal}
                    onChange={(e) => setCliente(prev => ({ ...prev, direccion_fiscal: e.target.value.toUpperCase() }))}
                    placeholder="DIRECCIÓN COMPLETA PARA FACTURACIÓN"
                    style={{textTransform: 'uppercase'}}
                    rows={2}
                    disabled={!documentoClienteValido}
                  />
                </div>

                <div className={!documentoClienteValido ? 'opacity-50' : ''}>
                  <label className="block text-sm font-medium mb-2">
                    Empresa/Flota {!documentoClienteValido && <span className="text-red-500">(Bloqueado)</span>}
                  </label>
                  <Input
                    value={cliente.empresa}
                    onChange={(e) => setCliente(prev => ({ ...prev, empresa: e.target.value.toUpperCase() }))}
                    placeholder="NOMBRE DE LA EMPRESA (OPCIONAL)"
                    style={{textTransform: 'uppercase'}}
                    disabled={!documentoClienteValido}
                  />
                </div>

                <div className={!documentoClienteValido ? 'opacity-50' : ''}>
                  <label className="block text-sm font-medium mb-2">
                    Email * {!documentoClienteValido && <span className="text-red-500">(Bloqueado)</span>}
                  </label>
                  <Input
                    type="email"
                    value={cliente.email}
                    onChange={(e) => setCliente(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}
                    placeholder="correo@empresa.com"
                    disabled={!documentoClienteValido}
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setPaso(1)}>
                  Anterior
                </Button>
                <Button 
                  onClick={() => setPaso(3)} 
                  disabled={!documentoClienteValido}
                  className={documentoClienteValido ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}
                >
                  {!documentoClienteValido 
                    ? '🔒 Valide documento primero' 
                    : 'Finalizar Registro ➡️'
                  }
                  Siguiente
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="3" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Confirmación de Registro</CardTitle>
              <CardDescription>Revisa la información antes de guardar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Información del Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nombre:</strong> {cliente.nombre}</p>
                    <p><strong>Documento:</strong> {cliente.prefijo_documento}-{cliente.numero_documento}</p>
                    {cliente.telefono && <p><strong>Teléfono:</strong> {cliente.telefono}</p>}
                    {cliente.telefono_secundario && <p><strong>Teléfono 2:</strong> {cliente.telefono_secundario}</p>}
                    <p><strong>Dirección:</strong> {cliente.direccion_fiscal}</p>
                    {cliente.empresa && <p><strong>Empresa:</strong> {cliente.empresa}</p>}
                    <p><strong>Email:</strong> {cliente.email}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Información del Vehículo</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Matrícula:</strong> {vehiculo.matricula}</p>
                    <p><strong>Marca:</strong> {vehiculo.marca}</p>
                    <p><strong>Modelo:</strong> {vehiculo.modelo}</p>
                    {vehiculo.año && <p><strong>Año:</strong> {vehiculo.año}</p>}
                    {vehiculo.color && <p><strong>Color:</strong> {vehiculo.color}</p>}
                    {vehiculo.kilometraje && <p><strong>Kilometraje:</strong> {vehiculo.kilometraje.toLocaleString()} km</p>}
                    {vehiculo.tipo_combustible && <p><strong>Combustible:</strong> {vehiculo.tipo_combustible}</p>}
                    {vehiculo.serial_niv && <p><strong>N.I.V.:</strong> {vehiculo.serial_niv}</p>}
                    {vehiculo.tara && <p><strong>Tara:</strong> {vehiculo.tara} kg</p>}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setPaso(2)}>
                  Anterior
                </Button>
                <Button onClick={guardarRegistro} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Registro
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Selector de Cámaras */}
      <Dialog open={camaraState.mostrarSelector} onOpenChange={(open) => 
        setCamaraState(prev => ({ ...prev, mostrarSelector: open }))
      }>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Seleccionar Cámara
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Se detectaron múltiples cámaras. Seleccione la que desea usar:
            </p>
            <div className="space-y-2">
              {camaraState.dispositivos.map((dispositivo, index) => (
                <Button
                  key={dispositivo.deviceId}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={async () => {
                    setCamaraState(prev => ({ ...prev, mostrarSelector: false }));
                    await iniciarCapturaCamara(dispositivo.deviceId, camaraState.tipoCaptura);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <div className="font-medium">
                        {dispositivo.label || `Cámara ${index + 1}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {index === 0 ? 'Predeterminada' : 'Disponible'}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCamaraState(prev => ({ ...prev, mostrarSelector: false }))}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Configuración del Taller - SISTEMA CENTRALIZADO
const ConfiguracionTaller = () => {
  const [configuracion, setConfiguracion] = useState({
    // Información del taller
    nombre_taller: 'Centro de Servicios Automotriz Trieste',
    direccion: '',
    telefono: '',
    email: '',
    rif: '',
    logo_url: '',
    
    // Personalización de colores
    colores: {
      primario: '#3B82F6',      // Azul principal
      secundario: '#1D4ED8',    // Azul oscuro
      amarillo: '#FCD34D',      // Amarillo Trieste
      blanco: '#FFFFFF',        // Blanco
      texto: '#1F2937',         // Texto principal
      badges: '#3B82F6',        // Color de badges/óvalos
      textoBlanco: '#FFFFFF',   // Texto blanco en badges
      fondoCards: '#F9FAFB',    // Fondo de tarjetas
      borde: '#E5E7EB'          // Bordes
    },
    
    // Configuraciones del sistema
    sistema: {
      mostrarAvatares: true,
      permitirMultiplesEspecialidades: true,
      validacionDocumentosObligatoria: true,
      habilitarDictado: true,
      habilitarCamara: true,
      formatoTelefono: '0000-000.00.00',
      monedaPrincipal: 'USD',
      aplicarIVA: true,
      porcentajeIVA: 16,
      aplicarIGTF: true,
      porcentajeIGTF: 3
    }
  });

  const [tabActiva, setTabActiva] = useState('general');
  const [mostrarConfig, setMostrarConfig] = useState(false);
  
  // Estados para administración de base de datos
  const [colecciones, setColecciones] = useState([]);
  const [coleccionesSeleccionadas, setColeccionesSeleccionadas] = useState([]);
  const [cargandoColecciones, setCargandoColecciones] = useState(false);
  const [mostrarConfirmacionReset, setMostrarConfirmacionReset] = useState(false);
  const [mostrarConfirmacionResetCompleto, setMostrarConfirmacionResetCompleto] = useState(false);
  const [crearDatosEjemplo, setCrearDatosEjemplo] = useState(false);
  const [backupData, setBackupData] = useState(null);
  const [logoBase64, setLogoBase64] = useState('');
  const [cargandoLogo, setCargandoLogo] = useState(false);

  const guardarConfiguracion = () => {
    // Aquí se guardaría en localStorage o backend
    localStorage.setItem('trieste_config', JSON.stringify(configuracion));
    toast.success('Configuración guardada correctamente');
    setMostrarConfig(false);
  };

  // Funciones para administración de base de datos
  const cargarColecciones = async () => {
    setCargandoColecciones(true);
    try {
      const response = await axios.get(`${API}/admin/collections`);
      if (response.data.success) {
        setColecciones(response.data.collections);
      }
    } catch (error) {
      console.error('Error cargando colecciones:', error);
      toast.error('Error cargando información de bases de datos');
    } finally {
      setCargandoColecciones(false);
    }
  };

  const crearBackup = async () => {
    try {
      toast.info('Creando backup...');
      const response = await axios.post(`${API}/admin/backup`, {
        collections: coleccionesSeleccionadas.length > 0 ? coleccionesSeleccionadas : null
      });
      
      if (response.data.success) {
        setBackupData(response.data);
        toast.success('Backup creado exitosamente');
        
        // Descargar backup como archivo JSON
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], {type:'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-trieste-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error creando backup:', error);
      toast.error('Error creando backup');
    }
  };

  const restaurarBackup = async (backupFile) => {
    try {
      const fileContent = await backupFile.text();
      const backupData = JSON.parse(fileContent);
      
      toast.info('Restaurando backup...');
      const response = await axios.post(`${API}/admin/restore`, {
        backup_data: backupData.backup_data,
        collections: coleccionesSeleccionadas.length > 0 ? coleccionesSeleccionadas : null
      });
      
      if (response.data.success) {
        toast.success(`Backup restaurado: ${response.data.documents_restored} documentos`);
        cargarColecciones(); // Recargar estadísticas
      }
    } catch (error) {
      console.error('Error restaurando backup:', error);
      toast.error('Error restaurando backup');
    }
  };

  const resetearColecciones = async () => {
    if (coleccionesSeleccionadas.length === 0) {
      toast.warning('Seleccione al menos una base de datos para resetear');
      return;
    }

    try {
      toast.info('Reseteando bases de datos seleccionadas...');
      const response = await axios.post(`${API}/admin/reset`, {
        collections: coleccionesSeleccionadas,
        create_sample_data: crearDatosEjemplo
      });
      
      if (response.data.success) {
        toast.success('Bases de datos reseteadas exitosamente');
        setMostrarConfirmacionReset(false);
        setColeccionesSeleccionadas([]);
        cargarColecciones(); // Recargar estadísticas
      }
    } catch (error) {
      console.error('Error reseteando:', error);
      toast.error('Error reseteando bases de datos');
    }
  };

  const resetearSistemaCompleto = async () => {
    try {
      toast.info('Reseteando sistema completo...');
      const response = await axios.post(`${API}/admin/reset-complete?create_sample_data=${crearDatosEjemplo}`);
      
      if (response.data.success) {
        toast.success(`Sistema completamente reseteado: ${response.data.total_documents_deleted} documentos eliminados`);
        setMostrarConfirmacionResetCompleto(false);
        
        // Recargar configuración
        localStorage.removeItem('trieste_config');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error reseteando sistema completo:', error);
      toast.error('Error reseteando sistema completo');
    }
  };

  const handleSeleccionarColeccion = (nombreColeccion, seleccionada) => {
    if (seleccionada) {
      setColeccionesSeleccionadas(prev => [...prev, nombreColeccion]);
    } else {
      setColeccionesSeleccionadas(prev => prev.filter(col => col !== nombreColeccion));
    }
  };

  const seleccionarTodasColecciones = () => {
    if (coleccionesSeleccionadas.length === colecciones.length) {
      setColeccionesSeleccionadas([]);
    } else {
      setColeccionesSeleccionadas(colecciones.map(col => col.name));
    }
  };

  const subirLogo = async (file) => {
    setCargandoLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const logoBase64 = e.target.result;
        
        const response = await axios.post(`${API}/admin/upload-logo`, logoBase64, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data.success) {
          setLogoBase64(logoBase64);
          setConfiguracion(prev => ({ ...prev, logo_url: logoBase64 }));
          toast.success('Logo subido exitosamente');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error subiendo logo:', error);
      toast.error('Error subiendo logo');
    } finally {
      setCargandoLogo(false);
    }
  };

  const cargarLogo = async () => {
    try {
      const response = await axios.get(`${API}/admin/logo`);
      if (response.data.success && response.data.logo) {
        setLogoBase64(response.data.logo);
        setConfiguracion(prev => ({ ...prev, logo_url: response.data.logo }));
      }
    } catch (error) {
      console.error('Error cargando logo:', error);
    }
  };

  useEffect(() => {
    // Cargar configuración guardada
    const configGuardada = localStorage.getItem('trieste_config');
    if (configGuardada) {
      setConfiguracion(JSON.parse(configGuardada));
    }
    
    // Cargar logo del sistema
    cargarLogo();
  }, []);

  useEffect(() => {
    // Cargar colecciones cuando se abre el modal y se cambia a la pestaña de administración
    if (mostrarConfig && tabActiva === 'admin') {
      cargarColecciones();
    }
  }, [mostrarConfig, tabActiva]);

  return (
    <Dialog open={mostrarConfig} onOpenChange={setMostrarConfig}>
      <DialogTrigger asChild>
        <Button className="config-button" title="Configuración del Taller">
          <Settings className="nav-icon" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dialog-content">
        <DialogHeader>
          <DialogTitle className="text-xl text-center" style={{color: 'var(--trieste-blue)'}}>
            Configuración del Sistema - Centro Trieste
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={tabActiva} onValueChange={setTabActiva} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="colores">Personalización</TabsTrigger>
            <TabsTrigger value="sistema">Sistema</TabsTrigger>
            <TabsTrigger value="admin">Administración BD</TabsTrigger>
          </TabsList>

          {/* Tab: Información General */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--trieste-blue)'}}>
                  Nombre del Taller *
                </label>
                <Input
                  value={configuracion.nombre_taller}
                  onChange={(e) => setConfiguracion(prev => ({ ...prev, nombre_taller: e.target.value }))}
                  placeholder="Centro de Servicios Automotriz Trieste"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--trieste-blue)'}}>
                  Teléfono
                </label>
                <Input
                  value={configuracion.telefono}
                  onChange={(e) => setConfiguracion(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="0000-000.00.00"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--trieste-blue)'}}>
                  Dirección Completa
                </label>
                <Input
                  value={configuracion.direccion}
                  onChange={(e) => setConfiguracion(prev => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Dirección completa del taller"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--trieste-blue)'}}>
                  Email Corporativo
                </label>
                <Input
                  type="email"
                  value={configuracion.email}
                  onChange={(e) => setConfiguracion(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@trieste.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--trieste-blue)'}}>
                  RIF/NIT
                </label>
                <Input
                  value={configuracion.rif}
                  onChange={(e) => setConfiguracion(prev => ({ ...prev, rif: e.target.value }))}
                  placeholder="J-12345678-9"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--trieste-blue)'}}>
                  Logo del Sistema
                </label>
                <div className="space-y-3">
                  {(logoBase64 || configuracion.logo_url) && (
                    <div className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50">
                      <img 
                        src={logoBase64 || configuracion.logo_url} 
                        alt="Logo actual" 
                        className="w-16 h-16 object-contain"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Logo actual</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLogoBase64('');
                            setConfiguracion(prev => ({ ...prev, logo_url: '' }));
                          }}
                          className="mt-1"
                        >
                          Eliminar Logo
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <label className="cursor-pointer">
                      <Button 
                        as="span" 
                        variant="outline" 
                        disabled={cargandoLogo}
                        className="flex items-center gap-2"
                      >
                        {cargandoLogo ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Subir Logo
                          </>
                        )}
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                              toast.error('El archivo debe ser menor a 2MB');
                              return;
                            }
                            subirLogo(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    
                    <Input
                      placeholder="O ingrese URL del logo"
                      value={configuracion.logo_url}
                      onChange={(e) => setConfiguracion(prev => ({ ...prev, logo_url: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Suba una imagen (PNG, JPG, SVG) o ingrese una URL. Tamaño máximo: 2MB
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Personalización de Colores */}
          <TabsContent value="colores" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{color: 'var(--trieste-blue)'}}>
                  Colores Principales
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Color Primario (Azul Principal)</label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={configuracion.colores.primario}
                        onChange={(e) => setConfiguracion(prev => ({
                          ...prev,
                          colores: { ...prev.colores, primario: e.target.value }
                        }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={configuracion.colores.primario}
                        onChange={(e) => setConfiguracion(prev => ({
                          ...prev,
                          colores: { ...prev.colores, primario: e.target.value }
                        }))}
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Color Secundario (Azul Oscuro)</label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={configuracion.colores.secundario}
                        onChange={(e) => setConfiguracion(prev => ({
                          ...prev,
                          colores: { ...prev.colores, secundario: e.target.value }
                        }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={configuracion.colores.secundario}
                        onChange={(e) => setConfiguracion(prev => ({
                          ...prev,
                          colores: { ...prev.colores, secundario: e.target.value }
                        }))}
                        placeholder="#1D4ED8"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Amarillo Trieste</label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={configuracion.colores.amarillo}
                        onChange={(e) => setConfiguracion(prev => ({
                          ...prev,
                          colores: { ...prev.colores, amarillo: e.target.value }
                        }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={configuracion.colores.amarillo}
                        onChange={(e) => setConfiguracion(prev => ({
                          ...prev,
                          colores: { ...prev.colores, amarillo: e.target.value }
                        }))}
                        placeholder="#FCD34D"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{color: 'var(--trieste-blue)'}}>
                  Vista Previa
                </h3>
                <div className="p-4 border rounded-lg space-y-3" style={{backgroundColor: configuracion.colores.fondoCards}}>
                  <div className="flex gap-2">
                    <Badge style={{backgroundColor: configuracion.colores.badges, color: configuracion.colores.textoBlanco}}>
                      Badge Ejemplo
                    </Badge>
                    <Badge style={{backgroundColor: configuracion.colores.amarillo, color: configuracion.colores.texto}}>
                      Amarillo Trieste
                    </Badge>
                  </div>
                  <Button style={{backgroundColor: configuracion.colores.primario, color: configuracion.colores.textoBlanco}}>
                    Botón Primario
                  </Button>
                  <div className="p-3 rounded" style={{backgroundColor: configuracion.colores.blanco, border: `1px solid ${configuracion.colores.borde}`}}>
                    <p style={{color: configuracion.colores.texto}}>Texto de ejemplo en tarjeta</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Configuraciones del Sistema */}
          <TabsContent value="sistema" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{color: 'var(--trieste-blue)'}}>
                  Funcionalidades
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Mostrar Avatares de Mecánicos</label>
                    <input
                      type="checkbox"
                      checked={configuracion.sistema.mostrarAvatares}
                      onChange={(e) => setConfiguracion(prev => ({
                        ...prev,
                        sistema: { ...prev.sistema, mostrarAvatares: e.target.checked }
                      }))}
                      className="toggle"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Múltiples Especialidades por Mecánico</label>
                    <input
                      type="checkbox"
                      checked={configuracion.sistema.permitirMultiplesEspecialidades}
                      onChange={(e) => setConfiguracion(prev => ({
                        ...prev,
                        sistema: { ...prev.sistema, permitirMultiplesEspecialidades: e.target.checked }
                      }))}
                      className="toggle"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Validación Obligatoria de Documentos</label>
                    <input
                      type="checkbox"
                      checked={configuracion.sistema.validacionDocumentosObligatoria}
                      onChange={(e) => setConfiguracion(prev => ({
                        ...prev,
                        sistema: { ...prev.sistema, validacionDocumentosObligatoria: e.target.checked }
                      }))}
                      className="toggle"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Habilitar Dictado por Voz</label>
                    <input
                      type="checkbox"
                      checked={configuracion.sistema.habilitarDictado}
                      onChange={(e) => setConfiguracion(prev => ({
                        ...prev,
                        sistema: { ...prev.sistema, habilitarDictado: e.target.checked }
                      }))}
                      className="toggle"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Habilitar Cámara</label>
                    <input
                      type="checkbox"
                      checked={configuracion.sistema.habilitarCamara}
                      onChange={(e) => setConfiguracion(prev => ({
                        ...prev,
                        sistema: { ...prev.sistema, habilitarCamara: e.target.checked }
                      }))}
                      className="toggle"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{color: 'var(--trieste-blue)'}}>
                  Formatos y Moneda
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Formato de Teléfono</label>
                    <Input
                      value={configuracion.sistema.formatoTelefono}
                      onChange={(e) => setConfiguracion(prev => ({
                        ...prev,
                        sistema: { ...prev.sistema, formatoTelefono: e.target.value }
                      }))}
                      placeholder="0000-000.00.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Moneda Principal</label>
                    <Select 
                      value={configuracion.sistema.monedaPrincipal}
                      onValueChange={(value) => setConfiguracion(prev => ({
                        ...prev,
                        sistema: { ...prev.sistema, monedaPrincipal: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                        <SelectItem value="VES">VES - Bolívar Venezolano</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mt-6" style={{color: 'var(--trieste-blue)'}}>
                  Impuestos
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Aplicar IVA</label>
                    <input
                      type="checkbox"
                      checked={configuracion.sistema.aplicarIVA}
                      onChange={(e) => setConfiguracion(prev => ({
                        ...prev,
                        sistema: { ...prev.sistema, aplicarIVA: e.target.checked }
                      }))}
                      className="toggle"
                    />
                  </div>
                  {configuracion.sistema.aplicarIVA && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Porcentaje IVA (%)</label>
                      <Input
                        type="number"
                        value={configuracion.sistema.porcentajeIVA}
                        onChange={(e) => setConfiguracion(prev => ({
                          ...prev,
                          sistema: { ...prev.sistema, porcentajeIVA: parseFloat(e.target.value) }
                        }))}
                        min="0"
                        max="30"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Aplicar IGTF (3%)</label>
                    <input
                      type="checkbox"
                      checked={configuracion.sistema.aplicarIGTF}
                      onChange={(e) => setConfiguracion(prev => ({
                        ...prev,
                        sistema: { ...prev.sistema, aplicarIGTF: e.target.checked }
                      }))}
                      className="toggle"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Administración de Base de Datos */}
          <TabsContent value="admin" className="space-y-6">
            <div className="space-y-6">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>¡PRECAUCIÓN!</strong> Estas operaciones pueden eliminar datos permanentemente. 
                  Asegúrese de crear un backup antes de proceder.
                </AlertDescription>
              </Alert>

              {/* Sección de Información de Base de Datos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Información de Bases de Datos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      Estado actual de las bases de datos del sistema
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={cargarColecciones}
                      disabled={cargandoColecciones}
                      className="flex items-center gap-2"
                    >
                      {cargandoColecciones ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Actualizar
                    </Button>
                  </div>
                  
                  {cargandoColecciones ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Cargando información...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {colecciones.map((coleccion) => (
                        <div key={coleccion.name} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={coleccionesSeleccionadas.includes(coleccion.name)}
                                onChange={(e) => handleSeleccionarColeccion(coleccion.name, e.target.checked)}
                                className="rounded"
                              />
                              <div>
                                <p className="font-medium text-sm">{coleccion.display_name}</p>
                                <p className="text-xs text-gray-500">{coleccion.name}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {coleccion.count} docs
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {colecciones.length > 0 && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={seleccionarTodasColecciones}
                      >
                        {coleccionesSeleccionadas.length === colecciones.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
                      </Button>
                      <Badge variant="secondary" className="flex items-center">
                        {coleccionesSeleccionadas.length} seleccionadas
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sección de Backup y Restauración */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <FileText className="w-5 h-5" />
                      Backup de Datos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Crear una copia de seguridad de las bases de datos seleccionadas
                    </p>
                    <Button 
                      onClick={crearBackup}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={colecciones.length === 0}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Crear Backup
                    </Button>
                    <p className="text-xs text-gray-500">
                      {coleccionesSeleccionadas.length > 0 
                        ? `Backup de ${coleccionesSeleccionadas.length} base(s) de datos seleccionada(s)`
                        : 'Backup completo de todas las bases de datos'
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <ArrowRight className="w-5 h-5" />
                      Restaurar Backup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Restaurar datos desde un archivo de backup
                    </p>
                    <label className="cursor-pointer">
                      <Button variant="outline" as="span" className="w-full">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Seleccionar Archivo de Backup
                      </Button>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            restaurarBackup(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500">
                      Seleccione un archivo .json de backup para restaurar
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Sección de Reset */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                      <Trash2 className="w-5 h-5" />
                      Reset Selectivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Resetear solo las bases de datos seleccionadas
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="crearEjemplos"
                        checked={crearDatosEjemplo}
                        onChange={(e) => setCrearDatosEjemplo(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="crearEjemplos" className="text-sm">
                        Crear datos de ejemplo después del reset
                      </label>
                    </div>
                    
                    <Button 
                      onClick={() => setMostrarConfirmacionReset(true)}
                      variant="destructive"
                      className="w-full"
                      disabled={coleccionesSeleccionadas.length === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Reset Selectivo
                    </Button>
                    <p className="text-xs text-gray-500">
                      {coleccionesSeleccionadas.length > 0 
                        ? `Resetear ${coleccionesSeleccionadas.length} base(s) de datos`
                        : 'Seleccione bases de datos para resetear'
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      Reset Completo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Resetear completamente el sistema (TODAS las bases de datos y configuraciones)
                    </p>
                    
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 text-xs">
                        Esta acción eliminará TODOS los datos del sistema y no se puede deshacer
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      onClick={() => setMostrarConfirmacionResetCompleto(true)}
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Reset Completo del Sistema
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Modal de Confirmación Reset Selectivo */}
            <Dialog open={mostrarConfirmacionReset} onOpenChange={setMostrarConfirmacionReset}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-orange-700">
                    <Trash2 className="w-5 h-5" />
                    Confirmar Reset Selectivo
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm">
                    ¿Está seguro de que desea resetear las siguientes bases de datos?
                  </p>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {coleccionesSeleccionadas.map(coleccion => {
                        const info = colecciones.find(c => c.name === coleccion);
                        return (
                          <li key={coleccion}>
                            <strong>{info?.display_name || coleccion}</strong> ({info?.count || 0} documentos)
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  
                  {crearDatosEjemplo && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 text-sm">
                        Se crearán datos de ejemplo después del reset
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setMostrarConfirmacionReset(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={resetearColecciones}
                    >
                      Confirmar Reset
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Modal de Confirmación Reset Completo */}
            <Dialog open={mostrarConfirmacionResetCompleto} onOpenChange={setMostrarConfirmacionResetCompleto}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    ⚠️ CONFIRMAR RESET COMPLETO DEL SISTEMA
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>¡ADVERTENCIA CRÍTICA!</strong><br/>
                      Esta acción eliminará PERMANENTEMENTE:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Todos los vehículos y clientes</li>
                        <li>Todas las órdenes de trabajo</li>
                        <li>Todos los mecánicos y servicios</li>
                        <li>Todos los presupuestos y facturas</li>
                        <li>Todo el historial y configuraciones</li>
                        <li>El logo del sistema</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="crearEjemplosCompleto"
                      checked={crearDatosEjemplo}
                      onChange={(e) => setCrearDatosEjemplo(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="crearEjemplosCompleto" className="text-sm">
                      Crear datos de ejemplo después del reset completo
                    </label>
                  </div>
                  
                  <p className="text-sm font-medium">
                    Escriba "RESETEAR SISTEMA" para confirmar:
                  </p>
                  
                  <Input
                    placeholder="Escriba RESETEAR SISTEMA para confirmar"
                    onChange={(e) => {
                      // Esta validación se manejará en el botón
                    }}
                    id="confirmacionTexto"
                  />
                  
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setMostrarConfirmacionResetCompleto(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => {
                        const texto = document.getElementById('confirmacionTexto').value;
                        if (texto === 'RESETEAR SISTEMA') {
                          resetearSistemaCompleto();
                        } else {
                          toast.error('Debe escribir exactamente "RESETEAR SISTEMA" para confirmar');
                        }
                      }}
                    >
                      ⚠️ RESETEAR SISTEMA COMPLETO
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setMostrarConfig(false)}>
            Cancelar
          </Button>
          <Button onClick={guardarConfiguracion} className="btn-primary">
            Guardar Configuración
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Navegación Principal (actualizada con diseño Trieste)
const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="trieste-nav">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="flex items-center">
          <img 
            src="/logo_trieste.png" 
            alt="Logo Trieste" 
            className="trieste-logo"
          />
          <div className="trieste-brand">
            Centro de Servicios Automotriz Trieste
          </div>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="flex gap-3">
            <Link 
              to="/dashboard" 
              className={`nav-button ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              <ClipboardList className="nav-icon" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
            
            <Link 
              to="/registro" 
              className={`nav-button ${location.pathname === '/registro' ? 'active' : ''}`}
            >
              <Plus className="nav-icon" />
              <span className="hidden md:inline">Registro</span>
            </Link>
            
            <Link 
              to="/ordenes" 
              className={`nav-button ${location.pathname === '/ordenes' ? 'active' : ''}`}
            >
              <Truck className="nav-icon" />
              <span className="hidden md:inline">Órdenes</span>
            </Link>
            
            <Link 
              to="/mecanicos" 
              className={`nav-button ${location.pathname === '/mecanicos' ? 'active' : ''}`}
            >
              <UserCheck className="nav-icon" />
              <span className="hidden md:inline">Mecánicos</span>
            </Link>
            
            <Link 
              to="/servicios" 
              className={`nav-button ${location.pathname === '/servicios' ? 'active' : ''}`}
            >
              <Package className="nav-icon" />
              <span className="hidden md:inline">Servicios</span>
            </Link>
            
            <Link 
              to="/vehiculos" 
              className={`nav-button ${location.pathname === '/vehiculos' ? 'active' : ''}`}
            >
              <Car className="nav-icon" />
              <span className="hidden md:inline">Vehículos</span>
            </Link>
          </div>
          
          <ConfiguracionTaller />
        </div>
      </div>
    </nav>
  );
};

// Gestión de Vehículos
const VehiculosList = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState({});
  const [filtroTexto, setFiltroTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const cargarVehiculos = async () => {
    try {
      const [vehiculosRes, clientesRes] = await Promise.all([
        axios.get(`${API}/vehiculos`),
        axios.get(`${API}/clientes`)
      ]);
      
      setVehiculos(vehiculosRes.data);
      
      // Crear un mapa de clientes por ID para acceso rápido
      const clientesMap = {};
      clientesRes.data.forEach(cliente => {
        clientesMap[cliente.id] = cliente;
      });
      setClientes(clientesMap);
    } catch (error) {
      console.error('Error cargando vehículos:', error);
      toast.error('Error cargando los vehículos');
    } finally {
      setCargando(false);
    }
  };

  const vehiculosFiltrados = vehiculos.filter(vehiculo => {
    const cliente = clientes[vehiculo.cliente_id];
    const busqueda = filtroTexto.toLowerCase();
    
    return (
      vehiculo.matricula.toLowerCase().includes(busqueda) ||
      vehiculo.marca.toLowerCase().includes(busqueda) ||
      vehiculo.modelo.toLowerCase().includes(busqueda) ||
      (cliente && cliente.nombre.toLowerCase().includes(busqueda)) ||
      (cliente && cliente.empresa && cliente.empresa.toLowerCase().includes(busqueda)) ||
      (vehiculo.color && vehiculo.color.toLowerCase().includes(busqueda))
    );
  });

  if (cargando) {
    return <div className="flex items-center justify-center h-screen">Cargando vehículos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Vehículos</h1>
        <Button onClick={() => navigate('/registro')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Vehículo
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por matrícula, marca, modelo, cliente o empresa..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{vehiculos.length}</div>
            <p className="text-sm text-gray-600">Total Vehículos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {vehiculosFiltrados.length}
            </div>
            <p className="text-sm text-gray-600">Resultados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(vehiculos.map(v => clientes[v.cliente_id]?.empresa || clientes[v.cliente_id]?.nombre)).size}
            </div>
            <p className="text-sm text-gray-600">Clientes/Empresas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {new Set(vehiculos.map(v => v.marca)).size}
            </div>
            <p className="text-sm text-gray-600">Marcas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de vehículos */}
      <div className="grid gap-4">
        {vehiculosFiltrados.map((vehiculo) => {
          const cliente = clientes[vehiculo.cliente_id];
          return (
            <Card key={vehiculo.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/vehiculo/${vehiculo.id}`)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Car className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{vehiculo.matricula}</h3>
                        <Badge variant="outline">
                          {vehiculo.marca} {vehiculo.modelo}
                        </Badge>
                        {vehiculo.año && (
                          <Badge variant="secondary">{vehiculo.año}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        {cliente && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {cliente.empresa ? `${cliente.empresa} - ${cliente.nombre}` : cliente.nombre}
                          </span>
                        )}
                        {vehiculo.color && (
                          <span>Color: {vehiculo.color}</span>
                        )}
                        {vehiculo.kilometraje && (
                          <span>{vehiculo.kilometraje.toLocaleString()} km</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/vehiculo/${vehiculo.id}/historial`);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Historial
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/vehiculo/${vehiculo.id}`);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {vehiculosFiltrados.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {filtroTexto ? 'No se encontraron vehículos con ese criterio' : 'No hay vehículos registrados'}
            </p>
            {filtroTexto && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setFiltroTexto('')}
              >
                Limpiar filtro
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Detalle de Vehículo (mejorado con edición)
const VehiculoDetalle = () => {
  const { vehiculoId } = useParams();
  const [vehiculo, setVehiculo] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [ordenesRecientes, setOrdenesRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para modales
  const [mostrarEdicion, setMostrarEdicion] = useState(false);
  const [mostrarEliminacion, setMostrarEliminacion] = useState(false);
  const [mostrarCambioMatricula, setMostrarCambioMatricula] = useState(false);
  
  // Estados para edición
  const [datosEdicion, setDatosEdicion] = useState({});
  const [clienteEdicion, setClienteEdicion] = useState({});
  const [nuevaMatricula, setNuevaMatricula] = useState('');
  const [clientes, setClientes] = useState([]);
  const [creandoNuevoCliente, setCreandoNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '', telefono: '', empresa: '', email: ''
  });
  
  // Estados para confirmaciones de eliminación
  const [confirmacionEliminacion, setConfirmacionEliminacion] = useState('');
  const [pasoEliminacion, setPasoEliminacion] = useState(1);
  
  // Estados para cambio de matrícula
  const [confirmacionMatricula, setConfirmacionMatricula] = useState('');
  const [pasoMatricula, setPasoMatricula] = useState(1);
  const [motivoCambio, setMotivoCambio] = useState('');
  
  const navigate = useNavigate();

  // Hook de dictado
  const { grabando, procesandoIA, campoActivo, iniciarDictado } = useDictado();

  // Función para manejar dictado de cliente
  const handleDictadoCliente = async () => {
    const resultado = await iniciarDictado('vehiculo', 'cliente');
    if (resultado.success && resultado.datos && resultado.datos.cliente) {
      const datos = resultado.datos.cliente;
      setNuevoCliente(prev => ({
        ...prev,
        nombre: datos.nombre || prev.nombre,
        telefono: datos.telefono || prev.telefono,
        empresa: datos.empresa || prev.empresa,
        email: datos.email || prev.email
      }));
    }
  };

  useEffect(() => {
    cargarDetalles();
  }, [vehiculoId]);

  const cargarDetalles = async () => {
    try {
      const vehiculoRes = await axios.get(`${API}/vehiculos/${vehiculoId}`);
      const vehiculoData = vehiculoRes.data;
      setVehiculo(vehiculoData);
      setDatosEdicion(vehiculoData);

      const [clienteRes, historialRes, clientesRes] = await Promise.all([
        axios.get(`${API}/clientes/${vehiculoData.cliente_id}`),
        axios.get(`${API}/vehiculos/${vehiculoId}/historial`),
        axios.get(`${API}/clientes`)
      ]);

      setCliente(clienteRes.data);
      setClienteEdicion(clienteRes.data);
      setOrdenesRecientes(historialRes.data.slice(0, 5));
      setClientes(clientesRes.data);
    } catch (error) {
      console.error('Error cargando detalles del vehículo:', error);
      toast.error('Error cargando los detalles del vehículo');
    } finally {
      setCargando(false);
    }
  };

  const guardarEdicion = async () => {
    try {
      // Guardar cambios del vehículo
      await axios.put(`${API}/vehiculos/${vehiculoId}`, {
        marca: datosEdicion.marca,
        modelo: datosEdicion.modelo,
        año: datosEdicion.año ? parseInt(datosEdicion.año) : null,
        color: datosEdicion.color,
        kilometraje: datosEdicion.kilometraje ? parseInt(datosEdicion.kilometraje) : null,
        cliente_id: clienteEdicion.id // Permitir cambio de propietario
      });
      
      // Guardar cambios del cliente si se modificó
      if (clienteEdicion.id === cliente.id) {
        await axios.put(`${API}/clientes/${clienteEdicion.id}`, {
          nombre: clienteEdicion.nombre,
          telefono: clienteEdicion.telefono,
          empresa: clienteEdicion.empresa,
          email: clienteEdicion.email
        });
      }
      
      setVehiculo({...vehiculo, ...datosEdicion, cliente_id: clienteEdicion.id});
      setCliente(clienteEdicion);
      setMostrarEdicion(false);
      toast.success('Datos actualizados correctamente');
    } catch (error) {
      console.error('Error actualizando datos:', error);
      toast.error('Error al actualizar los datos');
    }
  };

  const crearNuevoCliente = async () => {
    try {
      const response = await axios.post(`${API}/clientes`, nuevoCliente);
      const clienteCreado = response.data;
      
      // Agregar a la lista de clientes y seleccionarlo
      setClientes(prev => [...prev, clienteCreado]);
      setClienteEdicion(clienteCreado);
      setNuevoCliente({ nombre: '', telefono: '', empresa: '', email: '' });
      setCreandoNuevoCliente(false);
      
      toast.success('Cliente creado y asignado correctamente');
    } catch (error) {
      console.error('Error creando cliente:', error);
      toast.error('Error al crear el cliente');
    }
  };

  const eliminarVehiculo = async () => {
    try {
      // Verificar si tiene órdenes activas
      if (ordenesRecientes.some(o => !['terminado', 'entregado'].includes(o.estado))) {
        toast.error('No se puede eliminar: el vehículo tiene órdenes activas');
        return;
      }

      await axios.delete(`${API}/vehiculos/${vehiculoId}`);
      toast.success('Vehículo eliminado correctamente');
      navigate('/vehiculos');
    } catch (error) {
      console.error('Error eliminando vehículo:', error);
      toast.error('Error al eliminar el vehículo');
    }
  };

  const cambiarMatricula = async () => {
    try {
      // Validar nueva matrícula
      const matriculaNormalizada = nuevaMatricula.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (matriculaNormalizada.length < 4 || matriculaNormalizada.length > 7) {
        toast.error('La matrícula debe tener entre 4 y 7 caracteres');
        return;
      }

      // Verificar que no existe
      const verificacion = await axios.get(`${API}/vehiculos/verificar-matricula/${matriculaNormalizada}`);
      if (verificacion.data.existe) {
        toast.error('Esta matrícula ya está registrada');
        return;
      }

      // Crear registro de cambio en el historial
      await axios.post(`${API}/vehiculos/${vehiculoId}/cambio-matricula`, {
        matricula_anterior: vehiculo.matricula,
        matricula_nueva: matriculaNormalizada,
        motivo: motivoCambio
      });

      setVehiculo({...vehiculo, matricula: matriculaNormalizada});
      setMostrarCambioMatricula(false);
      setPasoMatricula(1);
      setNuevaMatricula('');
      setMotivoCambio('');
      toast.success('Matrícula cambiada exitosamente');
    } catch (error) {
      console.error('Error cambiando matrícula:', error);
      toast.error('Error al cambiar la matrícula');
    }
  };

  const validarMatricula = (valor) => {
    const limpio = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (limpio.length <= 7) {
      setNuevaMatricula(limpio);
    }
  };

  const getEstadoBadge = (estado) => {
    const estadoConfig = {
      'recibido': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3 h-3" /> },
      'diagnosticando': { color: 'bg-yellow-100 text-yellow-800', icon: <Search className="w-3 h-3" /> },
      'presupuestado': { color: 'bg-purple-100 text-purple-800', icon: <FileText className="w-3 h-3" /> },
      'aprobado': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      'en_reparacion': { color: 'bg-orange-100 text-orange-800', icon: <Wrench className="w-3 h-3" /> },
      'terminado': { color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-3 h-3" /> },
      'entregado': { color: 'bg-green-500 text-white', icon: <CheckCircle className="w-3 h-3" /> }
    };
    
    const config = estadoConfig[estado] || estadoConfig['recibido'];
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {estado.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-screen">Cargando detalles...</div>;
  }

  if (!vehiculo) {
    return <div className="text-center py-8">Vehículo no encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{vehiculo.matricula}</h1>
          <p className="text-xl text-gray-600 mt-1">
            {vehiculo.marca} {vehiculo.modelo} {vehiculo.año}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/vehiculos')} variant="outline">
            Volver a Lista
          </Button>
          <Button onClick={() => navigate(`/vehiculo/${vehiculo.id}/historial`)}>
            Ver Historial Completo
          </Button>
          
          {/* Botones de administración */}
          <div className="flex gap-2">
            <Button 
              onClick={() => setMostrarEdicion(true)}
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            
            <Button 
              onClick={() => setMostrarCambioMatricula(true)}
              variant="outline"
              className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
            >
              <Settings className="w-4 h-4 mr-1" />
              Cambiar Matrícula
            </Button>
            
            <Button 
              onClick={() => setMostrarEliminacion(true)}
              variant="outline"
              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      {/* Modales */}
      
      {/* Modal de Edición */}
      <Dialog open={mostrarEdicion} onOpenChange={setMostrarEdicion}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Vehículo y Propietario</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="vehiculo" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vehiculo">Datos del Vehículo</TabsTrigger>
              <TabsTrigger value="propietario">Propietario</TabsTrigger>
            </TabsList>
            
            <TabsContent value="vehiculo" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Marca</label>
                  <Input
                    value={datosEdicion.marca || ''}
                    onChange={(e) => setDatosEdicion(prev => ({ ...prev, marca: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Modelo</label>
                  <Input
                    value={datosEdicion.modelo || ''}
                    onChange={(e) => setDatosEdicion(prev => ({ ...prev, modelo: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Año</label>
                  <Input
                    type="number"
                    value={datosEdicion.año || ''}
                    onChange={(e) => setDatosEdicion(prev => ({ ...prev, año: e.target.value }))}
                    min="1950"
                    max="2030"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <Input
                    value={datosEdicion.color || ''}
                    onChange={(e) => setDatosEdicion(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Kilometraje</label>
                  <Input
                    type="number"
                    value={datosEdicion.kilometraje || ''}
                    onChange={(e) => setDatosEdicion(prev => ({ ...prev, kilometraje: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Matrícula:</strong> {vehiculo.matricula} 
                  <span className="text-gray-500 ml-2">(Use "Cambiar Matrícula" para modificar)</span>
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="propietario" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Propietario del Vehículo</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreandoNuevoCliente(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Nuevo Cliente
                  </Button>
                </div>
              </div>

              {!creandoNuevoCliente ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Seleccionar Cliente</label>
                    <Select 
                      value={clienteEdicion.id}
                      onValueChange={(value) => {
                        const clienteSeleccionado = clientes.find(c => c.id === value);
                        if (clienteSeleccionado) {
                          setClienteEdicion(clienteSeleccionado);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cli) => (
                          <SelectItem key={cli.id} value={cli.id}>
                            {cli.empresa ? `${cli.empresa} - ${cli.nombre}` : cli.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Datos del Cliente</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nombre *</label>
                        <Input
                          value={clienteEdicion.nombre || ''}
                          onChange={(e) => setClienteEdicion(prev => ({ ...prev, nombre: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Teléfono</label>
                        <Input
                          value={clienteEdicion.telefono || ''}
                          onChange={(e) => setClienteEdicion(prev => ({ ...prev, telefono: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Empresa</label>
                        <Input
                          value={clienteEdicion.empresa || ''}
                          onChange={(e) => setClienteEdicion(prev => ({ ...prev, empresa: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input
                          type="email"
                          value={clienteEdicion.email || ''}
                          onChange={(e) => setClienteEdicion(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="border p-4 rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Crear Nuevo Cliente</h4>
                    <BotonDictado
                      onDictado={handleDictadoCliente}
                      grabando={grabando}
                      procesandoIA={procesandoIA}
                      campoActivo={campoActivo}
                      campo="cliente"
                      texto="Dictar"
                      size="sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nombre *</label>
                      <Input
                        value={nuevoCliente.nombre}
                        onChange={(e) => setNuevoCliente(prev => ({ ...prev, nombre: e.target.value }))}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Teléfono</label>
                      <Input
                        value={nuevoCliente.telefono}
                        onChange={(e) => setNuevoCliente(prev => ({ ...prev, telefono: e.target.value }))}
                        placeholder="Número de teléfono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Empresa</label>
                      <Input
                        value={nuevoCliente.empresa}
                        onChange={(e) => setNuevoCliente(prev => ({ ...prev, empresa: e.target.value }))}
                        placeholder="Nombre de la empresa"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        type="email"
                        value={nuevoCliente.email}
                        onChange={(e) => setNuevoCliente(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Correo electrónico"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setCreandoNuevoCliente(false);
                        setNuevoCliente({ nombre: '', telefono: '', empresa: '', email: '' });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={crearNuevoCliente}
                      disabled={!nuevoCliente.nombre}
                    >
                      Crear y Asignar
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setMostrarEdicion(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarEdicion}>
              Guardar Todos los Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Eliminación */}
      <Dialog open={mostrarEliminacion} onOpenChange={setMostrarEliminacion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Eliminar Vehículo</DialogTitle>
          </DialogHeader>
          
          {pasoEliminacion === 1 && (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>ADVERTENCIA:</strong> Esta acción eliminará permanentemente el vehículo 
                  <strong> {vehiculo.matricula}</strong> y todo su historial.
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Se eliminarán:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Datos del vehículo</li>
                  <li>• {ordenesRecientes.length} órdenes de trabajo</li>
                  <li>• Historial completo</li>
                  <li>• Fotos y documentos asociados</li>
                </ul>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMostrarEliminacion(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setPasoEliminacion(2)}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}
          
          {pasoEliminacion === 2 && (
            <div className="space-y-4">
              <p className="text-sm">
                Para confirmar, escriba <strong>"ELIMINAR {vehiculo.matricula}"</strong>:
              </p>
              <Input
                value={confirmacionEliminacion}
                onChange={(e) => setConfirmacionEliminacion(e.target.value)}
                placeholder="ELIMINAR ABC123"
                className="font-mono"
              />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPasoEliminacion(1)}>
                  Atrás
                </Button>
                <Button 
                  variant="destructive"
                  disabled={confirmacionEliminacion !== `ELIMINAR ${vehiculo.matricula}`}
                  onClick={() => setPasoEliminacion(3)}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}
          
          {pasoEliminacion === 3 && (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>ÚLTIMA CONFIRMACIÓN:</strong> ¿Está completamente seguro?
                  Esta acción NO se puede deshacer.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPasoEliminacion(2)}>
                  No, Cancelar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    eliminarVehiculo();
                    setMostrarEliminacion(false);
                    setPasoEliminacion(1);
                  }}
                >
                  Sí, Eliminar Definitivamente
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Cambio de Matrícula */}
      <Dialog open={mostrarCambioMatricula} onOpenChange={setMostrarCambioMatricula}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-yellow-600">🔄 Cambiar Matrícula</DialogTitle>
          </DialogHeader>
          
          {pasoMatricula === 1 && (
            <div className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50">
                <Settings className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>IMPORTANTE:</strong> El cambio de matrícula mantendrá todo el historial
                  del vehículo. Use solo para cambios oficiales de placas.
                </AlertDescription>
              </Alert>
              
              <div>
                <label className="block text-sm font-medium mb-2">Matrícula Actual</label>
                <Input value={vehiculo.matricula} disabled className="bg-gray-100" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Nueva Matrícula</label>
                <Input
                  value={nuevaMatricula}
                  onChange={(e) => validarMatricula(e.target.value)}
                  placeholder="Ej: DEF456"
                  className="font-mono text-center tracking-wider uppercase"
                  maxLength={7}
                />
                <p className="text-xs text-gray-500 mt-1">4-7 caracteres alfanuméricos</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Motivo del Cambio</label>
                <Textarea
                  value={motivoCambio}
                  onChange={(e) => setMotivoCambio(e.target.value)}
                  placeholder="Ej: Cambio oficial de placas por renovación"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMostrarCambioMatricula(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => setPasoMatricula(2)}
                  disabled={nuevaMatricula.length < 4 || !motivoCambio.trim()}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}
          
          {pasoMatricula === 2 && (
            <div className="space-y-4">
              <p className="text-sm">
                Para confirmar el cambio de <strong>{vehiculo.matricula}</strong> a <strong>{nuevaMatricula}</strong>,
                escriba <strong>"CAMBIAR MATRICULA"</strong>:
              </p>
              <Input
                value={confirmacionMatricula}
                onChange={(e) => setConfirmacionMatricula(e.target.value)}
                placeholder="CAMBIAR MATRICULA"
                className="font-mono"
              />
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Se mantendrá:</strong> Todo el historial, órdenes y datos del vehículo.
                  Solo cambiará la matrícula.
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPasoMatricula(1)}>
                  Atrás
                </Button>
                <Button 
                  disabled={confirmacionMatricula !== "CAMBIAR MATRICULA"}
                  onClick={() => {
                    cambiarMatricula();
                  }}
                >
                  Confirmar Cambio
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Información del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula/Placa</label>
                  <p className="text-lg font-semibold">{vehiculo.matricula}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca y Modelo</label>
                  <p className="text-lg">{vehiculo.marca} {vehiculo.modelo}</p>
                </div>
                {vehiculo.año && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                    <p className="text-lg">{vehiculo.año}</p>
                  </div>
                )}
                {vehiculo.color && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <p className="text-lg">{vehiculo.color}</p>
                  </div>
                )}
                {vehiculo.kilometraje && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kilometraje</label>
                    <p className="text-lg">{vehiculo.kilometraje.toLocaleString()} km</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registro</label>
                  <p className="text-sm text-gray-600">
                    {new Date(vehiculo.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              {vehiculo.foto_matricula && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foto de la Matrícula</label>
                  <img 
                    src={vehiculo.foto_matricula} 
                    alt="Matrícula" 
                    className="max-w-sm h-auto border rounded-lg shadow-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Información del Propietario
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cliente && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <p className="text-lg">{cliente.nombre}</p>
                  </div>
                  {cliente.empresa && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                      <p className="text-lg">{cliente.empresa}</p>
                    </div>
                  )}
                  {cliente.telefono && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <div className="flex items-center gap-2">
                        <p className="text-lg">{cliente.telefono}</p>
                        <Button size="sm" variant="outline">
                          <PhoneCall className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {cliente.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-lg">{cliente.email}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full"
                onClick={() => {
                  // Crear nueva orden para este vehículo
                  navigate('/registro', { 
                    state: { 
                      vehiculo: vehiculo,
                      cliente: cliente 
                    }
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden de Trabajo
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/vehiculo/${vehiculo.id}/historial`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Historial Completo
              </Button>
              {cliente && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/cliente/${cliente.id}`)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Ver Otros Vehículos
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Órdenes:</span>
                  <span className="font-semibold">{ordenesRecientes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Órdenes Activas:</span>
                  <span className="font-semibold">
                    {ordenesRecientes.filter(o => !['terminado', 'entregado'].includes(o.estado)).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historial Reciente */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historial Reciente</CardTitle>
            <Button 
              variant="outline"
              onClick={() => navigate(`/vehiculo/${vehiculo.id}/historial`)}
            >
              Ver Todo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ordenesRecientes.map((orden) => (
              <div key={orden.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Orden #{orden.id.slice(-8)}</p>
                    {getEstadoBadge(orden.estado)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(orden.fecha_ingreso).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-sm"><strong>Diagnóstico:</strong></p>
                  <p className="text-sm text-gray-600">{orden.diagnostico || 'Pendiente'}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/orden/${orden.id}`)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {ordenesRecientes.length === 0 && (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay órdenes de trabajo registradas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Historial Completo del Vehículo
const VehiculoHistorial = () => {
  const { vehiculoId } = useParams();
  const [vehiculo, setVehiculo] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarHistorial();
  }, [vehiculoId]);

  const cargarHistorial = async () => {
    try {
      const [vehiculoRes, historialRes] = await Promise.all([
        axios.get(`${API}/vehiculos/${vehiculoId}`),
        axios.get(`${API}/vehiculos/${vehiculoId}/historial`)
      ]);

      setVehiculo(vehiculoRes.data);
      setOrdenes(historialRes.data);
    } catch (error) {
      console.error('Error cargando historial:', error);
      toast.error('Error cargando el historial del vehículo');
    } finally {
      setCargando(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const estadoConfig = {
      'recibido': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3 h-3" /> },
      'diagnosticando': { color: 'bg-yellow-100 text-yellow-800', icon: <Search className="w-3 h-3" /> },
      'presupuestado': { color: 'bg-purple-100 text-purple-800', icon: <FileText className="w-3 h-3" /> },
      'aprobado': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      'en_reparacion': { color: 'bg-orange-100 text-orange-800', icon: <Wrench className="w-3 h-3" /> },
      'terminado': { color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-3 h-3" /> },
      'entregado': { color: 'bg-green-500 text-white', icon: <CheckCircle className="w-3 h-3" /> }
    };
    
    const config = estadoConfig[estado] || estadoConfig['recibido'];
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {estado.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-screen">Cargando historial...</div>;
  }

  if (!vehiculo) {
    return <div className="text-center py-8">Vehículo no encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historial Completo</h1>
          <p className="text-xl text-gray-600 mt-1">
            {vehiculo.matricula} - {vehiculo.marca} {vehiculo.modelo}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate(`/vehiculo/${vehiculo.id}`)} variant="outline">
            Volver a Detalles
          </Button>
          <Button onClick={() => navigate('/vehiculos')} variant="outline">
            Lista de Vehículos
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{ordenes.length}</div>
            <p className="text-sm text-gray-600">Total Órdenes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {ordenes.filter(o => o.estado === 'entregado').length}
            </div>
            <p className="text-sm text-gray-600">Completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {ordenes.filter(o => !['terminado', 'entregado'].includes(o.estado)).length}
            </div>
            <p className="text-sm text-gray-600">En Proceso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${ordenes.reduce((total, orden) => total + (orden.presupuesto_total || 0), 0).toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">Total Facturado</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline de Órdenes */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Órdenes de Trabajo</CardTitle>
          <CardDescription>Historial completo de todas las intervenciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {ordenes.map((orden, index) => (
              <div key={orden.id} className="relative">
                {index < ordenes.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200"></div>
                )}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-blue-600">{ordenes.length - index}</span>
                  </div>
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Orden #{orden.id.slice(-8)}</h3>
                          {getEstadoBadge(orden.estado)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {new Date(orden.fecha_ingreso).toLocaleDateString('es-ES')}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/orden/${orden.id}`)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Diagnóstico:</strong> {orden.diagnostico || 'Pendiente'}</p>
                        {orden.observaciones && (
                          <p className="text-sm"><strong>Observaciones:</strong> {orden.observaciones}</p>
                        )}
                        {orden.presupuesto_total && (
                          <p className="text-sm"><strong>Presupuesto:</strong> ${orden.presupuesto_total.toFixed(2)}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
          
          {ordenes.length === 0 && (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay órdenes de trabajo registradas para este vehículo</p>
              <Button 
                className="mt-4"
                onClick={() => navigate('/registro')}
              >
                Crear Primera Orden
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// App Principal
function App() {
  // Test de conexión al iniciar
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await axios.get(`${API}/`);
        console.log('Conexión exitosa:', response.data);
      } catch (error) {
        console.error('Error de conexión:', error);
        toast.error('Error conectando con el servidor');
      }
    };
    
    testConnection();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Navigation />
        <div className="main-container">
          <main className="p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/registro" element={<RegistroVehiculo />} />
              <Route path="/ordenes" element={<OrdenesListado />} />
              <Route path="/orden/:ordenId" element={<OrdenDetalle />} />
              <Route path="/orden/:ordenId/editar" element={<OrdenEditar />} />
              <Route path="/mecanicos" element={<MecanicosList />} />
              <Route path="/servicios" element={<ServiciosRepuestos />} />
              <Route path="/vehiculos" element={<VehiculosList />} />
              <Route path="/vehiculo/:vehiculoId" element={<VehiculoDetalle />} />
              <Route path="/vehiculo/:vehiculoId/historial" element={<VehiculoHistorial />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;