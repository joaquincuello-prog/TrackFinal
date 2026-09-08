-- =============================================================================
-- PROYECTO: TrackFinal — KIT AVZ-03 (Trazabilidad de Lote / Unidad)
-- CASO PILOTO: Lácteos San Antonio S.A.
-- MOTOR DE BASE DE DATOS: PostgreSQL 15+
-- AUTOR: Joaquín Nicolás Cuello (PP2 - 3.º Año Desarrollo de Software)
-- ASESOR: Tutor Académico PP2 / Arquitecto de Software y DBA
-- SEMANA: 03 — Diseño de Arquitectura y Base de Datos
-- FECHA: Septiembre 2026
-- ARCHIVO: database/schema.sql
-- =============================================================================

-- Habilitar extensiones necesarias (UUID / JSONB / Criptografía)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpieza ordenada en sentido inverso a las dependencias de claves foráneas
DROP TABLE IF EXISTS despachos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS controles_calidad CASCADE;
DROP TABLE IF EXISTS eventos_trazabilidad CASCADE;
DROP TABLE IF EXISTS puntos_captura CASCADE;
DROP TABLE IF EXISTS lotes_producto_terminado CASCADE;
DROP TABLE IF EXISTS consumos_materia_prima CASCADE;
DROP TABLE IF EXISTS ordenes_produccion CASCADE;
DROP TABLE IF EXISTS productos_terminados CASCADE;
DROP TABLE IF EXISTS lotes_materia_prima CASCADE;
DROP TABLE IF EXISTS materias_primas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- =============================================================================
-- 1. SEGURIDAD Y GESTIÓN DE USUARIOS (RBAC)
-- =============================================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'Roles del sistema para control de acceso basado en roles (RBAC)';

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    legajo VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_email_formato CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

COMMENT ON TABLE usuarios IS 'Usuarios del sistema: operarios de planta, logística, auditores y administradores';

-- =============================================================================
-- 2. CATÁLOGO DE MATERIAS PRIMAS Y LOTES DE INGRESO (TAMBOS Y PROVEEDORES)
-- =============================================================================

