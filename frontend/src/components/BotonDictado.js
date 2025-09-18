import React from 'react';
import { Button } from './ui/button';
import { Mic } from 'lucide-react';

const BotonDictado = ({ 
  onDictado, 
  grabando = false, 
  procesandoIA = false, 
  campoActivo = '', 
  campo = '', 
  size = 'sm', 
  variant = 'ghost',
  className = '',
  texto = 'Dictar'
}) => {
  const estaActivo = grabando && campoActivo === campo;
  
  return (
    <Button
      onClick={onDictado}
      disabled={grabando || procesandoIA}
      variant={estaActivo ? "destructive" : variant}
      size={size}
      className={`flex items-center gap-1 ${className}`}
    >
      <Mic className={`w-3 h-3 ${estaActivo ? 'animate-pulse text-white' : ''}`} />
      {estaActivo ? 'Escuchando...' : texto}
    </Button>
  );
};

export default BotonDictado;