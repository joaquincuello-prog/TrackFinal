# MANUAL DE USUARIO ILUSTRADO POR ROLES — PP2

**Sistema:** TrackFinal — Trazabilidad de Lote/Unidad (KIT AVZ-03)  
**Caso Piloto:** Lácteos San Antonio S.A.  
**Estudiante:** Joaquín Nicolás Cuello  
**Carrera:** Tecnicatura Superior en Desarrollo de Software (3.º Año)  
**Cátedra:** Práctica Profesionalizante II (PP2)  
**Versión:** 1.0 (Guía Operativa Integral)  

---

## 1. Introducción y Acceso al Sistema

El sistema **TrackFinal** está diseñado para operar en estaciones fijas de trabajo (PCs de escritorio en muelle y laboratorio) y terminales táctiles o dispositivos móviles industriales (tablets y smartphones) conectados a la red Wi-Fi de planta de Lácteos San Antonio S.A.

### 1.1 Pantalla de Inicio de Sesión (Login)
Para ingresar al sistema, diríjase a la URL oficial (`http://localhost:5173` o a la dirección IP asignada en red local LAN).

```text
+---------------------------------------------------------------------+
|                     LÁCTEOS SAN ANTONIO S.A.                        |
|              TRACKFINAL — TRAZABILIDAD DE PLANTA                    |
|                                                                     |
|    +-----------------------------------------------------------+    |
|    | Correo Electrónico: [ operario@lacteossanantonio.com    ] |    |
|    | Contraseña:         [ ••••••••••••••                    ] |    |
|    |                                                           |    |
|    |               [  INICIAR SESIÓN EN PLANTA  ]              |    |
|    +-----------------------------------------------------------+    |
|                                                                     |
|   Accesos de demostración:                                          |
|   • Admin: admin@lacteossanantonio.com                              |
|   • Supervisor: despacho@lacteossanantonio.com                      |
|   • Operario: operario@lacteossanantonio.com                        |
|   • Auditor: calidad@lacteossanantonio.com                          |
+---------------------------------------------------------------------+
```

*Una vez autenticado, el sistema reconoce automáticamente su rol y adapta los menús, permisos y acciones disponibles según su perfil laboral.*

---

## 2. Perfil 1: Operario de Planta (Producción y Envasado)

**Rol:** `OPERARIO`  
**Usuario de Referencia:** Carlos Gómez (Legajo: `OPE-014`)  
**Módulos Habilitados:** *Captura en Planta*, *Listado de Lotes PT* (Alta y Visualización de QR).

### 2.1 Flujo Operativo en los 6 Puntos de Captura
Desde el menú superior, seleccione **"Captura en Planta"**. La interfaz exhibirá una barra táctil con los 6 puntos cardinales del proceso productivo lácteo:

```text
+---------------------------------------------------------------------------------------+
| [1. Recepción MP] [2. Elaboración] [3. Envasado y QR] [4. Calidad] [5. Cámara] [6. Despacho] |
+---------------------------------------------------------------------------------------+
```

#### Punto 1: Recepción de Materia Prima y Tambo (PC-REC)
1. Conecte la manguera de cisterna del tambo al silo de recepción.
2. Complete los datos de la partida:
   * **Tambo Proveedor:** Seleccione el tambo remitente (ej. *Tambo Las Acacias*).
   * **Litros Descargados:** Ingrese el volumen medido por caudalímetro (ej. `12000`).
   * **Temperatura (°C):** Temperatura de la leche en cisterna (tolerancia: $\le 4.0^\circ\text{C}$).
   * **Acidez Dornic (°D):** Medición de titulación rápida (rango: $14 - 18^\circ\text{D}$).
3. Presione el botón **"Registrar Ingreso de Cisterna"**.

#### Punto 2: Sector de Elaboración y Tinas (PC-ELAB)
1. Seleccione la tina en proceso (ej. *Tina de Cuajado 01*).
2. Verifique la temperatura de coagulación (`38.5°C`) y el tiempo de reposo (`45 min`).
3. Registre los consumos de cuajo líquido, fermento y cloruro de calcio asociados a la Orden de Producción activa.
4. Presione **"Confirmar Punto de Cuajado"**.

#### Punto 3: Línea de Envasado, Pesaje y Marcado QR (PC-ENV)
*Este es el punto neurálgico del KIT AVZ-03.* Aquí se genera físicamente la partida de producto terminado y su identificación digital:

