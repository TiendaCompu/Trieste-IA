# Modelo de Datos SQL Inicial - Trieste Gestión de Taller

## Enfoque

Este modelo está pensado para un sistema de gestión operativa de taller automotriz. No es un sistema contable ni fiscal.

La matrícula del vehículo será uno de los datos principales de búsqueda y debe ser única.

## Entidades principales

### clientes

Representa personas naturales o jurídicas.

Campos sugeridos:

- id
- tipo_cliente: natural | juridico
- nombre_razon_social
- tipo_documento: CI | RIF | PASAPORTE | OTRO
- numero_documento
- telefono_principal
- telefono_secundario
- email
- direccion
- activo
- fecha_creacion
- fecha_actualizacion

Reglas:

- Un cliente puede tener varios vehículos.
- Una empresa puede funcionar como flotilla.

### vehiculos

Representa cada vehículo registrado.

Campos sugeridos:

- id
- cliente_id
- matricula
- marca
- modelo
- anio
- color
- serial_carroceria
- serial_motor
- kilometraje_actual
- combustible
- activo
- fecha_creacion
- fecha_actualizacion

Reglas:

- La matrícula debe ser única.
- Un vehículo pertenece a un cliente.
- Un vehículo puede tener muchas órdenes de trabajo.

### hojas_ingreso

Registro formal de entrada del vehículo al taller.

Campos sugeridos:

- id
- vehiculo_id
- cliente_id
- numero_ingreso
- fecha_ingreso
- kilometraje_ingreso
- motivo_ingreso
- observaciones_cliente
- nivel_combustible
- objetos_reportados
- estado_visual
- recibido_por_usuario_id
- estado: abierto | convertido_orden | cancelado

### ordenes_trabajo

Controla el ciclo operativo de reparación.

Campos sugeridos:

- id
- hoja_ingreso_id
- vehiculo_id
- cliente_id
- numero_orden
- estado
- diagnostico_general
- observaciones_internas
- fecha_creacion
- fecha_aprobacion
- fecha_inicio_reparacion
- fecha_finalizacion
- fecha_entrega
- creado_por_usuario_id

Estados sugeridos:

- ingresado
- en_diagnostico
- presupuesto_emitido
- esperando_aprobacion
- aprobado
- esperando_repuesto
- en_reparacion
- listo_para_entrega
- entregado
- cerrado
- rechazado

### orden_mecanicos

Permite asignar uno o varios mecánicos a una orden.

Campos sugeridos:

- id
- orden_id
- mecanico_id
- rol: principal | auxiliar | especialista
- descripcion_trabajo
- porcentaje_comision
- monto_comision
- fecha_asignacion

### mecanicos

Personal técnico del taller.

Campos sugeridos:

- id
- nombre
- telefono
- especialidad
- activo
- porcentaje_comision_default
- fecha_creacion

### diagnosticos

Detalle técnico del levantamiento de fallas.

Campos sugeridos:

- id
- orden_id
- mecanico_id
- descripcion_falla
- diagnostico_tecnico
- recomendacion
- prioridad: baja | media | alta | critica
- aprobado_para_presupuesto
- fecha_creacion

### servicios

Catálogo de servicios del taller.

Campos sugeridos:

- id
- nombre
- descripcion
- precio_base_usd
- activo

### inventario_items

Catálogo de repuestos, consumibles y materiales disponibles o controlados por el taller.

Campos sugeridos:

- id
- codigo
- nombre
- descripcion
- categoria
- unidad_medida
- costo_promedio_usd
- precio_venta_usd
- stock_actual
- stock_minimo
- activo

### presupuesto

Documento enviado al cliente para aprobación.

Campos sugeridos:

- id
- orden_id
- cliente_id
- vehiculo_id
- numero_presupuesto
- estado: pendiente | aprobado | rechazado | vencido
- moneda_principal: USD | VES | EUR
- subtotal_usd
- descuento_usd
- total_usd
- total_ves
- total_eur
- tasa_usd_ves
- tasa_eur_ves
- observaciones
- fecha_emision
- fecha_aprobacion

