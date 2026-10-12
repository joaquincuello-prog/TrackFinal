import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import Badge from './Badge';
import Button from './Button';
import { 
  Printer, 
  CheckCircle, 
  Code, 
  Copy, 
  Snowflake, 
  Download, 
  GitBranch, 
  ExternalLink 
} from 'lucide-react';

export const QRCardModal = ({ isOpen, onClose, lote }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [generatingQR, setGeneratingQR] = useState(true);

  const payload = lote ? (lote.codigo_qr_payload || {
    app: 'TrackFinal',
    version: '1.0',
    lote: lote.codigo_lote_pt,
    sku: lote.producto_sku || lote.codigo_sku || 'N/D',
    producto: lote.producto_nombre || 'Producto Terminado',
    elaboracion: lote.fecha_elaboracion,
    vencimiento: lote.fecha_vencimiento,
    conservacion: lote.temperatura_conservacion || '4°C a 6°C',
    verificacion_url: `${window.location.origin}/trazabilidad?lote=${lote.codigo_lote_pt}`,
  }) : null;

  // Generar código QR real
  useEffect(() => {
    if (!lote || !payload) return;

    let isMounted = true;
    setGeneratingQR(true);

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    QRCode.toDataURL(payloadString, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#090d16',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setGeneratingQR(false);
        }
      })
      .catch((err) => {
        console.error('Error generando QR:', err);
        if (isMounted) setGeneratingQR(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lote]);

  if (!lote || !payload) return null;

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-${lote.codigo_lote_pt}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const irAGenealogia = () => {
    onClose();
    navigate(`/trazabilidad?lote=${lote.codigo_lote_pt}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rótulo Oficial de Trazabilidad QR"
      subtitle={`Lote: ${lote.codigo_lote_pt} — KIT AVZ-03`}
      maxWidth="max-w-2xl"
    >
      {/* Tarjeta de Rótulo Industrial (estilo etiqueta de planta) */}
      <div className="bg-white text-slate-900 rounded-xl p-6 border-2 border-slate-300 shadow-xl print:p-0 print:border-none print:shadow-none">
        {/* Cabecera de Etiqueta */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start">
          <div>
            <div className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
              R.N.E. 04003218 | SENASA N.° 1042
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-950 uppercase">
              LÁCTEOS SAN ANTONIO S.A.
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-600">
              Planta Industrial Villa María — Córdoba, Argentina
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] sm:text-xs font-mono bg-blue-900 text-blue-100 px-2 py-1 rounded font-bold border border-blue-950">
              KIT AVZ-03
            </span>
          </div>
        </div>

        {/* Cuerpo Principal: QR + Datos Clave */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Código QR Dinámico Real */}
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
            <div className="w-40 h-40 bg-white p-2 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-inner">
              {generatingQR ? (
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR ${lote.codigo_lote_pt}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-rose-500 font-mono">Error de QR</span>
              )}
            </div>
            <div className="mt-2 text-center">
              <span className="font-mono font-bold text-xs text-slate-800 block">
                {lote.codigo_lote_pt}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                QR Legible Activo
              </span>
            </div>
          </div>

          {/* Especificaciones del Producto Terminado */}
          <div className="md:col-span-2 space-y-2.5 text-sm">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Producto Terminado:</span>
              <div className="text-base font-extrabold text-slate-950">
                {lote.producto_nombre || 'Producto Lácteo'}
              </div>
              <div className="text-xs font-mono text-slate-600">
                SKU: {lote.producto_sku || lote.codigo_sku || payload.sku}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Fecha Elaboración:</span>
                <span className="font-mono font-bold text-slate-800">
                  {lote.fecha_elaboracion ? new Date(lote.fecha_elaboracion).toLocaleDateString('es-AR') : 'N/D'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Fecha Vencimiento:</span>
                <span className="font-mono font-bold text-rose-700">
                  {lote.fecha_vencimiento ? new Date(lote.fecha_vencimiento).toLocaleDateString('es-AR') : 'N/D'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Cantidad del Lote:</span>
                <span className="font-bold text-slate-900">
                  {lote.cantidad_elaborada} {lote.unidad_medida || 'Unid'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Condición Térmica:</span>
                <span className="font-bold text-blue-800 flex items-center gap-1">
                  <Snowflake className="w-3.5 h-3.5 text-blue-600" />
                  {lote.temperatura_conservacion || '4°C a 6°C'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Estado del Lote:</span>
              <Badge estado={lote.estado} size="small" />
            </div>
          </div>
        </div>

        {/* Pie de Etiqueta */}
        <div className="mt-4 pt-2.5 border-t border-slate-200 text-[10px] text-slate-500 font-mono text-center flex flex-col sm:flex-row justify-between items-center gap-1">
          <span>Verificación: {payload.verificacion_url || `Lote ${lote.codigo_lote_pt}`}</span>
          <span className="font-bold text-slate-700">Trazabilidad Nuclear — KIT AVZ-03</span>
        </div>
      </div>

      {/* Visor de Payload JSONB */}
      <div className="mt-4 bg-slate-950 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowJson(!showJson)}
            className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1.5 transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            {showJson ? 'Ocultar Payload Serializado' : 'Inspeccionar Payload JSON Serializado en QR'}
          </button>
          {showJson && (
            <button
              onClick={copyPayload}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition-colors"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar JSON'}
            </button>
          )}
        </div>

        {showJson && (
          <pre className="text-[11px] font-mono bg-slate-900 p-3 rounded-lg text-emerald-400 overflow-x-auto border border-slate-800">
            {JSON.stringify(payload, null, 2)}
          </pre>
        )}
      </div>

      {/* Botonera de Acciones */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button
          variant="secondary"
          icon={GitBranch}
          onClick={irAGenealogia}
          className="text-blue-400 hover:text-blue-300"
        >
          Ver Genealogía Completa
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={Download}
            onClick={handleDownload}
            disabled={!qrDataUrl}
          >
            Descargar PNG
          </Button>
          <Button
            variant="primary"
            icon={Printer}
            onClick={handlePrint}
          >
            Imprimir Rótulo
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QRCardModal;