```text
+-------------------------------------------------------------------------+
|                  NUEVO LOTE DE PRODUCTO TERMINADO                       |
+-------------------------------------------------------------------------+
| Orden de Producción:   [ OP-2026-001 (Queso Cremoso Tradicional)     v ]|
| Código de Lote PT:     [ LPT-20260902-001                            ]  |
| Cantidad Elaborada:    [ 195.00                      ] [ Hormas     ]  |
| Fecha de Elaboración:  [ 2026-09-02                  ]                  |
| Vencimiento Calculado: [ 2026-11-01 (Automático +60 días)            ]  |
| Ubicación en Depósito: [ Cámara 1 - Rack B3                          ]  |
+-------------------------------------------------------------------------+
|             [ Cancelar ]      [ GENERAR LOTE Y EMITIR QR ]              |
+-------------------------------------------------------------------------+
```

5. Al presionar **"GENERAR LOTE Y EMITIR QR"**, el sistema realiza la transacción atómica en la base de datos y despliega en pantalla la **Rótulo Card Oficial**:

```text
+-------------------------------------------------------------+
|               LÁCTEOS SAN ANTONIO S.A.                      |
|            RÓTULO DE IDENTIFICACIÓN DIGITAL                 |
|                                                             |
|       +---------------+   Lote: LPT-20260902-001            |
|       | [█████ █ █]   |   SKU:  PT-QCR-01                   |
|       | [█   █ █ █]   |   Prod: Queso Cremoso Tradicional   |
|       | [█████ ███]   |   Elab: 2026-09-02                  |
|       | [█   █ █ █]   |   Venc: 2026-11-01                  |
|       +---------------+   Cám.: Cámara 1 - Rack B3          |
|                                                             |
|           [ IMPRIMIR ETIQUETA ]      [ CERRAR ]             |
+-------------------------------------------------------------+
```

#### Punto 4: Laboratorio de Control de Calidad (PC-CAL)
Permite al personal registrar las determinaciones analíticas de rutina: pH, acidez Dornic y materia grasa para habilitar el lote.

#### Punto 5: Cámara de Frío y Maduración (PC-CAM)
1. Escanee o seleccione el lote ingresado al frigorífico.
2. Asigne el pasillo y estantería de estacionamiento térmico (ej. *Cámara 1 - Rack B3*).
3. Confirme el ingreso para actualizar la ubicación física del pallet.

---

## 3. Perfil 2: Supervisor de Despacho y Expedición

**Rol:** `SUPERVISOR`  
**Usuario de Referencia:** Mariana López (Legajo: `DES-005`)  
**Módulos Habilitados:** *Lotes PT*, *Expedición y Remitos*, *Protocolo de Recall*.

### 3.1 Aprobación y Cambio de Estados de Lotes
El Supervisor posee la facultad técnica de alterar el ciclo de vida del producto terminado desde la vista **"Lotes PT"**:

```text
+-----------------------------------------------------------------------------------+
| LOTES DE PRODUCTO TERMINADO                                                       |
| [Buscar por código...]    [Filtro: Todos v]                                       |
+-----------------------------------------------------------------------------------+
| LOTE             PRODUCTO          ESTADO       VENCIMIENTO   UBICACIÓN  ACCIONES |
| LPT-20260902-001 Queso Cremoso     APROBADO     2026-11-01    Cámara 1   [QR][Mod]|
| LPT-20260903-002 Yogur Bebible 1L  CUARENTENA   2026-10-08    Cámara 2   [QR][Mod]|
+-----------------------------------------------------------------------------------+
```

1. Haga clic en el botón **Modificar Estado** (`[Mod]`).
2. Se abrirá la ventana modal de dictamen:
   * **Nuevo Estado:** Seleccione entre `APROBADO`, `CUARENTENA`, `RECHAZADO` o `BLOQUEADO`.
   * **Motivo / Observación:** Detalle la causa técnica (ej. *"Liberación por conformidad fisicoquímica de laboratorio"*).
3. Al confirmar, el nuevo estado queda fijado con registro de auditoría.

### 3.2 Emisión de Remitos y Despacho Físico (Punto 6)
Para liberar mercadería hacia clientes mayoristas:
1. Ingrese a **"Captura en Planta"** -> **Punto 6: Muelle de Expedición y Despacho**.
2. **Seleccione el Lote PT:** Solo se permiten lotes que estén en estado `APROBADO`. Si el lote está en `CUARENTENA` o `BLOQUEADO`, el sistema rechazará la expedición.
3. **Cliente Destinatario:** Elija el cliente registrado (ej. *Distribuidora Láctea Centro S.A.*).
4. **Número de Remito:** Ingrese el número correlativo legal (ej. `R-0001-000089`).
5. **Cantidad a Despachar:** Hormas o bultos cargados en el furgón térmico.
6. Presione **"Emitir Remito y Despachar Lote"**. El lote transiciona a estado `DESPACHADO`.

