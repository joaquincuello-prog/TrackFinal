-- =============================================================================
-- PROYECTO: TrackFinal — KIT AVZ-03 (Trazabilidad de Lote / Unidad)
-- CASO PILOTO: Lácteos San Antonio S.A.
-- MOTOR DE BASE DE DATOS: PostgreSQL 15+
-- AUTOR: Joaquín Nicolás Cuello (PP2 - 3.º Año Desarrollo de Software)
-- ASESOR: Tutor Académico PP2 / Arquitecto de Software y DBA
-- SEMANA: 03 — Diseño de Arquitectura y Base de Datos
-- FECHA: Septiembre 2026
-- ARCHIVO: database/seeds.sql
-- =============================================================================

-- CREDENCIALES DE ACCESO DE PRUEBA (DESARROLLO Y AUDITORÍA):
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
ON CONFLICT (id) DO NOTHING;

-- Ajustar secuencia
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- =============================================================================
-- 2. USUARIOS CON CONTRASEÑAS CIFRADAS (BCRYPT / PGCRYPTO)
-- =============================================================================

INSERT INTO usuarios (id, nombre, apellido, legajo, email, password_hash, rol_id, activo) VALUES
(1, 'Juan Ignacio', 'Pérez', 'ADM-001', 'admin@lacteossanantonio.com', crypt('Admin123!', gen_salt('bf', 10)), 1, TRUE),
(2, 'Mariana', 'López', 'DES-005', 'despacho@lacteossanantonio.com', crypt('Despacho123!', gen_salt('bf', 10)), 2, TRUE),
(3, 'Carlos', 'Gómez', 'OPE-014', 'operario@lacteossanantonio.com', crypt('Operario123!', gen_salt('bf', 10)), 3, TRUE),
(4, 'Esteban', 'Suárez', 'CAL-002', 'calidad@lacteossanantonio.com', crypt('Calidad123!', gen_salt('bf', 10)), 4, TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));

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
ON CONFLICT (id) DO NOTHING;

SELECT setval('materias_primas_id_seq', (SELECT MAX(id) FROM materias_primas));

-- =============================================================================
-- 4. LOTES DE MATERIA PRIMA (PROVEEDORES Y TAMBOS DE LA ZONA)
-- =============================================================================

INSERT INTO lotes_materia_prima (id, materia_prima_id, codigo_lote_mp, proveedor, fecha_recepcion, fecha_vencimiento, cantidad_inicial, cantidad_actual, estado) VALUES
(1, 1, 'MP-LEC-2026-0819', 'Tambo San José (Cañuelas)', '2026-09-01', '2026-09-07', 5000.00, 2000.00, 'DISPONIBLE'),
(2, 1, 'MP-LEC-2026-0820', 'Tambo Don Antonio (Navarro)', '2026-09-03', '2026-09-09', 6000.00, 6000.00, 'DISPONIBLE'),
(3, 2, 'MP-FERM-2026-0042', 'Chr. Hansen Argentina S.A.', '2026-08-15', '2027-02-15', 500.00, 350.00, 'DISPONIBLE'),
(4, 5, 'MP-FRUT-2026-0115', 'Frutales del Valle S.A.', '2026-08-20', '2026-11-20', 400.00, 250.00, 'DISPONIBLE')
ON CONFLICT (id) DO NOTHING;

SELECT setval('lotes_materia_prima_id_seq', (SELECT MAX(id) FROM lotes_materia_prima));

-- =============================================================================
-- 5. CATÁLOGO DE PRODUCTOS TERMINADOS (QUESOS Y YOGURES)
-- =============================================================================

