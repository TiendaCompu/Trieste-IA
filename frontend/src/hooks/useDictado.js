import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const useDictado = () => {
  const [grabando, setGrabando] = useState(false);
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [campoActivo, setCampoActivo] = useState('');

  // Función genérica para procesar dictado
  const procesarDictadoGenerico = async (textoDictado, tipoFormulario = 'general') => {
    setProcesandoIA(true);
    toast.info('🤖 Procesando dictado con IA...');
    
    console.log('Texto a procesar:', textoDictado, 'Tipo:', tipoFormulario);
    
    try {
      let endpoint = 'ai/procesar-dictado';
      let systemMessage = '';
      let formatoRespuesta = {};

      // Seleccionar endpoint y formato según el tipo de formulario
      switch (tipoFormulario) {
        case 'orden':
          endpoint = 'ai/procesar-dictado-orden';
          break;
        case 'vehiculo':
          endpoint = 'ai/procesar-dictado';
          break;
        case 'mecanico':
          systemMessage = 'Extrae información de mecánicos: nombre, especialidad, teléfono, WhatsApp, estado';
          formatoRespuesta = {
            nombre: '',
            especialidad: '',
            telefono: '',
            whatsapp: '',
            estado: 'disponible'
          };
          break;
        case 'servicio':
          systemMessage = 'Extrae información de servicios/repuestos: tipo, nombre, descripción, precio';
          formatoRespuesta = {
            tipo: 'servicio',
            nombre: '',
            descripcion: '',
            precio: 0
          };
          break;
        default:
          endpoint = 'ai/procesar-dictado';
      }

      const response = await axios.post(`${API}/${endpoint}`, {
        texto: textoDictado,
        tipo_formulario: tipoFormulario,
        system_message: systemMessage,
        formato_respuesta: formatoRespuesta
      });

      console.log('Respuesta IA:', response.data);

      if (response.data.success && response.data.datos) {
        toast.success('✅ Información extraída correctamente');
        return {
          success: true,
          datos: response.data.datos,
          textoOriginal: textoDictado
        };
      } else {
        toast.error('❌ La IA no pudo procesar la información: ' + (response.data.error || 'Error desconocido'));
        return {
          success: false,
          error: response.data.error
        };
      }
    } catch (error) {
      console.error('Error procesando dictado:', error);
      toast.error('❌ Error procesando el dictado: ' + (error.response?.data?.detail || error.message));
      return {
        success: false,
        error: error.message
      };
    } finally {
      setProcesandoIA(false);
    }
  };

  // Función principal de dictado
  const iniciarDictado = async (tipoFormulario = 'general', campo = '') => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('❌ Reconocimiento de voz no soportado en este navegador');
      return { success: false, error: 'Navegador no soportado' };
    }

    return new Promise((resolve) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configuración optimizada
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';
      recognition.maxAlternatives = 1;

      let textoFinal = '';
      let textoTemporal = '';
      
      setCampoActivo(campo);
      setGrabando(true);
      
      const tipoTexto = tipoFormulario === 'orden' ? 'orden de trabajo' : 
                        tipoFormulario === 'vehiculo' ? 'vehículo' :
                        tipoFormulario === 'mecanico' ? 'mecánico' :
                        tipoFormulario === 'servicio' ? 'servicio/repuesto' : 'información';
      
      toast.info(`🎤 Grabando ${tipoTexto}... Di "finalizar" para procesar`);

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

      recognition.onend = async () => {
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
            const resultado = await procesarDictadoGenerico(textoLimpio, tipoFormulario);
            resolve(resultado);
          } else {
            toast.warning('No se detectó información para procesar');
            resolve({ success: false, error: 'Texto vacío' });
          }
        } else {
          toast.warning('No se capturó audio válido');
          resolve({ success: false, error: 'Sin audio' });
        }
      };

      recognition.onerror = (event) => {
        console.error('Error de reconocimiento:', event.error);
        setGrabando(false);
        setCampoActivo('');
        toast.error('Error en el reconocimiento de voz: ' + event.error);
        resolve({ success: false, error: event.error });
      };

      recognition.start();
    });
  };

  return {
    grabando,
    procesandoIA,
    campoActivo,
    iniciarDictado
  };
};