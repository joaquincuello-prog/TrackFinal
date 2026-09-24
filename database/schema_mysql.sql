-- =============================================================================
-- PROYECTO: TrackFinal — KIT AVZ-03 (Trazabilidad de Lote / Unidad)
-- CASO PILOTO: Lácteos San Antonio S.A.
-- MOTOR DE BASE DE DATOS: MySQL 8.0+ / MariaDB 10.5+
-- AUTOR: Joaquín Nicolás Cuello (PP2 - 3.º Año Desarrollo de Software)
-- ASESOR: Tutor Académico PP2 / Arquitecto de Software y DBA
-- ARCHIVO: database/schema_mysql.sql
-- =============================================================================

-- 1. Creación de la base de datos si no existe
CREATE DATABASE IF NOT EXISTS trackfinal_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE trackfinal_db;

-- 2. Desactivar temporalmente revisión de claves foráneas para limpieza limpia
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS despachos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS controles_calidad;
DROP TABLE IF EXISTS eventos_trazabilidad;
DROP TABLE IF EXISTS puntos_captura;
DROP TABLE IF EXISTS lotes_producto_terminado;
DROP TABLE IF EXISTS consumos_materia_prima;
DROP TABLE IF EXISTS ordenes_produccion;
DROP TABLE IF EXISTS productos_terminados;
DROP TABLE IF EXISTS lotes_materia_prima;
DROP TABLE IF EXISTS materias_primas;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. SEGURIDAD Y GESTIÓN DE USUARIOS (RBAC)
-- =============================================================================

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    legajo VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_roles FOREIGN KEY (rol_id) 
        REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. CATÁLOGO DE MATERIAS PRIMAS Y LOTES DE INSUMO (TAMBOS Y PROVEEDORES)
-- =============================================================================

