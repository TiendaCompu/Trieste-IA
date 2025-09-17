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
  PhoneCall
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Búsqueda Principal por Matrícula
const BusquedaMatricula = () => {
  const [matricula, setMatricula] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [vehiculoEncontrado, setVehiculoEncontrado] = useState(null);
  const [cliente, setCliente] = useState(null);
  const navigate = useNavigate();

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
        toast.success('Vehículo encontrado');
      } else {
        // Vehículo no encontrado, ir a registro
        setVehiculoEncontrado(null);
        setCliente(null);
        toast.info('Vehículo no encontrado. Ir a registro.');
        navigate('/registro', { state: { matricula_predefinida: matricula } });
      }
    } catch (error) {
      console.error('Error buscando vehículo:', error);
      toast.error('Error en la búsqueda');
    } finally {
      setBuscando(false);
    }
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
        axios.get(`${API}/ordenes`)
      ]);
      
      setEstadisticas(statsRes.data);
      setOrdenesRecientes(ordenesRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error cargando el dashboard');
    }
  };

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
        <Button onClick={() => navigate('/registro')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Registro Manual
        </Button>
      </div>

      {/* Búsqueda Principal por Matrícula */}
      <BusquedaMatricula />

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Órdenes Activas</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{estadisticas.ordenes_activas}</div>
            <p className="text-xs text-blue-600">En proceso actualmente</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Órdenes</CardTitle>
            <Truck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{estadisticas.total_ordenes}</div>
            <p className="text-xs text-green-600">Órdenes registradas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Vehículos</CardTitle>
            <Car className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{estadisticas.total_vehiculos}</div>
            <p className="text-xs text-purple-600">En base de datos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Clientes</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{estadisticas.total_clientes}</div>
            <p className="text-xs text-orange-600">Empresas registradas</p>
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
  const [filtro, setFiltro] = useState('todas');
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    try {
      const response = await axios.get(`${API}/ordenes`);
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

  const ordenesFiltradas = ordenes.filter(orden => {
    if (filtro === 'todas') return true;
    if (filtro === 'activas') return !['terminado', 'entregado'].includes(orden.estado);
    return orden.estado === filtro;
  });

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

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={filtro === 'todas' ? 'default' : 'outline'}
          onClick={() => setFiltro('todas')}
        >
          Todas ({ordenes.length})
        </Button>
        <Button 
          variant={filtro === 'activas' ? 'default' : 'outline'}
          onClick={() => setFiltro('activas')}
        >
          Activas ({ordenes.filter(o => !['terminado', 'entregado'].includes(o.estado)).length})
        </Button>
        <Button 
          variant={filtro === 'recibido' ? 'default' : 'outline'}
          onClick={() => setFiltro('recibido')}
        >
          Recibidas ({ordenes.filter(o => o.estado === 'recibido').length})
        </Button>
        <Button 
          variant={filtro === 'en_reparacion' ? 'default' : 'outline'}
          onClick={() => setFiltro('en_reparacion')}
        >
          En Reparación ({ordenes.filter(o => o.estado === 'en_reparacion').length})
        </Button>
      </div>

      {/* Lista de Órdenes */}
      <div className="grid gap-4">
        {ordenesFiltradas.map((orden) => (
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/orden/${orden.id}/editar`)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ordenesFiltradas.length === 0 && (
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
      const [vehiculoRes, clienteRes] = await Promise.all([
        axios.get(`${API}/vehiculos/${ordenData.vehiculo_id}`),
        axios.get(`${API}/clientes/${ordenData.cliente_id}`)
      ]);

      setVehiculo(vehiculoRes.data);
      setCliente(clienteRes.data);
    } catch (error) {
      console.error('Error cargando detalles:', error);
      toast.error('Error cargando los detalles de la orden');
    } finally {
      setCargando(false);
    }
  };

  const agregarServicioAOrden = async () => {
    try {
      const servicioInfo = serviciosDisponibles.find(s => s.id === servicioSeleccionado);
      if (!servicioInfo) return;

      const nuevoServicio = {
        id: servicioInfo.id,
        nombre: servicioInfo.nombre,
        tipo: servicioInfo.tipo,
        precio_unitario: servicioInfo.precio,
        cantidad: parseInt(cantidadServicio),
        subtotal: servicioInfo.precio * parseInt(cantidadServicio)
      };

      const serviciosActualizados = [...(orden.servicios_repuestos || []), nuevoServicio];
      const presupuestoTotal = serviciosActualizados.reduce((total, item) => total + item.subtotal, 0);

      await axios.put(`${API}/ordenes/${ordenId}`, {
        servicios_repuestos: serviciosActualizados,
        presupuesto_total: presupuestoTotal
      });

      setOrden(prev => ({
        ...prev,
        servicios_repuestos: serviciosActualizados,
        presupuesto_total: presupuestoTotal
      }));

      setMostrarAgregarServicio(false);
      setServicioSeleccionado('');
      setCantidadServicio(1);
      
      toast.success('Servicio agregado al presupuesto');
    } catch (error) {
      console.error('Error agregando servicio:', error);
      toast.error('Error al agregar el servicio');
    }
  };

  const eliminarServicioDeOrden = async (indiceServicio) => {
    try {
      const serviciosActualizados = orden.servicios_repuestos.filter((_, index) => index !== indiceServicio);
      const presupuestoTotal = serviciosActualizados.reduce((total, item) => total + item.subtotal, 0);

      await axios.put(`${API}/ordenes/${ordenId}`, {
        servicios_repuestos: serviciosActualizados,
        presupuesto_total: presupuestoTotal
      });

      setOrden(prev => ({
        ...prev,
        servicios_repuestos: serviciosActualizados,
        presupuesto_total: presupuestoTotal
      }));

      toast.success('Servicio eliminado del presupuesto');
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      toast.error('Error al eliminar el servicio');
    }
  };

  const aprobarPresupuesto = async (aprobado) => {
    try {
      await axios.put(`${API}/ordenes/${ordenId}`, {
        aprobado_cliente: aprobado,
        estado: aprobado ? 'aprobado' : 'presupuestado'
      });

      setOrden(prev => ({
        ...prev,
        aprobado_cliente: aprobado,
        estado: aprobado ? 'aprobado' : 'presupuestado'
      }));

      toast.success(aprobado ? 'Presupuesto aprobado' : 'Presupuesto rechazado');
    } catch (error) {
      console.error('Error actualizando aprobación:', error);
      toast.error('Error al actualizar la aprobación');
    }
  };

  const cambiarEstado = async (nuevoEstado) => {
    try {
      await axios.put(`${API}/ordenes/${ordenId}`, { estado: nuevoEstado });
      setOrden(prev => ({ ...prev, estado: nuevoEstado }));
      toast.success('Estado actualizado correctamente');
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast.error('Error actualizando el estado');
    }
  };

  const asignarMecanico = async (mecanicoId) => {
    try {
      await axios.put(`${API}/ordenes/${ordenId}`, { mecanico_id: mecanicoId });
      setOrden(prev => ({ ...prev, mecanico_id: mecanicoId }));
      toast.success('Mecánico asignado correctamente');
    } catch (error) {
      console.error('Error asignando mecánico:', error);
      toast.error('Error asignando el mecánico');
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

        {/* Panel de Control */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Control de Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                variant={orden.estado === 'recibido' ? 'default' : 'outline'}
                onClick={() => cambiarEstado('recibido')}
              >
                Recibido
              </Button>
              <Button 
                className="w-full" 
                variant={orden.estado === 'diagnosticando' ? 'default' : 'outline'}
                onClick={() => cambiarEstado('diagnosticando')}
              >
                Diagnosticando
              </Button>
              <Button 
                className="w-full" 
                variant={orden.estado === 'presupuestado' ? 'default' : 'outline'}
                onClick={() => cambiarEstado('presupuestado')}
              >
                Presupuestado
              </Button>
              <Button 
                className="w-full" 
                variant={orden.estado === 'aprobado' ? 'default' : 'outline'}
                onClick={() => cambiarEstado('aprobado')}
              >
                Aprobado
              </Button>
              <Button 
                className="w-full" 
                variant={orden.estado === 'en_reparacion' ? 'default' : 'outline'}
                onClick={() => cambiarEstado('en_reparacion')}
              >
                En Reparación
              </Button>
              <Button 
                className="w-full" 
                variant={orden.estado === 'terminado' ? 'default' : 'outline'}
                onClick={() => cambiarEstado('terminado')}
              >
                Terminado
              </Button>
              <Button 
                className="w-full" 
                variant={orden.estado === 'entregado' ? 'default' : 'outline'}
                onClick={() => cambiarEstado('entregado')}
              >
                Entregado
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asignación de Mecánico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mecanicoAsignado && (
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="font-medium text-green-800">{mecanicoAsignado.nombre}</p>
                    <p className="text-sm text-green-600">Especialidad: {mecanicoAsignado.especialidad}</p>
                  </div>
                )}
                
                <Select onValueChange={asignarMecanico}>
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
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => aprobarPresupuesto(true)}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aprobar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => aprobarPresupuesto(false)}
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Gestión de Servicios/Repuestos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Servicios y Repuestos</CardTitle>
                <Dialog open={mostrarAgregarServicio} onOpenChange={setMostrarAgregarServicio}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-3 h-3 mr-1" />
                      Agregar Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agregar Servicio o Repuesto</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Servicio/Repuesto</label>
                        <Select value={servicioSeleccionado} onValueChange={setServicioSeleccionado}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar item" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviciosDisponibles.map((servicio) => (
                              <SelectItem key={servicio.id} value={servicio.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{servicio.nombre}</span>
                                  <Badge variant={servicio.tipo === 'servicio' ? 'default' : 'secondary'} className="ml-2">
                                    {servicio.tipo}
                                  </Badge>
                                  <span className="ml-2 font-bold">${servicio.precio.toFixed(2)}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {servicioSeleccionado && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm">
                            <strong>Descripción:</strong> {serviciosDisponibles.find(s => s.id === servicioSeleccionado)?.descripcion || 'Sin descripción'}
                          </p>
                          <p className="text-sm">
                            <strong>Precio unitario:</strong> ${serviciosDisponibles.find(s => s.id === servicioSeleccionado)?.precio.toFixed(2)}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Cantidad</label>
                        <Input
                          type="number"
                          min="1"
                          value={cantidadServicio}
                          onChange={(e) => setCantidadServicio(e.target.value)}
                        />
                      </div>
                      
                      {servicioSeleccionado && cantidadServicio && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="font-medium">
                            Subtotal: ${(serviciosDisponibles.find(s => s.id === servicioSeleccionado)?.precio * parseInt(cantidadServicio)).toFixed(2)}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setMostrarAgregarServicio(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={agregarServicioAOrden}
                          disabled={!servicioSeleccionado || cantidadServicio < 1}
                        >
                          Agregar al Presupuesto
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {orden.servicios_repuestos && orden.servicios_repuestos.length > 0 ? (
                <div className="space-y-3">
                  {orden.servicios_repuestos.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.nombre}</h4>
                          <Badge variant={item.tipo === 'servicio' ? 'default' : 'secondary'}>
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => eliminarServicioDeOrden(index)}
                        >
                          <AlertCircle className="w-3 h-3" />
                        </Button>
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
                  <p className="text-gray-600">No hay servicios agregados</p>
                  <p className="text-sm text-gray-500">Haga clic en "Agregar Item" para comenzar el presupuesto</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
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
              <DialogTitle>
                {editandoItem ? 'Editar Item' : 'Agregar Nuevo Item'}
              </DialogTitle>
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
                  <div className={`p-3 rounded-lg ${
                    item.tipo === 'servicio' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {item.tipo === 'servicio' ? <Wrench className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{item.nombre}</h3>
                      <Badge variant={item.tipo === 'servicio' ? 'default' : 'secondary'}>
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

// Gestión de Mecánicos
const MecanicosList = () => {
  const [mecanicos, setMecanicos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoMecanico, setNuevoMecanico] = useState({
    nombre: '', especialidad: '', telefono: '', activo: true
  });

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
      await axios.post(`${API}/mecanicos`, nuevoMecanico);
      setNuevoMecanico({ nombre: '', especialidad: '', telefono: '', activo: true });
      setMostrarFormulario(false);
      cargarMecanicos();
      toast.success('Mecánico agregado correctamente');
    } catch (error) {
      console.error('Error guardando mecánico:', error);
      toast.error('Error guardando el mecánico');
    }
  };

  const especialidades = [
    'motor', 'transmision', 'frenos', 'electricidad', 'suspension', 
    'climatizacion', 'neumaticos', 'carroceria', 'general'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mecánicos Especialistas</h1>
        <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Mecánico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Mecánico</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre *</label>
                <Input
                  value={nuevoMecanico.nombre}
                  onChange={(e) => setNuevoMecanico(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre completo del mecánico"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Especialidad *</label>
                <Select 
                  value={nuevoMecanico.especialidad}
                  onValueChange={(value) => setNuevoMecanico(prev => ({ ...prev, especialidad: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp} value={esp}>
                        {esp.charAt(0).toUpperCase() + esp.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <Input
                  value={nuevoMecanico.telefono}
                  onChange={(e) => setNuevoMecanico(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Número de teléfono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMostrarFormulario(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={guardarMecanico}
                  disabled={!nuevoMecanico.nombre || !nuevoMecanico.especialidad}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mecanicos.map((mecanico) => (
          <Card key={mecanico.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${mecanico.activo ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <h3 className="font-semibold">{mecanico.nombre}</h3>
                </div>
                <Badge variant="outline">
                  {mecanico.especialidad.charAt(0).toUpperCase() + mecanico.especialidad.slice(1)}
                </Badge>
              </div>
              {mecanico.telefono && (
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <PhoneCall className="w-3 h-3" />
                  {mecanico.telefono}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Agregado: {new Date(mecanico.created_at).toLocaleDateString('es-ES')}
              </p>
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
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', empresa: '', email: '' });
  const [vehiculo, setVehiculo] = useState({ matricula: '', marca: '', modelo: '', año: '', color: '', kilometraje: '' });
  const [grabando, setGrabando] = useState(false);
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [fotoMatricula, setFotoMatricula] = useState(null);
  const [modoCreacionDirecta, setModoCreacionDirecta] = useState(false);

  useEffect(() => {
    // Verificar si viene de búsqueda con datos predefinidos
    if (location.state) {
      if (location.state.matricula_predefinida) {
        setVehiculo(prev => ({ ...prev, matricula: location.state.matricula_predefinida }));
      }
      
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
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      setGrabando(true);
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Texto capturado:', transcript);
        procesarConIA(transcript, 'texto');
      };

      recognition.onerror = (event) => {
        console.error('Error de reconocimiento de voz:', event.error);
        toast.error('Error en el reconocimiento de voz');
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

  const handleImageCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setFotoMatricula(base64);
        procesarConIA(base64, 'imagen');
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarRegistro = async () => {
    try {
      // Validar matrícula
      if (vehiculo.matricula.length < 4) {
        toast.error('La matrícula debe tener al menos 4 caracteres');
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
          
          <label className="cursor-pointer">
            <Button as="span" variant="outline" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Capturar Matrícula
            </Button>
            <input
              type="file"
              accept="image/*"
              capture="camera"
              onChange={handleImageCapture}
              className="hidden"
            />
          </label>
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
          <TabsTrigger value="1">Cliente</TabsTrigger>
          <TabsTrigger value="2">Vehículo</TabsTrigger>
          <TabsTrigger value="3">Confirmación</TabsTrigger>
        </TabsList>

        <TabsContent value="1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
              <CardDescription>Datos de la empresa o cliente individual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del Cliente/Empresa *</label>
                  <Input
                    value={cliente.nombre}
                    onChange={(e) => setCliente(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre completo o razón social"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Teléfono</label>
                  <Input
                    value={cliente.telefono}
                    onChange={(e) => setCliente(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="Número de teléfono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Empresa</label>
                  <Input
                    value={cliente.empresa}
                    onChange={(e) => setCliente(prev => ({ ...prev, empresa: e.target.value }))}
                    placeholder="Nombre de la empresa (si es flota)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={cliente.email}
                    onChange={(e) => setCliente(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Correo electrónico"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setPaso(2)} disabled={!cliente.nombre}>
                  Siguiente
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="2" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Vehículo</CardTitle>
              <CardDescription>Datos técnicos del vehículo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Matrícula/Placa *</label>
                  <Input
                    value={vehiculo.matricula}
                    onChange={(e) => validarMatricula(e.target.value)}
                    placeholder="4-7 caracteres alfanuméricos"
                    className="uppercase font-mono tracking-wider text-center"
                    maxLength={7}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Solo letras y números, sin símbolos. Mínimo 4, máximo 7 caracteres.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Marca</label>
                  <Input
                    value={vehiculo.marca}
                    onChange={(e) => setVehiculo(prev => ({ ...prev, marca: e.target.value }))}
                    placeholder="Toyota, Honda, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Modelo</label>
                  <Input
                    value={vehiculo.modelo}
                    onChange={(e) => setVehiculo(prev => ({ ...prev, modelo: e.target.value }))}
                    placeholder="Modelo del vehículo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Año</label>
                  <Input
                    type="number"
                    value={vehiculo.año}
                    onChange={(e) => setVehiculo(prev => ({ ...prev, año: e.target.value }))}
                    placeholder="2020"
                    min="1950"
                    max="2030"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <Input
                    value={vehiculo.color}
                    onChange={(e) => setVehiculo(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="Blanco, Negro, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Kilometraje</label>
                  <Input
                    type="number"
                    value={vehiculo.kilometraje}
                    onChange={(e) => setVehiculo(prev => ({ ...prev, kilometraje: e.target.value }))}
                    placeholder="100000"
                  />
                </div>
              </div>
              
              {fotoMatricula && (
                <div>
                  <label className="block text-sm font-medium mb-2">Foto de la Matrícula</label>
                  <img src={fotoMatricula} alt="Matrícula" className="max-w-xs h-auto border rounded" />
                </div>
              )}
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setPaso(1)}>
                  Anterior
                </Button>
                <Button onClick={() => setPaso(3)} disabled={!vehiculo.matricula}>
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
                    {cliente.telefono && <p><strong>Teléfono:</strong> {cliente.telefono}</p>}
                    {cliente.empresa && <p><strong>Empresa:</strong> {cliente.empresa}</p>}
                    {cliente.email && <p><strong>Email:</strong> {cliente.email}</p>}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Información del Vehículo</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Matrícula:</strong> {vehiculo.matricula}</p>
                    {vehiculo.marca && <p><strong>Marca:</strong> {vehiculo.marca}</p>}
                    {vehiculo.modelo && <p><strong>Modelo:</strong> {vehiculo.modelo}</p>}
                    {vehiculo.año && <p><strong>Año:</strong> {vehiculo.año}</p>}
                    {vehiculo.color && <p><strong>Color:</strong> {vehiculo.color}</p>}
                    {vehiculo.kilometraje && <p><strong>Kilometraje:</strong> {vehiculo.kilometraje.toLocaleString()} km</p>}
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
    </div>
  );
};

// Navegación Principal
const Navigation = () => {
  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="text-xl font-bold flex items-center gap-2">
          <Wrench className="w-6 h-6" />
          Taller Mecánico IA
        </Link>
        <div className="flex gap-4">
          <Link to="/dashboard" className="hover:text-blue-300 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Dashboard
          </Link>
          <Link to="/registro" className="hover:text-blue-300 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Registro
          </Link>
          <Link to="/ordenes" className="hover:text-blue-300 flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Órdenes
          </Link>
          <Link to="/mecanicos" className="hover:text-blue-300 flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Mecánicos
          </Link>
          <Link to="/servicios" className="hover:text-blue-300 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Servicios
          </Link>
          <Link to="/vehiculos" className="hover:text-blue-300 flex items-center gap-2">
            <Car className="w-4 h-4" />
            Vehículos
          </Link>
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
                  <h4 className="font-medium mb-3">Crear Nuevo Cliente</h4>
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
    <div className="App min-h-screen bg-gray-50">
      <BrowserRouter>
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/registro" element={<RegistroVehiculo />} />
            <Route path="/ordenes" element={<OrdenesListado />} />
            <Route path="/orden/:ordenId" element={<OrdenDetalle />} />
            <Route path="/mecanicos" element={<MecanicosList />} />
            <Route path="/servicios" element={<ServiciosRepuestos />} />
            <Route path="/vehiculos" element={<VehiculosList />} />
            <Route path="/vehiculo/:vehiculoId" element={<VehiculoDetalle />} />
            <Route path="/vehiculo/:vehiculoId/historial" element={<VehiculoHistorial />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;