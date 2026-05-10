# Requerimientos Funcionales - Sistema de Gestión de Taller Trieste

## Enfoque del sistema

Este sistema NO es un sistema contable ni un sistema administrativo general. Es un sistema de gestión operativa de taller automotriz.

El objetivo principal es controlar el ciclo completo de atención de un vehículo dentro del taller: ingreso, diagnóstico, presupuesto, aprobación, reparación, nota de entrega e histórico.

## Flujo principal del taller

```text
Vehículo llega al taller
→ Búsqueda por matrícula
→ Registro o recuperación de cliente y vehículo
→ Hoja de ingreso
→ Observaciones iniciales del cliente
→ Revisión por mecánico(s)
→ Levantamiento de daños / diagnóstico
→ Presupuesto
→ Aprobación del cliente
→ Reparación
→ Nota de entrega
→ Histórico del vehículo
```

## Conceptos clave

### Cliente

Puede ser:

- Persona natural
- Persona jurídica / empresa

Una persona jurídica puede tener varios vehículos asociados como flotilla.

Datos requeridos:

- Nombre o razón social
- Tipo de cliente: natural o jurídico
- Cédula o RIF
- Teléfono
- Correo, si aplica
- Dirección, si aplica

### Vehículo

El vehículo debe poder buscarse principalmente por matrícula, ya que la matrícula es el dato operativo más importante en recepción.

Datos fundamentales del vehículo:

- Matrícula / placa
- Color
- Año
- Marca
- Modelo
- Serial de carrocería / serial NIV
- Cliente propietario o empresa asociada

Una matrícula debe ser única dentro del sistema.

### Hoja de ingreso

Debe registrar la entrada del vehículo al taller.

Debe incluir:

- Fecha y hora de ingreso
- Matrícula
- Datos del vehículo
- Datos del cliente
- Kilometraje
- Observaciones indicadas por el cliente
- Motivo de ingreso
- Fotos del vehículo, fase futura
- Estado inicial del vehículo, fase futura

## Proceso de diagnóstico y presupuesto

El cliente puede traer el vehículo por una falla específica, por ejemplo:

- Ruido extraño
- Recalentamiento
- Falla eléctrica
- Mantenimiento
- Revisión general

El mecánico o jefe de mecánicos debe registrar:

- Diagnóstico técnico
- Fallas detectadas
- Recomendaciones
- Servicios sugeridos
- Repuestos requeridos
- Observaciones internas

Todo esto debe quedar asociado al presupuesto.

## Presupuesto

El presupuesto debe ser elegante, ordenado y fácil de entregar al cliente.

Debe contener:

- Datos del cliente
- Datos del vehículo
- Observaciones del cliente
- Diagnóstico del taller
- Servicios
- Repuestos
- Mano de obra
- Totales por moneda
- Condición de aprobación
- Estado del presupuesto: pendiente, aprobado, rechazado, vencido

## Repuestos e inventario

El sistema debe manejar dos escenarios:

### Repuesto existente en inventario

Si el repuesto existe en el taller:

- Se busca en inventario
- Se agrega al presupuesto
- Se descuenta al aprobar o ejecutar el trabajo, según se defina

### Repuesto comprado para una orden específica

Si el repuesto no existe en inventario:

- Compras averigua el repuesto
- Se registra como repuesto solicitado para esa orden
- Se carga su costo
- Se define precio de venta manual o por porcentaje de ganancia
- Queda asociado al vehículo y a la orden de trabajo

Campos sugeridos para repuestos en presupuesto:

- Descripción
- Proveedor, opcional
- Costo
- Porcentaje de utilidad
- Precio de venta calculado
- Precio de venta manual
- Moneda
- Estado: solicitado, cotizado, comprado, recibido, instalado, no aprobado

## Compras

Debe existir un flujo mínimo de compras para repuestos no disponibles en inventario.

Funciones sugeridas:

- Registrar repuesto pendiente por comprar
- Registrar proveedor consultado
- Registrar costo
- Registrar precio de venta
- Asociar compra a una orden específica
- Marcar como comprado / recibido / instalado

## Reparación

Una vez aprobado el presupuesto:

- La orden pasa a reparación
- Se asignan uno o varios mecánicos
- Se registran avances
- Se registran servicios realizados
- Se registran repuestos instalados
- Se registran observaciones finales

## Nota de entrega

El sistema debe generar nota de entrega, no factura fiscal.

La factura formal se genera en un sistema externo cuando el cliente la solicite.

La nota de entrega debe incluir:

- Datos del cliente
- Datos del vehículo
- Número de orden
- Servicios realizados
- Repuestos usados
- Totales
- Moneda
- Fecha de entrega
- Observaciones finales

## Monedas

El sistema debe manejar:

- Dólar estadounidense USD
- Bolívar venezolano VES
- Euro EUR

La moneda principal operativa será USD.

Debe existir control cambiario para definir tasas:

- USD a VES
- EUR a VES
- EUR a USD, si aplica

El sistema debe permitir mostrar totales en varias monedas.

## Histórico del vehículo

El histórico es una función crítica.

Debe permitir buscar por:

- Matrícula
- Cliente
- Empresa
- Fecha

Debe mostrar:

- Cuántas veces entró el vehículo
- Fechas de ingreso
- Motivos de ingreso
- Diagnósticos
- Servicios realizados
- Repuestos utilizados
- Costos
- Mecánicos involucrados
- Notas de entrega emitidas

## Mecánicos y comisiones

Una orden puede tener uno o varios mecánicos.

Debe quedar registrado:

- Mecánico principal
- Mecánicos auxiliares
- Trabajo realizado por cada uno
- Comisión asociada, fase futura o módulo dedicado

Funciones sugeridas:

- Asignar mecánicos a orden
- Definir porcentaje o monto de comisión
- Calcular comisiones por orden
- Reporte de comisiones por fecha / mecánico

## Estados sugeridos de una orden

- Ingresado
- En diagnóstico
- Esperando presupuesto
- Presupuesto emitido
- Esperando aprobación
- Aprobado
- En reparación
- Esperando repuesto
- Listo para entrega
- Entregado
- Cerrado
- Rechazado / no aprobado

## Funciones que NO son prioridad

Este sistema no debe convertirse en un sistema contable completo.

No debe manejar inicialmente:

- Libro contable fiscal
- Declaraciones
- Nómina completa
- Facturación fiscal integrada
- Impuestos complejos

Puede preparar datos para alimentar otro sistema externo, pero su enfoque principal sigue siendo el taller.

## Funciones adicionales recomendadas

- Búsqueda rápida por matrícula desde cualquier pantalla
- Adjuntar fotos al ingreso
- Checklist de ingreso del vehículo
- Control de combustible al ingreso
- Registro de objetos dejados dentro del vehículo
- Firma del cliente en recepción y entrega
- Impresión o PDF de hoja de ingreso
- PDF de presupuesto
- PDF de nota de entrega
- Control de garantía por reparación
- Alertas de órdenes detenidas
- Alertas de repuestos pendientes
- Reporte de vehículos por empresa
- Reporte de trabajos por mecánico
- Reporte de ingresos por período
- Bitácora de cambios por usuario

## Módulos de IA futuros

Las funciones IA se dejarán planificadas pero deshabilitadas inicialmente.

Posibles usos futuros:

- Dictado de observaciones del cliente
- Dictado del diagnóstico del mecánico
- Lectura automática de matrícula por foto
- Resumen automático para presupuesto
- Generación de texto elegante para presupuesto
- Sugerencias basadas en historial del vehículo
