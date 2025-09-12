import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
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
  Truck
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
          Nuevo Vehículo
        </Button>
      </div>

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
          <CardTitle>Órdenes de Trabajo Recientes</CardTitle>
          <CardDescription>Últimas órdenes ingresadas al sistema</CardDescription>
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

// Registro de Vehículo con IA
const RegistroVehiculo = () => {
  const [paso, setPaso] = useState(1);
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', empresa: '', email: '' });
  const [vehiculo, setVehiculo] = useState({ matricula: '', marca: '', modelo: '', año: '', color: '', kilometraje: '' });
  const [grabando, setGrabando] = useState(false);
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [fotoMatricula, setFotoMatricula] = useState(null);
  const navigate = useNavigate();

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
      await axios.post(`${API}/ordenes`, {
        vehiculo_id: vehiculoResponse.data.id,
        cliente_id: clienteId,
        diagnostico: 'Vehículo recibido - Pendiente diagnóstico inicial'
      });
      
      toast.success('Vehículo registrado exitosamente');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error guardando registro:', error);
      toast.error('Error al guardar el registro');
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
                    onChange={(e) => setVehiculo(prev => ({ ...prev, matricula: e.target.value }))}
                    placeholder="Número de matrícula"
                    className="uppercase"
                  />
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
          <Link to="/vehiculos" className="hover:text-blue-300 flex items-center gap-2">
            <Car className="w-4 h-4" />
            Vehículos
          </Link>
        </div>
      </div>
    </nav>
  );
};

// Página de Prueba IA
const PruebaIA = () => {
  const [textoTest, setTextoTest] = useState('');
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);

  const probarIA = async () => {
    setCargando(true);
    try {
      const response = await axios.post(`${API}/ai/extraer-datos`, {
        texto_dictado: textoTest
      });
      setResultado(response.data);
    } catch (error) {
      console.error('Error:', error);
      setResultado({ error: error.message });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Prueba de IA</h1>
      <Card>
        <CardHeader>
          <CardTitle>Probar Extracción de Datos con IA</CardTitle>
          <CardDescription>
            Escribe información de un vehículo para probar la IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={textoTest}
            onChange={(e) => setTextoTest(e.target.value)}
            placeholder="Ejemplo: El vehículo Toyota Corolla 2020 color blanco con matrícula ABC123 tiene 50000 kilómetros, el cliente es Juan Pérez de la empresa Transportes Unidos, teléfono 123456789"
            rows={4}
          />
          <Button onClick={probarIA} disabled={cargando || !textoTest}>
            {cargando ? 'Procesando...' : 'Probar IA'}
          </Button>
          
          {resultado && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Resultado:</h3>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(resultado, null, 2)}
              </pre>
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
            <Route path="/prueba-ia" element={<PruebaIA />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;