-- =============================================================================
-- PROYECTO: TrackFinal — KIT AVZ-03 (Trazabilidad de Lote / Unidad)
-- CASO PILOTO: Lácteos San Antonio S.A.
-- MOTOR DE BASE DE DATOS: MySQL 8.0+ / MariaDB 10.5+
-- AUTOR: Joaquín Nicolás Cuello (PP2 - 3.º Año Desarrollo de Software)
-- ASESOR: Tutor Académico PP2 / Arquitecto de Software y DBA
-- ARCHIVO: database/seeds_mysql.sql
-- =============================================================================

USE trackfinal_db;

-- CREDENCIALES DE ACCESO DE PRUEBA:
-- 1. admin@lacteossanantonio.com      / Clave: Admin123!     (Rol: ADMIN)
-- 2. operario@lacteossanantonio.com   / Clave: Operario123!  (Rol: OPERARIO)
-- 3. despacho@lacteossanantonio.com   / Clave: Despacho123!  (Rol: SUPERVISOR)
-- 4. calidad@lacteossanantonio.com    / Clave: Calidad123!   (Rol: AUDITOR)

-- =============================================================================
-- 1. ROLES DEL SISTEMA (RBAC)
-- =============================================================================

INSERT INTO roles (id, nombre, descripcion) VALUES
(1, 'ADMIN', 'Administrador General: gestión de datos maestros, usuarios y configuración'),
(2, 'SUPERVISOR', 'Supervisor de Planta y Encargado de Despacho y Expedición'),
(3, 'OPERARIO', 'Operario de Producción: envasado, ingreso a cámara y escaneo de lotes'),
(4, 'AUDITOR', 'Auditor de Calidad y Bromatología: trazabilidad, recall e inspecciones')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), descripcion=VALUES(descripcion);

-- =============================================================================
-- 2. USUARIOS CON CONTRASEÑAS CIFRADAS (BCRYPT / 10 ROUNDS)
-- =============================================================================

INSERT INTO usuarios (id, nombre, apellido, legajo, email, password_hash, rol_id, activo) VALUES
(1, 'Juan Ignacio', 'Pérez', 'ADM-001', 'admin@lacteossanantonio.com', '$2a$10$2bR.pG1ZeaZZakEZtDKsIu24rQxUOVQhOvnohxO0l2vt6adRiw.OC', 1, TRUE),
(2, 'Mariana', 'López', 'DES-005', 'despacho@lacteossanantonio.com', '$2a$10$8Qrm6xAYFzzmGeXeLZAFV.FjLJnDTI.ciyeP3r9knhZ4wNMRKASCq', 2, TRUE),
(3, 'Carlos', 'Gómez', 'OPE-014', 'operario@lacteossanantonio.com', '$2a$10$X/z1AeZ.gKhhHhgksFl5tO9DkJHnz2OqOvQgrWT8d4M5gzdE3No7C', 3, TRUE),
(4, 'Esteban', 'Suárez', 'CAL-002', 'calidad@lacteossanantonio.com', '$2a$10$DxvzbMrzFcmRI/2UkYUVP.ryM6VU.vaa9vGcT7WB2lbKyVnGINlW2', 4, TRUE)
ON DUPLICATE KEY UPDATE email=VALUES(email), password_hash=VALUES(password_hash);

-- =============================================================================
-- 3. MATERIAS PRIMAS (INSUMOS LÁCTEOS)
-- =============================================================================

INSERT INTO materias_primas (id, codigo_sku, nombre, descripcion, unidad_medida) VALUES
(1, 'MP-LECHE-01', 'Leche Cruda Entera de Tambo', 'Leche fluida sin procesar mantenida a 4°C en tanques cisterna', 'Litros'),
(2, 'MP-FERM-01', 'Fermento Láctico Termófilo LYO', 'Cultivo liofilizado DVS para yogur y queso semiduro', 'Gramos'),
(3, 'MP-CUAJ-01', 'Cuajo Líquido Bovino 1:10000', 'Enzima coagulante natural de origen bovino', 'Mililitros'),
(4, 'MP-CALC-01', 'Cloruro de Calcio Alimentario', 'Coadyuvante de coagulación en polvo grado alimenticio', 'Gramos'),
(5, 'MP-FRUT-01', 'Pulpa Concentrada de Frutilla', 'Fruta natural procesada pasteurizada para yogures', 'Kg'),
(6, 'MP-AZUC-01', 'Azúcar Común Tipo A', 'Sacarosa pura refinada para endulzado de bases lácteas', 'Kg')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- =============================================================================
-- 4. LOTES DE MATERIA PRIMA (INGRESO CON CONTROL DE STOCK)
-- =============================================================================