---

## 4. Perfil 3: Auditor Bromatológico e Inspector de Calidad

**Rol:** `AUDITOR`  
**Usuario de Referencia:** Esteban Suárez (Legajo: `CAL-002`)  
**Módulos Habilitados:** *Trazabilidad Genealógica*, *Inspección QR*, *Simulador de Recall*.  
**Regla de Negocio Crítica:** **Veedor Estricto.** El Auditor cuenta con facultades de consulta profunda e ilimitada sobre toda la cadena histórica, pero **no posee permisos de escritura ni mutación** sobre estados de lotes ni despachos (cualquier intento forzado es repelido por el backend con `403 Forbidden`).

### 4.1 Consulta de Genealogía Hacia Atrás (Backward Traceability)
Utilice este módulo para auditar cualquier producto terminado presente en góndola o depósito:

1. Ingrese al módulo **"Trazabilidad"**.
2. Seleccione la pestaña **"Hacia Atrás (Backward)"**.
3. Ingrese el código del lote (ej. `LPT-20260902-001`) o presione el botón **"Escanear QR"** para utilizar la cámara web o del smartphone.
4. Presione **"Buscar Genealogía"**.
5. El sistema reconstruye en pantalla el árbol de custodia en menos de 2 segundos:
   * **Ficha del Lote:** SKU, cantidad, fecha de elaboración y vencimiento legal.
   * **Materias Primas Utilizadas:** Muestra cada insumo (leche cruda, fermento, cuajo), su lote de origen, cantidad consumida y el tambo proveedor con su geolocalización o ruta.
   * **Controles Bromatológicos:** Historial de pH, acidez y temperatura durante la manufactura.
   * **Línea Temporal Inmutable:** Cronología de eventos desde el cuajado hasta el ingreso a cámara de frío.

```text
+-------------------------------------------------------------------------+
| TRAZABILIDAD HACIA ATRÁS: LPT-20260902-001                             |
+-------------------------------------------------------------------------+
| [Producto: Queso Cremoso] [OP: OP-2026-001] [Estado: APROBADO]          |
|                                                                         |
| INS_CONSUMIDOS:                                                         |
| • Leche Cruda: LMP-20260901-01 (Tambo Las Acacias) — 7500.00 L          |
| • Fermento:   LMP-20260815-F1 (Chr. Hansen S.A.)  — 350.00 g           |
| • Cuajo Liq.: LMP-20260820-C1 (Biocel S.R.L.)     — 1500.00 mL         |
|                                                                         |
| HISTORIAL DE EVENTOS:                                                   |
| [06:00] Inicio OP -> [07:15] Cuajado -> [10:30] Envasado y QR           |
+-------------------------------------------------------------------------+
```

### 4.2 Consulta de Genealogía Hacia Adelante (Forward / Protocolo de Recall)
Ante una alerta de un tambo o proveedor de aditivos:

1. En el módulo **"Trazabilidad"**, elija la pestaña **"Hacia Adelante (Recall)"**.
2. Ingrese el código de lote de materia prima sospechoso (ej. `LMP-20260901-01`).
3. El motor de búsqueda identifica de forma instantánea:
   * Todos los lotes de queso o yogur elaborados con esa leche cruda.
   * Qué cantidad permanece aún en las cámaras frigoríficas de la planta.
   * **Listado de Clientes Afectados:** Razón social, CUIT, teléfono, número de remito de entrega y fecha en que recibieron el producto.
4. Si se requiere una acción sanitaria inmediata, el Supervisor o Administrador puede presionar el botón de alerta para activar el **Bloqueo Preventivo Masivo**.

---

## 5. Perfil 4: Administrador General del Sistema

**Rol:** `ADMIN`  
**Usuario de Referencia:** Juan Ignacio Pérez (Legajo: `ADM-001`)  
**Módulos Habilitados:** Acceso irrestricto a todos los módulos operativos y de configuración.

### 5.1 Responsabilidades y Gobernanza
* **Administración de Cuentas y Accesos:** Creación de nuevos usuarios de planta, asignación de legajos y roles específicos para prevenir escalación de privilegios.
* **Mantenimiento de Catálogos:** Actualización del maestro de productos terminados (SKUs, vidas útiles en días, temperaturas de conservación) y materias primas.
* **Supervisión de Auditoría:** Verificación de logs de seguridad, integridad del pool de base de datos y cumplimiento de los tiempos de respuesta del KIT AVZ-03.
* **Despliegue y Mantenimiento de Red:** Verificación de enlaces de red local LAN para asegurar conectividad ininterrumpida de las terminales de planta.
