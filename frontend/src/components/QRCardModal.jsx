import React, { useState } from 'react';
import Modal from './Modal';
import Badge from './Badge';
import Button from './Button';
import { QrCode, Printer, CheckCircle, Code, Copy, Snowflake } from 'lucide-react';

export const QRCardModal = ({ isOpen, onClose, lote }) => {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  if (!lote) return null;

  const payload = lote.codigo_qr_payload || {
    app: 'TrackFinal',
    lote: lote.codigo_lote_pt,
    sku: lote.producto_sku || 'N/D',
    producto: lote.producto_nombre || 'Producto Terminado',
    elaboracion: lote.fecha_elaboracion,
    vencimiento: lote.fecha_vencimiento,
    conservacion: lote.temperatura_conservacion || '4°C a 6°C',
    verificacion_url: `http://trackfinal.lacteossanantonio.com/trazabilidad/${lote.codigo_lote_pt}`,
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rótulo Oficial de Trazabilidad QR"
      subtitle={`Lote: ${lote.codigo_lote_pt} - KIT AVZ-03`}
      maxWidth="max-w-2xl"
    >
      {/* Tarjeta de Rótulo Industrial (estilo etiqueta de planta) */}
      <div className="bg-white text-slate-900 rounded-xl p-6 border-2 border-slate-300 shadow-xl print:p-0 print:border-none print:shadow-none">
        {/* Cabecera de Etiqueta */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start">
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
              R.N.E. 04003218 | SENASA N.° 1042
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase">
              LÁCTEOS SAN ANTONIO S.A.
            </h2>
            <p className="text-xs text-slate-600">
              Planta Industrial Villa María - Córdoba, Argentina
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono bg-slate-900 text-white px-2 py-1 rounded font-bold">
              KIT AVZ-03
            </span>
          </div>
        </div>

        {/* Cuerpo Principal: QR + Datos Clave */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Gráfico Simulado del Código QR */}
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-lg border border-slate-300">
            <div className="w-36 h-36 bg-white p-2 border-2 border-slate-900 rounded-lg flex flex-col items-center justify-center shadow-inner">
              <QrCode className="w-28 h-28 text-slate-900" />
            </div>
            <div className="mt-2 text-center">
              <span className="font-mono font-bold text-xs text-slate-700 block">
                {lote.codigo_lote_pt}
              </span>
              <span className="text-[10px] text-slate-500">Escaneo QR Directo</span>
            </div>
          </div>

          {/* Especificaciones del Producto Terminado */}
          <div className="md:col-span-2 space-y-2 text-sm">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Producto:</span>
              <div className="text-base font-bold text-slate-900">
                {lote.producto_nombre || 'Producto Lácteo'}
              </div>
              <div className="text-xs font-mono text-slate-600">
                SKU: {lote.producto_sku || payload.sku}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Elaboración:</span>
                <span className="font-mono font-bold text-slate-800">
                  {lote.fecha_elaboracion ? new Date(lote.fecha_elaboracion).toLocaleDateString('es-AR') : 'N/D'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block">Vencimiento:</span>
                <span className="font-mono font-bold text-rose-700">
                  {lote.fecha_vencimiento ? new Date(lote.fecha_vencimiento).toLocaleDateString('es-AR') : 'N/D'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block">Cantidad / Lote:</span>
                <span className="font-bold text-slate-800">
                  {lote.cantidad_elaborada} {lote.unidad_medida || 'Unid'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block">Conservación:</span>
                <span className="font-bold text-blue-700 flex items-center gap-1">
                  <Snowflake className="w-3 h-3 text-blue-600" />
                  {lote.temperatura_conservacion || '4°C a 6°C'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Estado:</span>
              <Badge estado={lote.estado} size="small" />
            </div>
          </div>
        </div>

        {/* Pie de Etiqueta */}
        <div className="mt-4 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono text-center">
          Verificación de Trazabilidad y Origen: {payload.verificacion_url}
        </div>
      </div>

      {/* Visor de Payload JSONB */}
      <div className="mt-4 bg-slate-950 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowJson(!showJson)}
            className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1.5"
          >
            <Code className="w-3.5 h-3.5" />
            {showJson ? 'Ocultar Estructura JSONB' : 'Inspeccionar Payload JSONB (PostgreSQL)'}
          </button>
          {showJson && (
            <button
              onClick={copyPayload}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar JSON'}
            </button>
          )}
        </div>

        {showJson && (
          <pre className="text-[11px] font-mono bg-slate-900 p-3 rounded text-emerald-400 overflow-x-auto border border-slate-800">
            {JSON.stringify(payload, null, 2)}
          </pre>
        )}
      </div>

      {/* Botonera inferior */}
      <div className="mt-6 flex justify-end gap-3 print:hidden">
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
        <Button variant="primary" icon={Printer} onClick={handlePrint}>
          Imprimir Rótulo Físico
        </Button>
      </div>
    </Modal>
  );
};

export default QRCardModal;