INSERT INTO lotes_materia_prima (id, materia_prima_id, codigo_lote_mp, proveedor, fecha_recepcion, fecha_vencimiento, cantidad_inicial, cantidad_actual, estado) VALUES
(1, 1, 'LMP-20260901-01', 'Tambo Las Acacias (Ruta 205 Km 88)', '2026-09-01', '2026-09-04', 12000.00, 4500.00, 'DISPONIBLE'),
(2, 1, 'LMP-20260902-02', 'Cabaña San Isidro (Navarro)', '2026-09-02', '2026-09-05', 8500.00, 8500.00, 'DISPONIBLE'),
(3, 2, 'LMP-20260815-F1', 'Chr. Hansen Argentina S.A.', '2026-08-15', '2027-02-15', 5000.00, 3850.00, 'DISPONIBLE'),
(4, 3, 'LMP-20260820-C1', 'Laboratorios Biocel S.R.L.', '2026-08-20', '2027-08-20', 20000.00, 16000.00, 'DISPONIBLE'),
(5, 4, 'LMP-20260710-CL', 'Química del Centro S.A.', '2026-07-10', '2028-07-10', 500.00, 420.00, 'DISPONIBLE'),
(6, 5, 'LMP-20260825-FR', 'Frutas del Litoral S.A.', '2026-08-25', '2026-11-25', 1500.00, 950.00, 'DISPONIBLE'),
(7, 6, 'LMP-20260801-AZ', 'Ingenio Ledesma S.A.A.I.', '2026-08-01', '2028-08-01', 3000.00, 2100.00, 'DISPONIBLE')
ON DUPLICATE KEY UPDATE codigo_lote_mp=VALUES(codigo_lote_mp);

-- =============================================================================
-- 5. CATÁLOGO DE PRODUCTOS TERMINADOS (PT)
-- =============================================================================

INSERT INTO productos_terminados (id, codigo_sku, nombre, descripcion, unidad_medida, dias_vida_util, temperatura_conservacion) VALUES
(1, 'PT-QCR-01', 'Queso Cremoso Tradicional San Antonio', 'Queso de pasta blanda, elaborado con leche pasteurizada (Horma ~4kg)', 'Horma', 60, '2°C a 6°C'),
(2, 'PT-QTY-02', 'Queso Barra Tybo Feteable', 'Queso semiduro de corte para feteado industrial (Barra ~3.5kg)', 'Barra', 90, '2°C a 6°C'),
(3, 'PT-YOG-FRUT', 'Yogur Bebible Frutilla 1L', 'Yogur bebible parcialmente descremado con pulpa natural', 'Botella 1L', 35, '4°C a 8°C'),
(4, 'PT-DDL-CL', 'Dulce de Leche Clásico Familiar 400g', 'Dulce de leche tradicional elaborado en paila con receta criolla', 'Pote 400g', 180, 'Ambiente (máx 20°C)')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- =============================================================================
-- 6. ÓRDENES DE PRODUCCIÓN (OP)
-- =============================================================================

INSERT INTO ordenes_produccion (id, numero_op, producto_terminado_id, cantidad_planificada, fecha_inicio, fecha_fin, linea_produccion, estado) VALUES
(1, 'OP-2026-001', 1, 200.00, '2026-09-02 06:00:00', '2026-09-02 14:30:00', 'Línea Quesería 1 (Tinas 1 y 2)', 'FINALIZADA'),
(2, 'OP-2026-002', 3, 1000.00, '2026-09-03 07:00:00', NULL, 'Línea Envasado Yogur 2', 'EN_PROCESO'),
(3, 'OP-2026-003', 2, 150.00, '2026-09-04 06:30:00', NULL, 'Línea Quesería 2 (Tina 3)', 'EN_PROCESO'),
(4, 'OP-2026-004', 4, 800.00, '2026-09-05 07:00:00', NULL, 'Línea de Paila Dulcera 1', 'EN_PROCESO')
ON DUPLICATE KEY UPDATE numero_op=VALUES(numero_op);