CREATE TABLE materias_primas (
    id SERIAL PRIMARY KEY,
    codigo_sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    unidad_medida VARCHAR(20) NOT NULL, -- 'Litros', 'Kg', 'Gramos', 'Mililitros'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE materias_primas IS 'Catálogo maestro de insumos y materias primas (leche, fermentos, cuajos, etc.)';

CREATE TABLE lotes_materia_prima (
    id SERIAL PRIMARY KEY,
    materia_prima_id INT NOT NULL REFERENCES materias_primas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    codigo_lote_mp VARCHAR(100) UNIQUE NOT NULL,
    proveedor VARCHAR(150) NOT NULL, -- Tambos o industrias proveedoras
    fecha_recepcion DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    cantidad_inicial NUMERIC(10,2) NOT NULL,
    cantidad_actual NUMERIC(10,2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'DISPONIBLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_cant_inicial_positiva CHECK (cantidad_inicial > 0),
    CONSTRAINT chk_cant_actual_valida CHECK (cantidad_actual >= 0 AND cantidad_actual <= cantidad_inicial),
    CONSTRAINT chk_fechas_mp CHECK (fecha_vencimiento >= fecha_recepcion),
    CONSTRAINT chk_estado_mp CHECK (estado IN ('DISPONIBLE', 'AGOTADO', 'RECHAZADO', 'CUARENTENA'))
);

COMMENT ON TABLE lotes_materia_prima IS 'Lotes recibidos de insumos con control de saldo, vencimiento y procedencia';

-- =============================================================================
-- 3. CATÁLOGO DE PRODUCTOS TERMINADOS Y ÓRDENES DE PRODUCCIÓN
-- =============================================================================

CREATE TABLE productos_terminados (
    id SERIAL PRIMARY KEY,
    codigo_sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    unidad_medida VARCHAR(20) NOT NULL, -- 'Unidad', 'Horma', 'Pack', 'Botella 1L'
    dias_vida_util INT NOT NULL,
    temperatura_conservacion VARCHAR(50) NOT NULL, -- '2°C a 6°C', '4°C a 8°C'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_vida_util CHECK (dias_vida_util > 0)
);

COMMENT ON TABLE productos_terminados IS 'Catálogo de quesos, yogures y derivados elaborados en planta';

CREATE TABLE ordenes_produccion (
    id SERIAL PRIMARY KEY,
    numero_op VARCHAR(50) UNIQUE NOT NULL,
    producto_terminado_id INT NOT NULL REFERENCES productos_terminados(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    cantidad_planificada NUMERIC(10,2) NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin TIMESTAMPTZ,
    linea_produccion VARCHAR(100) NOT NULL, -- 'Línea Quesería 1', 'Línea Envasado Yogur 2'
    estado VARCHAR(30) NOT NULL DEFAULT 'CREADA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_cant_planificada CHECK (cantidad_planificada > 0),
    CONSTRAINT chk_estado_op CHECK (estado IN ('CREADA', 'EN_PROCESO', 'FINALIZADA', 'CANCELADA'))
);

COMMENT ON TABLE ordenes_produccion IS 'Órdenes de fabricación que agrupan consumos de MP y producción de lotes PT';

-- =============================================================================
-- 4. CONSUMOS DE MATERIA PRIMA (NEXO GENEALÓGICO HACIA ATRÁS)
-- =============================================================================

CREATE TABLE consumos_materia_prima (
    id SERIAL PRIMARY KEY,
    orden_produccion_id INT NOT NULL REFERENCES ordenes_produccion(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    lote_mp_id INT NOT NULL REFERENCES lotes_materia_prima(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    cantidad_consumida NUMERIC(10,2) NOT NULL,
    timestamp_consumo TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    operario_id INT NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_cant_consumida CHECK (cantidad_consumida > 0)
);

COMMENT ON TABLE consumos_materia_prima IS 'Registro de genealogía: materias primas específicas utilizadas en cada orden';

-- =============================================================================
-- 5. LOTES DE PRODUCTO TERMINADO (IDENTIFICACIÓN DIGITAL Y QR)
-- =============================================================================

CREATE TABLE lotes_producto_terminado (
    id SERIAL PRIMARY KEY,
    orden_produccion_id INT NOT NULL REFERENCES ordenes_produccion(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    codigo_lote_pt VARCHAR(100) UNIQUE NOT NULL, -- Formato: 'LPT-YYYYMMDD-XXX'
    cantidad_elaborada NUMERIC(10,2) NOT NULL,
    fecha_elaboracion DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'EN_PROCESO',
    codigo_qr_payload JSONB NOT NULL, -- Payload estructurado serializado en el QR
    ubicacion_deposito VARCHAR(100), -- 'Cámara 1 - Rack B3'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_cant_elaborada CHECK (cantidad_elaborada > 0),
    CONSTRAINT chk_fechas_pt CHECK (fecha_vencimiento >= fecha_elaboracion),
    CONSTRAINT chk_estado_pt CHECK (estado IN ('EN_PROCESO', 'CUARENTENA', 'APROBADO', 'RECHAZADO', 'DESPACHADO', 'BLOQUEADO'))
);

COMMENT ON TABLE lotes_producto_terminado IS 'Lotes físicos de producto terminado con código QR y estado operativo';

-- =============================================================================
-- 6. PUNTOS DE CAPTURA Y AUDITORÍA INMUTABLE DE TRAZABILIDAD
-- =============================================================================

CREATE TABLE puntos_captura (
    id SERIAL PRIMARY KEY,
    codigo_punto VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

COMMENT ON TABLE puntos_captura IS 'Ubicaciones y puestos de trabajo físicos donde se registran eventos';

CREATE TABLE eventos_trazabilidad (
    id BIGSERIAL PRIMARY KEY,
    lote_pt_id INT NOT NULL REFERENCES lotes_producto_terminado(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    punto_captura_id INT NOT NULL REFERENCES puntos_captura(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    etapa_nombre VARCHAR(100) NOT NULL, -- 'Envasado', 'Entrada Cámara', 'Salida Despacho'
    linea_equipo VARCHAR(100),
    timestamp_evento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    observaciones TEXT
);

COMMENT ON TABLE eventos_trazabilidad IS 'Bitácora inmutable de eventos de trazabilidad temporal de cada lote';

-- =============================================================================
-- 7. CONTROLES DE CALIDAD BROMATOLÓGICA
-- =============================================================================

CREATE TABLE controles_calidad (
    id SERIAL PRIMARY KEY,
    lote_pt_id INT NOT NULL REFERENCES lotes_producto_terminado(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    fecha_control TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parametro_1_nombre VARCHAR(100) NOT NULL, -- ej: 'pH'
    parametro_1_valor VARCHAR(50) NOT NULL,  -- ej: '4.35'
    parametro_2_nombre VARCHAR(100) NOT NULL, -- ej: 'Acidez Dornic'
    parametro_2_valor VARCHAR(50) NOT NULL,  -- ej: '72°D'
    resultado VARCHAR(30) NOT NULL, -- 'CONFORME', 'NO_CONFORME'
    observaciones TEXT,
    CONSTRAINT chk_resultado_calidad CHECK (resultado IN ('CONFORME', 'NO_CONFORME'))
);

COMMENT ON TABLE controles_calidad IS 'Parámetros de laboratorio físico-químico y microbiológico por lote';

-- =============================================================================
-- 8. EXPEDICIÓN, CLIENTES Y DESPACHOS (NEXO HACIA ADELANTE / RECALL)
-- =============================================================================

CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    cuit VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(150) NOT NULL,
    direccion TEXT NOT NULL,
    telefono VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE clientes IS 'Cartera de distribuidores, mayoristas y cadenas de supermercados';

CREATE TABLE despachos (
    id SERIAL PRIMARY KEY,
    lote_pt_id INT NOT NULL REFERENCES lotes_producto_terminado(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    cliente_id INT NOT NULL REFERENCES clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    numero_remito VARCHAR(50) NOT NULL, -- Formato: 'R-0001-XXXXXX'
    fecha_despacho TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cantidad_despachada NUMERIC(10,2) NOT NULL,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_cant_despachada CHECK (cantidad_despachada > 0)
);

COMMENT ON TABLE despachos IS 'Registro legal de expedición vinculando lote terminado, remito y cliente destinatario';

-- =============================================================================
-- 9. ÍNDICES DE ALTO RENDIMIENTO (GENEALOGÍA Y TRAZABILIDAD < 2 SEGUNDOS)
-- =============================================================================

-- Búsqueda instantánea por código de lote PT (Reclamos / Scanner QR)
CREATE INDEX idx_lote_pt_codigo ON lotes_producto_terminado(codigo_lote_pt);

-- Filtrado por estado operativo en planta (stock en cámara vs en proceso)
CREATE INDEX idx_lotes_pt_estado ON lotes_producto_terminado(estado);

-- Búsqueda rápida por fecha de vencimiento y elaboración
CREATE INDEX idx_lotes_pt_vencimiento ON lotes_producto_terminado(fecha_vencimiento);

-- Índice GIN para consultas directas sobre atributos JSONB del código QR
CREATE INDEX idx_lotes_pt_qr_gin ON lotes_producto_terminado USING gin (codigo_qr_payload);

-- Búsqueda por código de materia prima (Recall desde insumo hacia adelante)
CREATE INDEX idx_lote_mp_codigo ON lotes_materia_prima(codigo_lote_mp);
CREATE INDEX idx_lotes_mp_estado ON lotes_materia_prima(estado);

-- Genealogía de eventos de trazabilidad ordenados cronológicamente
CREATE INDEX idx_eventos_lote ON eventos_trazabilidad(lote_pt_id, timestamp_evento);

-- Vínculo de consumos por orden de producción
CREATE INDEX idx_consumos_op ON consumos_materia_prima(orden_produccion_id, lote_mp_id);

-- Consultas de expedición por lote (Recall hacia clientes)
CREATE INDEX idx_despachos_lote ON despachos(lote_pt_id);

-- Consultas de despachos por cliente destinatario
CREATE INDEX idx_despachos_cliente ON despachos(cliente_id);

-- Consulta de remitos
CREATE INDEX idx_despachos_remito ON despachos(numero_remito);