### presupuesto_items

Servicios, repuestos o materiales incluidos en el presupuesto.

Campos sugeridos:

- id
- presupuesto_id
- tipo: servicio | repuesto_inventario | repuesto_externo | mano_obra | otro
- referencia_id
- descripcion
- cantidad
- costo_unitario_usd
- porcentaje_utilidad
- precio_unitario_usd
- total_usd
- moneda_origen
- aprobado

Reglas:

- Si el repuesto viene de inventario, referencia_id apunta a inventario_items.
- Si el repuesto es externo, referencia_id puede apuntar a compras_solicitudes o quedar nulo en fase inicial.

### compras_solicitudes

Control de repuestos que deben buscarse o comprarse para una orden específica.

Campos sugeridos:

- id
- orden_id
- vehiculo_id
- descripcion_repuesto
- proveedor
- costo_usd
- moneda_costo
- porcentaje_utilidad
- precio_venta_usd
- estado: solicitado | cotizado | aprobado | comprado | recibido | instalado | cancelado
- fecha_solicitud
- fecha_compra
- fecha_recepcion

### movimientos_inventario

Historial de entradas y salidas de inventario.

Campos sugeridos:

- id
- inventario_item_id
- tipo_movimiento: entrada | salida | ajuste
- cantidad
- costo_unitario_usd
- orden_id
- observacion
- fecha_movimiento
- usuario_id

### notas_entrega

Documento final emitido al cliente al entregar el vehículo.

Campos sugeridos:

- id
- orden_id
- presupuesto_id
- cliente_id
- vehiculo_id
- numero_nota
- subtotal_usd
- total_usd
- total_ves
- total_eur
- tasa_usd_ves
- tasa_eur_ves
- observaciones_finales
- fecha_emision
- emitido_por_usuario_id

### monedas

Catálogo de monedas.

Campos sugeridos:

- id
- codigo: USD | VES | EUR
- nombre
- simbolo
- activa

### tasas_cambio

Control cambiario manual.

Campos sugeridos:

- id
- moneda_base
- moneda_destino
- tasa
- fecha_vigencia
- activa
- usuario_id
- observacion

### usuarios

Usuarios internos del sistema.

Campos sugeridos:

- id
- nombre
- usuario
- password_hash
- rol
- activo
- fecha_creacion

Roles sugeridos:

- administrador
- recepcion
- jefe_taller
- mecanico
- compras
- caja
- consulta

### historial_eventos

Bitácora general del sistema.

Campos sugeridos:

- id
- entidad_tipo
- entidad_id
- usuario_id
- accion
- descripcion
- fecha_evento

## Relaciones principales

```text
cliente 1 ── N vehiculos
vehiculo 1 ── N hojas_ingreso
hoja_ingreso 1 ── 1 orden_trabajo
orden_trabajo 1 ── N diagnosticos
orden_trabajo 1 ── N orden_mecanicos
orden_trabajo 1 ── N compras_solicitudes
orden_trabajo 1 ── N presupuestos
presupuesto 1 ── N presupuesto_items
orden_trabajo 1 ── 0/1 nota_entrega
inventario_item 1 ── N movimientos_inventario
```

## Búsquedas críticas

El sistema debe permitir búsquedas rápidas por:

- Matrícula
- Cliente
- RIF / cédula
- Número de orden
- Número de presupuesto
- Número de nota de entrega
- Estado de orden
- Fecha de ingreso

## Decisiones pendientes

1. Definir si se usará PostgreSQL o SQL Server Express.
2. Definir si la nota de entrega tendrá formato PDF desde la primera versión.
3. Definir en qué momento se descuenta inventario: al aprobar presupuesto o al cerrar reparación.
4. Definir si las comisiones se calculan sobre mano de obra, total de orden o servicios específicos.
5. Definir si las fotos se guardarán en base de datos, carpeta local o almacenamiento mixto.
