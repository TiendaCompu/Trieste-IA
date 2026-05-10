# Plan de Reconstrucción Local SQL - Trieste IA

## Objetivo

Reconstruir el sistema Trieste IA como una aplicación de gestión de taller automotriz para uso local en red LAN, eliminando la dependencia de Emergent Lab y migrando la base de datos desde MongoDB hacia una base de datos SQL.

## Identidad visual

### Colores oficiales

- Blanco Trieste: `#FFFFFE`
- Amarillo Trieste: `#FCDF0D`
- Azul Trieste: `#000064`

### Modos visuales

#### Modo claro

Uso principal de fondo blanco, navegación azul y acentos amarillos.

#### Modo oscuro

Interfaz oscura tipo dashboard premium, manteniendo acentos amarillos y azules para respetar la marca Trieste.

## Arquitectura propuesta

```text
PC servidor del taller
├── Base de datos SQL local
├── Backend API
├── Frontend web
└── Acceso desde otros equipos por navegador dentro de la red local
```

## Stack recomendado

### Frontend

- React
- Vite o Next.js en una fase posterior
- Tailwind CSS
- Componentes modernos estilo dashboard
- Soporte modo claro / oscuro

### Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic para migraciones

### Base de datos

Opción recomendada inicial:

- PostgreSQL local

Alternativa válida:

- SQL Server Express, especialmente si se desea mantener todo dentro de ambiente Windows/Microsoft.

## Módulos principales

1. Dashboard
2. Búsqueda por matrícula
3. Ingreso al taller
4. Clientes
5. Vehículos
6. Mecánicos
7. Órdenes de trabajo
8. Servicios y repuestos
9. Presupuestos
10. Facturación
11. Tasa de cambio
12. Reportes
13. Configuración
14. Usuarios y roles
15. Módulos de IA deshabilitados para fase futura

## Decisión sobre IA

Las funciones de IA no se eliminarán conceptualmente, pero quedarán deshabilitadas o marcadas como `Próximamente`.

Funciones futuras posibles:

- Dictado inteligente para diagnóstico.
- Lectura de placas desde imagen.
- Resumen automático de orden de trabajo.
- Sugerencias de servicios según historial.
- Generación automática de presupuesto preliminar.

## Primera fase de trabajo

1. Crear rama segura de reconstrucción.
2. Documentar el proyecto.
3. Definir paleta visual y tema.
4. Revisar pantallas existentes.
5. Separar dependencias de Emergent.
6. Diseñar modelo SQL inicial.
7. Preparar backend nuevo sin MongoDB.
8. Preparar frontend conectado al nuevo backend.

## Criterios importantes

- No romper la rama `main`.
- No depender de servicios de Emergent.
- Mantener la estética y flujo operativo del sistema original.
- Priorizar facilidad de uso para recepción y administración del taller.
- Pensar el sistema para personas que no son programadoras.

## Estado inicial

El repositorio original contiene una aplicación generada desde Emergent con frontend React, backend FastAPI y MongoDB. La reconstrucción se hará progresivamente desde una rama nueva para conservar el historial original.
