import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import Button from './Button';
import { ScanLine, Keyboard, Camera, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

export const QRScannerModal = ({ isOpen, onClose, onScan }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera', 'file', 'keyboard'
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setSuccessMsg('');
      return;
    }

    if (activeTab === 'camera') {
      const timer = setTimeout(() => {
        try {
          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          const scanner = new Html5QrcodeScanner('reader', config, false);
          scannerRef.current = scanner;

          scanner.render(
            (decodedText) => {
              handleScanSuccess(decodedText);
              try {
                scanner.clear();
              } catch (e) {}
            },
            (scanError) => {
              // Ignorar errores continuos de búsqueda de frame
            }
          );
        } catch (err) {
          console.warn('No se pudo inicializar la cámara webRTC:', err);
          setError('No se pudo acceder a la cámara en vivo. Si estás en celular por HTTP, usá la pestaña "Foto / Archivo" o "Teclado / USB".');
        }
      }, 150);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          try {
            scannerRef.current.clear().catch(console.warn);
          } catch (e) {}
        }
      };
    }
  }, [isOpen, activeTab]);

  const processQrPayload = (raw) => {
    if (!raw) return '';
    let text = String(raw).trim();

    // 1. Intentar JSON parse (formato nativo TrackFinal)
    try {
      const payload = JSON.parse(text);
      if (payload.lote) return String(payload.lote).trim();
      if (payload.codigo_lote_pt) return String(payload.codigo_lote_pt).trim();
      if (payload.lote_mp) return String(payload.lote_mp).trim();
      if (payload.codigo_lote_mp) return String(payload.codigo_lote_mp).trim();
      if (payload.codigo) return String(payload.codigo).trim();
    } catch {
      // Continuar si no es JSON
    }

    // 2. Extraer de URL si contiene parámetro ?lote= o ruta /trazabilidad/...
    const queryMatch = text.match(/[?&]lote=([^&#\s]+)/i);
    if (queryMatch) {
      return decodeURIComponent(queryMatch[1]).trim();
    }
    const pathMatch = text.match(/\/trazabilidad\/([^/?&#\s]+)/i);
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1]).trim();
    }

    // 3. Limpiar comillas o saltos de línea
    text = text.replace(/^["']|["']$/g, '').trim();

    return text;
  };

  const handleScanSuccess = (decodedText) => {
    const loteId = processQrPayload(decodedText);
    
    if (loteId) {
      setError('');
      setSuccessMsg(`¡Código detectado: ${loteId}!`);
      setTimeout(() => {
        onClose();
        if (onScan) {
          onScan(loteId);
        } else {
          navigate(`/trazabilidad?lote=${encodeURIComponent(loteId)}`);
        }
      }, 500);
    } else {
      setError('Formato de código QR no reconocido.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setError('');
    setSuccessMsg('Analizando imagen...');
    try {
      const html5QrCode = new Html5Qrcode('file-scanner-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err) {
      setError('No se detectó ningún código QR legible en la imagen seleccionada.');
      setSuccessMsg('');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScanSuccess(manualInput.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Escáner Inteligente de Planta"
      subtitle="Escanee Rótulos QR de Producto Terminado o Materia Prima"
      maxWidth="max-w-md"
    >
      <div id="file-scanner-temp" style={{ display: 'none' }}></div>

      <div className="bg-slate-900 rounded-xl p-1 mb-4 grid grid-cols-3 gap-1 border border-slate-800">
        <button
          onClick={() => setActiveTab('camera')}
          className={`py-2 px-1 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'camera'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Camera className="w-3.5 h-3.5" /> Cámara
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`py-2 px-1 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'file'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Foto / Móvil
        </button>
        <button
          onClick={() => setActiveTab('keyboard')}
          className={`py-2 px-1 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'keyboard'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" /> Pistola / USB
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-rose-950/40 border border-rose-800/50 rounded-lg p-3 flex items-start gap-2 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 bg-emerald-950/40 border border-emerald-800/50 rounded-lg p-3 flex items-center gap-2 text-emerald-400 text-xs font-bold animate-pulse">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {activeTab === 'camera' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-2 overflow-hidden">
          <div id="reader" className="w-full text-slate-300"></div>
          <p className="text-center text-xs text-slate-500 mt-2 pb-1">
            Apunte la cámara al código QR. La lectura es automática.
          </p>
        </div>
      )}

      {activeTab === 'file' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-indigo-950/50 border border-indigo-700/50 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200">Tomar foto o subir imagen de Rótulo QR</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Recomendado para celulares en red WiFi/HTTP donde el navegador bloquea la cámara web en vivo.
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="primary"
            icon={Camera}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="w-full"
          >
            Abrir Cámara o Galería del Celular
          </Button>
        </div>
      )}

      {activeTab === 'keyboard' && (
        <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Ingreso Lector USB / Pistola Láser / Teclado
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <ScanLine className="w-5 h-5" />
              </div>
              <input
                type="text"
                autoFocus
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Escanee o tipee el lote (ej: LPT-2026-001 o LMP-...)"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-colors font-mono text-sm"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Al disparar la pistola de código de barras USB, se cargará y enviará automáticamente.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary">
              Procesar Código
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default QRScannerModal;