INSERT INTO productos_terminados (id, codigo_sku, nombre, descripcion, unidad_medida, dias_vida_util, temperatura_conservacion) VALUES
(1, 'PT-YOG-FRUT-1L', 'Yogur Bebible Frutilla 1L', 'Yogur bebible endulzado parcialmente descremado sabor frutilla', 'Botella 1L', 30, '2°C a 6°C'),
(2, 'PT-QSO-CREM-4K', 'Queso Cremoso Tradicional 4kg', 'Queso de pasta blanda, grasa de alta humedad, tradicional argentino', 'Horma 4kg', 60, '4°C a 8°C'),
(3, 'PT-QSO-TYBO-3K', 'Queso Tybo en Barra 3.5kg', 'Queso de pasta semidura ideal para feteado en sandwicherías', 'Barra 3.5kg', 90, '4°C a 8°C'),
(4, 'PT-QSO-GOUD-5K', 'Queso Gouda Estacionado 5kg', 'Queso de pasta semidura madurado con sabor acentuado y ojos bien distribuidos', 'Horma 5kg', 120, '8°C a 12°C')
ON CONFLICT (id) DO NOTHING;

SELECT setval('productos_terminados_id_seq', (SELECT MAX(id) FROM productos_terminados));

-- =============================================================================
-- 6. PUNTOS DE CAPTURA EN PLANTA
-- =============================================================================

INSERT INTO puntos_captura (id, codigo_punto, nombre, descripcion) VALUES
(1, 'PC-REC', 'Recepción de Materia Prima', 'Descarga de leche cisterna e ingreso de insumos secos'),
(2, 'PC-ELAB', 'Tina de Elaboración / Pasteurización', 'Sector de calentamiento, fermentación, cuajado y corte'),
(3, 'PC-ENV', 'Línea de Envasado y Etiquetado', 'Fraccionamiento primario y generación automática de rótulo QR'),
(4, 'PC-CAL', 'Laboratorio de Control de Calidad', 'Ensayos físico-químicos (pH, acidez, grasa) y liberación'),
(5, 'PC-CAM', 'Cámara de Frío y Maduración', 'Almacenamiento térmico en estanterías/racks identificados'),
(6, 'PC-DESP', 'Playa de Despacho y Expedición', 'Control de remitos, asignación a transporte y entrega a clientes')
ON CONFLICT (id) DO NOTHING;

SELECT setval('puntos_captura_id_seq', (SELECT MAX(id) FROM puntos_captura));

-- =============================================================================
-- 7. ÓRDENES DE PRODUCCIÓN
-- =============================================================================

INSERT INTO ordenes_produccion (id, numero_op, producto_terminado_id, cantidad_planificada, fecha_inicio, fecha_fin, linea_produccion, estado) VALUES
(1, 'OP-2026-001', 1, 500.00, '2026-09-04 07:00:00-03', '2026-09-04 13:30:00-03', 'Línea Envasado Yogur 2', 'FINALIZADA'),
(2, 'OP-2026-002', 2, 150.00, '2026-09-04 06:00:00-03', '2026-09-04 15:00:00-03', 'Línea Quesería 1', 'FINALIZADA')
ON CONFLICT (id) DO NOTHING;

SELECT setval('ordenes_produccion_id_seq', (SELECT MAX(id) FROM ordenes_produccion));

-- =============================================================================
-- 8. CONSUMOS DE MATERIA PRIMA POR ORDEN (GENEALOGÍA HACIA ATRÁS)
-- =============================================================================

INSERT INTO consumos_materia_prima (id, orden_produccion_id, lote_mp_id, cantidad_consumida, timestamp_consumo, operario_id) VALUES
-- Consumos para OP-2026-001 (Yogur Frutilla)
(1, 1, 1, 520.00, '2026-09-04 07:30:00-03', 3), -- 520L Leche Tambo San José
(2, 1, 3, 50.00, '2026-09-04 08:00:00-03', 3),  -- 50g Fermento Chr. Hansen
(3, 1, 4, 50.00, '2026-09-04 10:15:00-03', 3),  -- 50kg Pulpa Frutilla Frutales del Valle