-- =============================================================================
-- 7. CONSUMOS DE MATERIA PRIMA (NEXO GENEALÓGICO)
-- =============================================================================

INSERT INTO consumos_materia_prima (id, orden_produccion_id, lote_mp_id, cantidad_consumida, timestamp_consumo, operario_id) VALUES
(1, 1, 1, 7500.00, '2026-09-02 06:30:00', 3),
(2, 1, 3, 350.00, '2026-09-02 07:00:00', 3),
(3, 1, 4, 1500.00, '2026-09-02 07:15:00', 3),
(4, 1, 5, 80.00, '2026-09-02 07:15:00', 3),
(5, 2, 2, 900.00, '2026-09-03 07:30:00', 3),
(6, 2, 6, 250.00, '2026-09-03 08:00:00', 3),
(7, 2, 7, 450.00, '2026-09-03 08:15:00', 3),
(8, 3, 2, 1500.00, '2026-09-04 07:00:00', 3),
(9, 3, 3, 250.00, '2026-09-04 07:15:00', 3),
(10, 3, 4, 300.00, '2026-09-04 07:30:00', 3),
(11, 3, 5, 50.00, '2026-09-04 07:30:00', 3),
(12, 4, 1, 2400.00, '2026-09-05 07:30:00', 3),
(13, 4, 7, 500.00, '2026-09-05 08:00:00', 3)
ON DUPLICATE KEY UPDATE cantidad_consumida=VALUES(cantidad_consumida);

-- =============================================================================
-- 8. PUNTOS DE CAPTURA EN PLANTA INDUSTRIAL
-- =============================================================================

INSERT INTO puntos_captura (id, codigo_punto, nombre, descripcion) VALUES
(1, 'PC-REC', 'Recepción de Materia Prima y Tambo', 'Recepción de cisternas, control bromatológico de ingreso, acidez y temperatura'),
(2, 'PC-ELAB', 'Sector de Elaboración y Tinas', 'Pasteurización, coagulación, corte de cuajada, agregado de fermentos y cocción'),
(3, 'PC-ENV', 'Línea de Envasado, Pesaje y Marcado QR', 'Fraccionamiento primario, vacío, termocontracción y aplicación de rótulo QR'),
(4, 'PC-CAL', 'Laboratorio de Control de Calidad', 'Liberación fisicoquímica y microbiológica (pH, extracto seco, acidez Dornic)'),
(5, 'PC-CAM', 'Cámaras de Maduración y Conservación Frigorífica', 'Estacionamiento térmico controlado (2°C a 6°C)'),
(6, 'PC-DES', 'Muelle de Expedición y Despacho', 'Lectura de QR antes de carga en furgones refrigerados y emisión de remitos')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- =============================================================================
-- 9. LOTES DE PRODUCTO TERMINADO (PT) CON CÓDIGOS QR
-- =============================================================================

INSERT INTO lotes_producto_terminado (id, orden_produccion_id, codigo_lote_pt, cantidad_elaborada, fecha_elaboracion, fecha_vencimiento, estado, codigo_qr_payload, ubicacion_deposito) VALUES
(1, 1, 'LPT-20260902-001', 195.00, '2026-09-02', '2026-11-01', 'APROBADO', 
'{
  "app": "TrackFinal",
  "version": "1.0",
  "lote": "LPT-20260902-001",
  "sku": "PT-QCR-01",
  "producto": "Queso Cremoso Tradicional San Antonio",
  "unidad": "Horma",
  "elaboracion": "2026-09-02",
  "vencimiento": "2026-11-01",
  "conservacion": "2°C a 6°C",
  "linea": "Línea Quesería 1",
  "verificacion_url": "http://trackfinal.lacteossanantonio.com/trazabilidad/LPT-20260902-001"
}', 'Cámara 1 - Rack B3'),
(2, 2, 'LPT-20260903-002', 980.00, '2026-09-03', '2026-10-08', 'CUARENTENA', 
'{
  "app": "TrackFinal",
  "version": "1.0",
  "lote": "LPT-20260903-002",
  "sku": "PT-YOG-FRUT",
  "producto": "Yogur Bebible Frutilla 1L",
  "unidad": "Botella 1L",
  "elaboracion": "2026-09-03",
  "vencimiento": "2026-10-08",
  "conservacion": "4°C a 8°C",
  "linea": "Línea Envasado Yogur 2",
  "verificacion_url": "http://trackfinal.lacteossanantonio.com/trazabilidad/LPT-20260903-002"
}', 'Cámara 2 - Transitorio')
ON DUPLICATE KEY UPDATE codigo_lote_pt=VALUES(codigo_lote_pt);

