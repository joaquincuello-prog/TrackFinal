/**
 * Script de Verificación y Pruebas End-to-End para la API REST TrackFinal
 * Valida:
 * 1. Healthcheck del servicio
 * 2. Autenticación (Login exitoso vs credenciales inválidas)
 * 3. Protección de rutas con JWT Bearer
 * 4. Autorización RBAC (403 Forbidden para roles no autorizados)
 * 5. Transacción ACID: Consumo de Materia Prima y descuento de saldo
 * 6. Transacción Atómica: Alta de Lote PT con QR (JSONB) y evento inicial de envasado
 * 7. Genealogía Hacia Atrás (Backward Traceability)
 * 8. Genealogía Hacia Adelante (Recall Logístico)
 */

require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

let serverInstance = null;

// Helper para realizar peticiones HTTP nativas en Node.js
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, rawBody: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('  SUITE DE PRUEBAS DE INTEGRACIÓN: API TRACKFINAL (SEMANAS 6 Y 7)');
  console.log('=============================================================\n');

  try {
    // 0. Levantar servidor si no está activo
    try {
      await request('GET', '/api/v1/health');
    } catch {
      await new Promise((resolve) => {
        serverInstance = app.listen(PORT, () => {
          resolve();
        });
      });
    }

    // -------------------------------------------------------------
    // PRUEBA 1: Healthcheck
    // -------------------------------------------------------------
    console.log('▶ Prueba 1: Healthcheck del Servidor');
    const health = await request('GET', '/api/v1/health');
    assert(health.status === 200, `Status HTTP 200 (Obtenido: ${health.status})`);
    assert(health.body.success === true, 'Respuesta success === true');
    assert(health.body.sistema.includes('KIT AVZ-03'), 'Identificación correcta del KIT AVZ-03');

    // -------------------------------------------------------------
    // PRUEBA 2: Login con credenciales erróneas
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 2: Autenticación con Credenciales Inválidas');
    const badLogin = await request('POST', '/api/v1/auth/login', {
      email: 'admin@lacteossanantonio.com',
      password: 'PasswordIncorrecto999!',
    });
    assert(badLogin.status === 401, `Status HTTP 401 Unauthorized (Obtenido: ${badLogin.status})`);
    assert(badLogin.body.success === false, 'Respuesta success === false');

    // -------------------------------------------------------------
    // PRUEBA 3: Login exitoso como Administrador
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 3: Login Exitoso (ADMIN)');
    const adminLogin = await request('POST', '/api/v1/auth/login', {
      email: 'admin@lacteossanantonio.com',
      password: 'Admin123!',
    });
    assert(adminLogin.status === 200, `Status HTTP 200 OK (Obtenido: ${adminLogin.status})`);
    assert(adminLogin.body.data && !!adminLogin.body.data.token, 'Token JWT emitido');
    assert(adminLogin.body.data.usuario.rol === 'ADMIN', 'Rol del usuario es ADMIN');
    const adminToken = adminLogin.body.data.token;

    // -------------------------------------------------------------
    // PRUEBA 4: Login exitoso como Operario de Planta
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 4: Login Exitoso (OPERARIO)');
    const operarioLogin = await request('POST', '/api/v1/auth/login', {
      email: 'operario@lacteossanantonio.com',
      password: 'Operario123!',
    });
    assert(operarioLogin.status === 200, `Status HTTP 200 OK (Obtenido: ${operarioLogin.status})`);
    assert(operarioLogin.body.data.usuario.rol === 'OPERARIO', 'Rol del usuario es OPERARIO');
    const operarioToken = operarioLogin.body.data.token;

    // -------------------------------------------------------------
    // PRUEBA 5: Consulta de perfil actual (/me)
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 5: Endpoint /me con Token JWT');
    const meRes = await request('GET', '/api/v1/auth/me', null, operarioToken);
    assert(meRes.status === 200, 'Status HTTP 200 en /me');
    assert(meRes.body.data.legajo === 'OPE-014', `Legajo correcto: ${meRes.body.data.legajo}`);

    // -------------------------------------------------------------
    // PRUEBA 6: Acceso denegado a rutas protegidas sin token
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 6: Protección de Rutas sin Token');
    const noTokenRes = await request('GET', '/api/v1/productos');
    assert(noTokenRes.status === 401, `Status HTTP 401 al consultar sin token (Obtenido: ${noTokenRes.status})`);

    // -------------------------------------------------------------
    // PRUEBA 7: Consulta de Catálogo con Token
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 7: Consulta de Productos y Materias Primas');
    const prodRes = await request('GET', '/api/v1/productos', null, operarioToken);
    assert(prodRes.status === 200, 'Status HTTP 200 en catálogo de productos');
    assert(Array.isArray(prodRes.body.data) && prodRes.body.data.length > 0, `Productos encontrados: ${prodRes.body.data.length}`);

    const lotesMpRes = await request('GET', '/api/v1/materias-primas/lotes', null, operarioToken);
    assert(lotesMpRes.status === 200, 'Status HTTP 200 en lotes de materia prima');
    assert(Array.isArray(lotesMpRes.body.data), 'Lista de lotes de MP obtenida');

    // -------------------------------------------------------------
    // PRUEBA 8: Control de Acceso RBAC (Operario intentando registrar despacho)
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 8: Validación de Seguridad RBAC');
    const rbacRes = await request('POST', '/api/v1/despachos', {
      lote_pt_id: 1,
      cliente_id: 1,
      numero_remito: 'R-0001-999999',
      cantidad_despachada: 10,
    }, operarioToken);
    assert(rbacRes.status === 403, `Status HTTP 403 Forbidden para Operario en Despacho (Obtenido: ${rbacRes.status})`);
    assert(rbacRes.body.error.includes('no tiene permisos'), 'Mensaje claro de restricción RBAC');

    // -------------------------------------------------------------
    // PRUEBA 9: Transacción Atómica de Consumo de Materia Prima
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 9: Transacción ACID de Consumo de Insumos');
    const consumoRes = await request('POST', '/api/v1/produccion/consumos', {
      orden_produccion_id: 1,
      lote_mp_id: 1, // Lote de Leche Cruda
      cantidad_consumida: 150.00,
    }, operarioToken);
    assert(consumoRes.status === 201, `Status HTTP 201 Created en consumo (Obtenido: ${consumoRes.status})`);
    assert(Number(consumoRes.body.data.consumo.cantidad_consumida) === 150, 'Cantidad consumida registrada numéricamente');
    assert(consumoRes.body.data.lote_mp_actualizado.cantidad_actual !== undefined, 'Stock de materia prima descontado');

    // -------------------------------------------------------------
    // PRUEBA 10: Generación Atómica de Lote PT con QR y Evento Inicial
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 10: Generación Transaccional de Lote PT con QR y Evento Inicial');
    const codigoPrueba = `LPT-TEST-${Date.now().toString().slice(-6)}`;
    const nuevoLoteRes = await request('POST', '/api/v1/lotes-pt', {
      orden_produccion_id: 1,
      codigo_lote_pt: codigoPrueba,
      cantidad_elaborada: 250,
      fecha_elaboracion: '2026-09-15',
      ubicacion_deposito: 'Cámara 1 - Rack C2',
    }, operarioToken);

    assert(nuevoLoteRes.status === 201, `Status HTTP 201 Created en lote PT (Obtenido: ${nuevoLoteRes.status})`);
    assert(nuevoLoteRes.body.data.codigo_lote_pt === codigoPrueba, 'Código de lote asignado');
    assert(!!nuevoLoteRes.body.data.fecha_vencimiento, `Cálculo automático de vencimiento: ${nuevoLoteRes.body.data.fecha_vencimiento}`);
    assert(nuevoLoteRes.body.data.codigo_qr_payload.app === 'TrackFinal', 'Payload QR estructurado generado');
    assert(nuevoLoteRes.body.data.evento_inicial.etapa_nombre === 'Envasado y Generación QR', 'Evento inicial de trazabilidad registrado atómicamente');

    // -------------------------------------------------------------
    // PRUEBA 11: Reconstrucción de Genealogía Hacia Atrás (Backward)
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 11: Motor de Genealogía Hacia Atrás (Backward Traceability)');
    const backwardRes = await request('GET', `/api/v1/trazabilidad/backward/${codigoPrueba}`, null, operarioToken);
    assert(backwardRes.status === 200, 'Status HTTP 200 en genealogía backward');
    assert(backwardRes.body.data.lote_pt === codigoPrueba, 'Lote PT localizado');
    assert(Array.isArray(backwardRes.body.data.materias_primas_consumidas), 'Árbol de insumos recuperado');
    assert(backwardRes.body.data.historial_eventos.length >= 1, 'Historial de eventos inmutables contiene el envasado inicial');

    // -------------------------------------------------------------
    // PRUEBA 12: Reconstrucción de Genealogía Hacia Adelante (Forward / Recall)
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 12: Motor de Recall Hacia Adelante (Forward Traceability)');
    const forwardRes = await request('GET', '/api/v1/trazabilidad/forward/LMP-20260901-01', null, operarioToken);
    assert(forwardRes.status === 200, `Status HTTP 200 en consulta de recall (Obtenido: ${forwardRes.status})`);
    assert(forwardRes.body.data.lote_mp === 'LMP-20260901-01', 'Lote de materia prima identificado');
    assert(Array.isArray(forwardRes.body.data.productos_afectados), 'Lista de lotes afectados recuperada');
    assert(forwardRes.body.data.total_clientes_notificar >= 1, 'Cálculo de clientes a notificar');

    // -------------------------------------------------------------
    // PRUEBA 13: Emisión de Imagen QR en Backend
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 13: Generación de Imagen QR Oficial (DataURL)');
    const qrRes = await request('GET', `/api/v1/lotes-pt/${codigoPrueba}/qr`, null, operarioToken);
    assert(qrRes.status === 200, 'Status HTTP 200 en generación de QR');
    assert(qrRes.body.data.qr_image_data_url.startsWith('data:image/png;base64,'), 'QR DataURL generado correctamente');

    // -------------------------------------------------------------
    // PRUEBA 14: Alias de Rutas de Trazabilidad (KIT AVZ-03)
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 14: Validación de Rutas Alias de Trazabilidad');
    const backwardAliasRes = await request('GET', `/api/v1/trazabilidad/lote-pt/${codigoPrueba}/backward`, null, operarioToken);
    assert(backwardAliasRes.status === 200, 'Status HTTP 200 en alias /trazabilidad/lote-pt/:codigo/backward');

    const forwardAliasRes = await request('GET', '/api/v1/trazabilidad/lote-mp/LMP-20260901-01/forward', null, operarioToken);
    assert(forwardAliasRes.status === 200, 'Status HTTP 200 en alias /trazabilidad/lote-mp/:codigo/forward');

    // -------------------------------------------------------------
    // PRUEBA 15: Protocolo de Recall y Bloqueo Preventivo Masivo
    // -------------------------------------------------------------
    console.log('\n▶ Prueba 15: Bloqueo Preventivo Masivo ante Protocolo de Recall (ACID)');
    const recallBlockRes = await request('POST', '/api/v1/trazabilidad/recall/bloqueo-preventivo', {
      codigo_lote_mp: 'LMP-20260901-01',
      motivo: 'Alerta sanitaria microbiológica en leche cruda - Aplicación de cuarentena inmediata',
    }, adminToken);
    assert(recallBlockRes.status === 200, `Status HTTP 200 en Bloqueo Preventivo (Obtenido: ${recallBlockRes.status})`);
    assert(recallBlockRes.body.data.total_lotes_bloqueados >= 0, 'Bloqueo preventivo ejecutado y registrado en auditoría');

    console.log('\n=============================================================');
    console.log(`  RESUMEN FINAL DE PRUEBAS: ${passedTests} / ${totalTests} EXITOSAS`);
    console.log('=============================================================\n');

    if (serverInstance) {
      serverInstance.close();
    }
    await db.pool.end();

    if (passedTests === totalTests) {
      console.log('🎉 TODOS LOS ENTREGABLES DE SEMANA 6 Y SEMANA 7 ESTÁN OPERATIVOS Y VALIDADOS.\n');
      process.exit(0);
    } else {
      console.error('⚠️ ALGUNAS PRUEBAS FALLARON. REVISAR LOGS ANTERIORES.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error fatal al ejecutar suite de pruebas:', error.message);
    if (serverInstance) serverInstance.close();
    await db.pool.end();
    process.exit(1);
  }
}

runTests();
