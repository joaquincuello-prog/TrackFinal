import { Printer, X } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden; }
  #ficha-tecnica-print,
  #ficha-tecnica-print * { visibility: visible; }
  #ficha-tecnica-print { position: absolute; left: 0; top: 0; }
  .no-print { display: none !important; }
}
`;

function formatFecha(fecha) {
  if (!fecha) return 'N/D';
  try {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return fecha;
  }
}

const ESTADO_BADGE = {
  APROBADO: 'bg-emerald-100 text-emerald-800',
  CUARENTENA: 'bg-orange-100 text-orange-800',
  EN_PROCESO: 'bg-yellow-100 text-yellow-800',
  RECHAZADO: 'bg-red-100 text-red-800',
  DESPACHADO: 'bg-sky-100 text-sky-800',
  BLOQUEADO: 'bg-red-200 text-red-900',
};

// ─── Sección: celda de datos ───────────────────────────────────────────────────
function DatoFila({ label, value, fullWidth = false }) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-800">{value ?? 'N/D'}</p>
    </div>
  );
}

/**
 * FichaTecnicaModal — Modal de Ficha Técnica de Liberación Bromatológica.
 * @param {{ isOpen: boolean, onClose: Function, lote: Object, consumos: Array, analisis: Object }} props
 */
export default function FichaTecnicaModal({
  isOpen,
  onClose,
  lote = {},
  consumos = [],
  analisis = {},
}) {
  if (!isOpen) return null;

  const hoy = new Date().toLocaleDateString('es-AR');
  const docNum = `FT-LIB-${lote.codigo_lote_pt ?? '------'}`;
  const estadoBadge = ESTADO_BADGE[lote.estado] ?? 'bg-gray-100 text-gray-700';

  return (
    <>
      {/* Print styles */}
      <style>{PRINT_STYLES}</style>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-4 px-2"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Contenedor modal */}
        <div className="bg-white text-gray-900 w-full max-w-3xl mx-auto rounded-2xl shadow-2xl overflow-hidden">

          {/* ── ÁREA IMPRIMIBLE ─────────────────────────────────────────────── */}
          <div id="ficha-tecnica-print">

            {/* 1. MEMBRETE */}
            <div className="bg-blue-900 text-white px-6 py-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight">
                    LÁCTEOS SAN ANTONIO S.A.
                  </h1>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Establecimiento SENASA Nº 1042 — Villa María, Córdoba
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">
                    Ficha Técnica de Liberación Bromatológica
                  </p>
                  <p className="text-base font-bold mt-0.5">{docNum}</p>
                  <p className="text-xs text-blue-300">Fecha de emisión: {hoy}</p>
                </div>
              </div>
            </div>

            {/* 2. DATOS DEL LOTE */}
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Datos del Lote
              </h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <DatoFila label="Código de Lote PT" value={lote.codigo_lote_pt} />
                <DatoFila label="Producto" value={lote.producto_nombre} />
                <DatoFila label="SKU" value={lote.codigo_sku} />
                <DatoFila
                  label="Cantidad Elaborada"
                  value={
                    lote.cantidad_elaborada != null
                      ? `${lote.cantidad_elaborada} ${lote.unidad_medida ?? ''}`
                      : undefined
                  }
                />
                <DatoFila
                  label="Fecha de Elaboración"
                  value={formatFecha(lote.fecha_elaboracion)}
                />
                <DatoFila
                  label="Fecha de Vencimiento"
                  value={formatFecha(lote.fecha_vencimiento)}
                />
                <DatoFila
                  label="Línea de Elaboración"
                  value={lote.linea_produccion || 'N/D'}
                />
                <DatoFila label="Ubicación en Depósito" value={lote.ubicacion_deposito} />
                <DatoFila label="Número de OP" value={lote.numero_op} />
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                    Estado
                  </p>
                  <span
                    className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${estadoBadge}`}
                  >
                    {lote.estado ?? 'N/D'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. CÓDIGO QR */}
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col items-center gap-2">
              {lote.qrImageUrl ? (
                <img
                  src={lote.qrImageUrl}
                  alt="QR de trazabilidad"
                  className="w-[120px] h-[120px] border border-gray-300 rounded-lg p-1"
                />
              ) : (
                <div className="w-[120px] h-[120px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs text-center p-2">
                  QR no disponible
                </div>
              )}
              <p className="text-xs text-gray-500">Escanear para trazabilidad completa</p>
              <p className="text-[10px] text-blue-600 font-mono">
                trackfinal.lacteossanantonio.com/trazabilidad/{lote.codigo_lote_pt}
              </p>
            </div>

            {/* 4. MATERIAS PRIMAS */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Materias Primas Consumidas
              </h2>
              {consumos.length > 0 ? (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left py-1.5 px-2 text-xs font-semibold text-gray-600 border border-gray-200">
                        Materia Prima
                      </th>
                      <th className="text-left py-1.5 px-2 text-xs font-semibold text-gray-600 border border-gray-200">
                        Código Lote MP
                      </th>
                      <th className="text-right py-1.5 px-2 text-xs font-semibold text-gray-600 border border-gray-200">
                        Cantidad
                      </th>
                      <th className="text-left py-1.5 px-2 text-xs font-semibold text-gray-600 border border-gray-200">
                        Unidad
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumos.map((c, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="py-1.5 px-2 border border-gray-200 text-gray-800">
                          {c.materia_prima_nombre}
                        </td>
                        <td className="py-1.5 px-2 border border-gray-200 font-mono text-xs text-gray-700">
                          {c.codigo_lote_mp}
                        </td>
                        <td className="py-1.5 px-2 border border-gray-200 text-right text-gray-800">
                          {c.cantidad_consumida}
                        </td>
                        <td className="py-1.5 px-2 border border-gray-200 text-gray-600">
                          {c.unidad_medida}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Sin consumos registrados para esta orden.
                </p>
              )}
            </div>

            {/* 5. RESULTADOS ANALÍTICOS */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Resultados Analíticos
              </h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="text-left py-1.5 px-2 text-xs font-semibold text-blue-800 border border-gray-200">
                      Parámetro
                    </th>
                    <th className="text-left py-1.5 px-2 text-xs font-semibold text-blue-800 border border-gray-200">
                      Resultado
                    </th>
                    <th className="text-left py-1.5 px-2 text-xs font-semibold text-blue-800 border border-gray-200">
                      Especificación
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="py-1.5 px-2 border border-gray-200 text-gray-800">pH</td>
                    <td className="py-1.5 px-2 border border-gray-200 text-gray-800">
                      {analisis?.ph || '6.5 – 6.8 (ref.)'}
                    </td>
                    <td className="py-1.5 px-2 border border-gray-200 text-gray-600">
                      pH 6.4 – 6.9
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-1.5 px-2 border border-gray-200 text-gray-800">
                      Acidez Dornic
                    </td>
                    <td className="py-1.5 px-2 border border-gray-200 text-gray-800">
                      {analisis?.acidezDornic || '18°D (ref.)'}
                    </td>
                    <td className="py-1.5 px-2 border border-gray-200 text-gray-600">
                      14 – 22°D
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-1.5 px-2 border border-gray-200 text-gray-800">
                      Grasa (%)
                    </td>
                    <td className="py-1.5 px-2 border border-gray-200 text-gray-800">
                      {analisis?.grasa || '3.2% (ref.)'}
                    </td>
                    <td className="py-1.5 px-2 border border-gray-200 text-gray-600">
                      ≥ 3.0%
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[10px] text-gray-400 mt-2 italic">
                (*) Valores de referencia indicativos. Ver informe analítico oficial adjunto.
              </p>
            </div>

            {/* 6. PIE DE FIRMA */}
            <div className="px-6 py-5 grid grid-cols-3 gap-4">
              {[
                { titulo: 'Inspector de Calidad', sub: 'Firma y Sello' },
                { titulo: 'Supervisor de Producción', sub: 'Firma' },
                { titulo: 'Auditor SENASA', sub: 'Firma (si aplica)' },
              ].map(({ titulo, sub }) => (
                <div key={titulo} className="flex flex-col items-center text-center gap-1">
                  <div className="w-full border-b-2 border-gray-400 mb-2 h-8" />
                  <p className="text-xs font-semibold text-gray-700">{titulo}</p>
                  <p className="text-[10px] text-gray-500">{sub}</p>
                </div>
              ))}
            </div>
          </div>
          {/* ── FIN ÁREA IMPRIMIBLE ──────────────────────────────────────────── */}

          {/* 7. BOTONES (no se imprimen) */}
          <div className="no-print sticky bottom-0 bg-gray-100 border-t border-gray-200 px-6 py-3 flex items-center justify-between gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Printer size={15} />
              Imprimir / Guardar PDF
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              <X size={15} />
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