-- =============================================================================
-- 10. EVENTOS DE TRAZABILIDAD (BITÁCORA TEMPORAL)
-- =============================================================================

INSERT INTO eventos_trazabilidad (id, lote_pt_id, punto_captura_id, usuario_id, etapa_nombre, linea_equipo, timestamp_evento, observaciones) VALUES
(1, 1, 3, 3, 'Envasado y Termocontracción', 'Línea Quesería 1 - Embolsadora Cryovac', '2026-09-02 14:00:00', '195 hormas envasadas al vacío y rotuladas con código QR.'),
(2, 1, 5, 3, 'Ingreso a Cámara 1', 'Autoelevador Eléctrico 02', '2026-09-02 15:30:00', 'Paletizado e ingreso a cámara de oreo a 4.2°C.'),
(3, 1, 4, 4, 'Aprobación Bromatológica', 'Laboratorio Central de Calidad', '2026-09-03 10:00:00', 'pH 5.22, Acidez Dornic 18°D. Aprobado para consumo.'),
(4, 2, 3, 3, 'Llenado y Tapado', 'Línea Envasado Yogur 2', '2026-09-03 11:30:00', '980 botellas de 1L envasadas con precinto de seguridad.')
ON DUPLICATE KEY UPDATE observaciones=VALUES(observaciones);

-- =============================================================================
-- 11. CONTROLES DE CALIDAD DE LABORATORIO
-- =============================================================================

INSERT INTO controles_calidad (id, lote_pt_id, usuario_id, fecha_control, parametro_1_nombre, parametro_1_valor, parametro_2_nombre, parametro_2_valor, resultado, observaciones) VALUES
(1, 1, 4, '2026-09-03 09:30:00', 'pH', '5.22', 'Materia Grasa (Grasa Butirosa)', '49.5%', 'CONFORME', 'Parámetros fisicoquímicos cumplen norma IRAM e informe SENASA.'),
(2, 2, 4, '2026-09-03 16:00:00', 'pH', '4.35', 'Recuento Bacterias Lácticas', '1.2x10^8 UFC/g', 'CONFORME', 'En período de cuarentena protocolar de 24h para liberación microbiológica.')
ON DUPLICATE KEY UPDATE resultado=VALUES(resultado);

-- =============================================================================
-- 12. CLIENTES DESTINATARIOS (DISTRIBUCIÓN)
-- =============================================================================

INSERT INTO clientes (id, cuit, razon_social, direccion, telefono) VALUES
(1, '30-68945231-9', 'Supermercados del Centro S.A.', 'Av. Alem 1450, Córdoba Capital', '+54 351 489-2200'),
(2, '33-71239845-9', 'Distribuidora Láctea San Cayetano', 'Bv. España 560, Villa María, Cba', '+54 353 453-1122'),
(3, '30-54982134-4', 'Cadena Regional HiperMayorista', 'Ruta 9 Km 554, Bell Ville, Cba', '+54 3537 42-8890')
ON DUPLICATE KEY UPDATE razon_social=VALUES(razon_social);

-- =============================================================================
-- 13. DESPACHOS Y REMITOS DE EXPEDICIÓN
-- =============================================================================

INSERT INTO despachos (id, lote_pt_id, cliente_id, numero_remito, fecha_despacho, cantidad_despachada, usuario_id) VALUES
(1, 1, 1, 'R-0001-00045231', '2026-09-04 08:30:00', 80.00, 2),
(2, 1, 2, 'R-0001-00045232', '2026-09-04 11:00:00', 60.00, 2)
ON DUPLICATE KEY UPDATE numero_remito=VALUES(numero_remito);