CREATE TABLE materias_primas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    unidad_medida VARCHAR(20) NOT NULL, -- 'Litros', 'Kg', 'Gramos', 'Mililitros'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lotes_materia_prima (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_prima_id INT NOT NULL,
    codigo_lote_mp VARCHAR(100) NOT NULL UNIQUE,
    proveedor VARCHAR(150) NOT NULL,
    fecha_recepcion DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    cantidad_inicial DECIMAL(10,2) NOT NULL,
    cantidad_actual DECIMAL(10,2) NOT NULL,
    estado ENUM('DISPONIBLE', 'AGOTADO', 'RECHAZADO', 'CUARENTENA') NOT NULL DEFAULT 'DISPONIBLE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lotes_mp_materias FOREIGN KEY (materia_prima_id) 
        REFERENCES materias_primas(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. CATÁLOGO DE PRODUCTOS TERMINADOS Y ÓRDENES DE PRODUCCIÓN
-- =============================================================================

CREATE TABLE productos_terminados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    unidad_medida VARCHAR(20) NOT NULL, -- 'Unidad', 'Horma', 'Pack', 'Botella 1L'
    dias_vida_util INT NOT NULL,
    temperatura_conservacion VARCHAR(50) NOT NULL, -- '2°C a 6°C', '4°C a 8°C'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ordenes_produccion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_op VARCHAR(50) NOT NULL UNIQUE,
    producto_terminado_id INT NOT NULL,
    cantidad_planificada DECIMAL(10,2) NOT NULL,
    fecha_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin DATETIME NULL,
    linea_produccion VARCHAR(100) NOT NULL,
    estado ENUM('CREADA', 'EN_PROCESO', 'FINALIZADA', 'CANCELADA') NOT NULL DEFAULT 'CREADA',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_op_productos FOREIGN KEY (producto_terminado_id) 
        REFERENCES productos_terminados(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. CONSUMOS DE MATERIA PRIMA (NEXO GENEALÓGICO HACIA ATRÁS)
-- =============================================================================

CREATE TABLE consumos_materia_prima (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_produccion_id INT NOT NULL,
    lote_mp_id INT NOT NULL,
    cantidad_consumida DECIMAL(10,2) NOT NULL,
    timestamp_consumo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    operario_id INT NOT NULL,
    CONSTRAINT fk_consumo_op FOREIGN KEY (orden_produccion_id) 
        REFERENCES ordenes_produccion(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_consumo_lote_mp FOREIGN KEY (lote_mp_id) 
        REFERENCES lotes_materia_prima(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_consumo_usuario FOREIGN KEY (operario_id) 
        REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. LOTES DE PRODUCTO TERMINADO (IDENTIFICACIÓN DIGITAL Y QR - KIT AVZ-03)
-- =============================================================================

CREATE TABLE lotes_producto_terminado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_produccion_id INT NOT NULL,
    codigo_lote_pt VARCHAR(100) NOT NULL UNIQUE,
    cantidad_elaborada DECIMAL(10,2) NOT NULL,
    fecha_elaboracion DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado ENUM('EN_PROCESO', 'CUARENTENA', 'APROBADO', 'RECHAZADO', 'DESPACHADO', 'BLOQUEADO') NOT NULL DEFAULT 'EN_PROCESO',
    codigo_qr_payload JSON NOT NULL, -- Estructura JSON serializada en QR
    ubicacion_deposito VARCHAR(100) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lotes_pt_op FOREIGN KEY (orden_produccion_id) 
        REFERENCES ordenes_produccion(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. PUNTOS DE CAPTURA Y EVENTOS DE TRAZABILIDAD
-- =============================================================================

CREATE TABLE puntos_captura (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_punto VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE eventos_trazabilidad (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lote_pt_id INT NOT NULL,
    punto_captura_id INT NOT NULL,
    usuario_id INT NOT NULL,
    etapa_nombre VARCHAR(100) NOT NULL,
    linea_equipo VARCHAR(100) NULL,
    timestamp_evento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT NULL,
    CONSTRAINT fk_eventos_lote_pt FOREIGN KEY (lote_pt_id) 
        REFERENCES lotes_producto_terminado(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_eventos_punto FOREIGN KEY (punto_captura_id) 
        REFERENCES puntos_captura(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_eventos_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. CONTROLES DE CALIDAD BROMATOLÓGICA
-- =============================================================================

CREATE TABLE controles_calidad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lote_pt_id INT NOT NULL,
    usuario_id INT NOT NULL,
    fecha_control DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    parametro_1_nombre VARCHAR(100) NOT NULL,
    parametro_1_valor VARCHAR(50) NOT NULL,
    parametro_2_nombre VARCHAR(100) NOT NULL,
    parametro_2_valor VARCHAR(50) NOT NULL,
    resultado ENUM('CONFORME', 'NO_CONFORME') NOT NULL,
    observaciones TEXT NULL,
    CONSTRAINT fk_calidad_lote_pt FOREIGN KEY (lote_pt_id) 
        REFERENCES lotes_producto_terminado(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_calidad_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. EXPEDICIÓN, CLIENTES Y DESPACHOS
-- =============================================================================

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cuit VARCHAR(20) NOT NULL UNIQUE,
    razon_social VARCHAR(150) NOT NULL,
    direccion TEXT NOT NULL,
    telefono VARCHAR(50) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE despachos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lote_pt_id INT NOT NULL,
    cliente_id INT NOT NULL,
    numero_remito VARCHAR(50) NOT NULL,
    fecha_despacho DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cantidad_despachada DECIMAL(10,2) NOT NULL,
    usuario_id INT NOT NULL,
    CONSTRAINT fk_despachos_lote_pt FOREIGN KEY (lote_pt_id) 
        REFERENCES lotes_producto_terminado(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_despachos_cliente FOREIGN KEY (cliente_id) 
        REFERENCES clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_despachos_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. ÍNDICES DE ALTO RENDIMIENTO
-- =============================================================================

CREATE INDEX idx_lote_pt_codigo ON lotes_producto_terminado(codigo_lote_pt);
CREATE INDEX idx_lotes_pt_estado ON lotes_producto_terminado(estado);
CREATE INDEX idx_lotes_pt_vencimiento ON lotes_producto_terminado(fecha_vencimiento);
CREATE INDEX idx_lote_mp_codigo ON lotes_materia_prima(codigo_lote_mp);
CREATE INDEX idx_lotes_mp_estado ON lotes_materia_prima(estado);
CREATE INDEX idx_eventos_lote ON eventos_trazabilidad(lote_pt_id, timestamp_evento);
CREATE INDEX idx_consumos_op ON consumos_materia_prima(orden_produccion_id, lote_mp_id);
CREATE INDEX idx_despachos_lote ON despachos(lote_pt_id);
CREATE INDEX idx_despachos_cliente ON despachos(cliente_id);
CREATE INDEX idx_despachos_remito ON despachos(numero_remito);