-- Consumos para OP-2026-002 (Queso Cremoso)
(4, 2, 1, 1500.00, '2026-09-04 06:30:00-03', 3), -- 1500L Leche Tambo San José
(5, 2, 3, 100.00, '2026-09-04 07:00:00-03', 3)   -- 100g Fermento Chr. Hansen
ON CONFLICT (id) DO NOTHING;

SELECT setval('consumos_materia_prima_id_seq', (SELECT MAX(id) FROM consumos_materia_prima));

-- =============================================================================
-- 9. LOTES DE PRODUCTO TERMINADO (CON PAYLOAD JSONB PARA CÓDIGO QR)
-- =============================================================================

INSERT INTO lotes_producto_terminado (id, orden_produccion_id, codigo_lote_pt, cantidad_elaborada, fecha_elaboracion, fecha_vencimiento, estado, codigo_qr_payload, ubicacion_deposito) VALUES
(1, 1, 'LPT-20260904-001', 500.00, '2026-09-04', '2026-10-04', 'DESPACHADO', 
 '{
    "app": "TrackFinal",
    "version": "1.0",
    "lote": "LPT-20260904-001",
    "sku": "PT-YOG-FRUT-1L",
    "producto": "Yogur Bebible Frutilla 1L",
    "fecha_elab": "2026-09-04",
    "fecha_venc": "2026-10-04",
    "op": "OP-2026-001",
    "planta": "Lácteos San Antonio S.A. - Planta Cañuelas",
    "verificacion_url": "http://trackfinal.lacteossanantonio.com/trazabilidad/LPT-20260904-001"
 }'::jsonb, 
 'Cámara 1 - Rack A1'),

(2, 2, 'LPT-20260904-002', 150.00, '2026-09-04', '2026-11-03', 'APROBADO', 
 '{
    "app": "TrackFinal",
    "version": "1.0",
    "lote": "LPT-20260904-002",
    "sku": "PT-QSO-CREM-4K",
    "producto": "Queso Cremoso Tradicional 4kg",
    "fecha_elab": "2026-09-04",
    "fecha_venc": "2026-11-03",
    "op": "OP-2026-002",
    "planta": "Lácteos San Antonio S.A. - Planta Cañuelas",
    "verificacion_url": "http://trackfinal.lacteossanantonio.com/trazabilidad/LPT-20260904-002"
 }'::jsonb, 
 'Cámara 1 - Rack B3'),

(3, 1, 'LPT-20260905-001', 300.00, '2026-09-05', '2026-10-05', 'CUARENTENA', 
 '{
    "app": "TrackFinal",
    "version": "1.0",
    "lote": "LPT-20260905-001",
    "sku": "PT-YOG-FRUT-1L",
    "producto": "Yogur Bebible Frutilla 1L",
    "fecha_elab": "2026-09-05",
    "fecha_venc": "2026-10-05",
    "op": "OP-2026-001",
    "planta": "Lácteos San Antonio S.A. - Planta Cañuelas",
    "verificacion_url": "http://trackfinal.lacteossanantonio.com/trazabilidad/LPT-20260905-001"
 }'::jsonb, 
 'Cámara 2 - Rack A1')
ON CONFLICT (id) DO NOTHING;

SELECT setval('lotes_producto_terminado_id_seq', (SELECT MAX(id) FROM lotes_producto_terminado));

-- =============================================================================
-- 10. CONTROLES DE CALIDAD BROMATOLÓGICA
-- =============================================================================

INSERT INTO controles_calidad (id, lote_pt_id, usuario_id, fecha_control, parametro_1_nombre, parametro_1_valor, parametro_2_nombre, parametro_2_valor, resultado, observaciones) VALUES
(1, 1, 4, '2026-09-04 12:45:00-03', 'pH a 20°C', '4.35', 'Acidez Dornic', '72°D', 'CONFORME', 'Parámetros fisicoquímicos en rango. Se autoriza estiba en frío.'),
(2, 2, 4, '2026-09-04 14:15:00-03', 'Humedad %', '48.5%', 'Materia Grasa en Extracto Seco', '51.0%', 'CONFORME', 'Cumple con estándares del Código Alimentario Argentino.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('controles_calidad_id_seq', (SELECT MAX(id) FROM controles_calidad));

-- =============================================================================
-- 11. EVENTOS DE TRAZABILIDAD (AUDITORÍA INMUTABLE CRONOLÓGICA)
-- =============================================================================

INSERT INTO eventos_trazabilidad (id, lote_pt_id, punto_captura_id, usuario_id, etapa_nombre, linea_equipo, timestamp_evento, observaciones) VALUES
(1, 1, 3, 3, 'Envasado y Generación QR', 'Envasadora Rotativa Sidel 2', '2026-09-04 12:30:00-03', '500 botellas de 1L envasadas con QR correlativo'),
(2, 1, 4, 4, 'Liberación Bromatológica', 'Laboratorio Central', '2026-09-04 12:50:00-03', 'Muestra representativa analizada y aprobada'),
(3, 1, 5, 3, 'Ingreso a Cámara de Frío', 'Cámara 1 - Sensor T01 (3.8°C)', '2026-09-04 13:15:00-03', 'Pallet ingresado y ubicado en Rack A1'),
(4, 1, 6, 2, 'Expedición a Distribución', 'Playa de Carga - Muelle 3', '2026-09-04 16:30:00-03', 'Despacho de 300 unidades cargadas en camión refrigerado con remito R-0001-000458'),

(5, 2, 3, 3, 'Moldeo y Envasado Termocontraíble', 'Línea Quesería 1', '2026-09-04 13:45:00-03', '150 hormas envasadas al vacío'),
(6, 2, 5, 3, 'Ingreso a Cámara de Maduración', 'Cámara 1 - Rack B3 (6.0°C)', '2026-09-04 14:30:00-03', 'Estiba para maduración controlada'),

(7, 3, 3, 3, 'Envasado y Rotulado', 'Línea Envasado Yogur 2', '2026-09-05 11:00:00-03', '300 unidades producidas. Desviación térmica preventiva reportada'),
(8, 3, 5, 3, 'Aislamiento en Cámara de Retención', 'Cámara 2 - Rack A1', '2026-09-05 11:45:00-03', 'Colocado en CUARENTENA a la espera de contraprueba analítica')
ON CONFLICT (id) DO NOTHING;

SELECT setval('eventos_trazabilidad_id_seq', (SELECT MAX(id) FROM eventos_trazabilidad));

-- =============================================================================
-- 12. PADRÓN DE CLIENTES (DISTRIBUIDORES Y SUPERMERCADOS)
-- =============================================================================

INSERT INTO clientes (id, cuit, razon_social, direccion, telefono) VALUES
(1, '30-65489123-8', 'Supermercados Norte S.A.', 'Av. Corrientes 4500, CABA', '011-4862-1100'),
(2, '30-71234567-4', 'Distribuidora Láctea Centro S.R.L.', 'Ruta 3 Km 45, Cañuelas, Prov. de Buenos Aires', '02226-430987'),
(3, '33-58963214-9', 'Hipermercados La Red S.A.', 'Av. Colón 2340, Córdoba Capital', '0351-4789000'),
(4, '20-28456123-3', 'Autoservicio San Cayetano', 'Calle San Martín 850, Lobos, Prov. de Buenos Aires', '02227-421155')
ON CONFLICT (id) DO NOTHING;

SELECT setval('clientes_id_seq', (SELECT MAX(id) FROM clientes));

-- =============================================================================
-- 13. DESPACHOS Y EXPEDICIONES (NEXO DIRECTO AL CLIENTE FINAL)
-- =============================================================================

INSERT INTO despachos (id, lote_pt_id, cliente_id, numero_remito, fecha_despacho, cantidad_despachada, usuario_id) VALUES
(1, 1, 1, 'R-0001-000458', '2026-09-04 16:30:00-03', 300.00, 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval('despachos_id_seq', (SELECT MAX(id) FROM despachos));
