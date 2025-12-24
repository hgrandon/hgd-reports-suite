'use client';

import { useEffect, useMemo, useState } from 'react';

type Row = string[];

// separa por espacios múltiples o tabs (formato típico export SAP)
function parseLine(line: string): string[] {
  return line.trim().split(/\s{2,}|\t+/);
}

export default function InventarioPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedCols, setSelectedCols] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadTXT() {
      try {
        setLoading(true);
        setErrorMsg('');

        const res = await fetch('/inventario.txt', { cache: 'no-store' });
        if (!res.ok) throw new Error(`No se pudo cargar inventario.txt (HTTP ${res.status})`);

        const text = await res.text();

        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trimEnd())
          .filter((l) => l.trim().length > 0);

        const parsed = lines.map(parseLine);

        const head = parsed[0] || [];
        const body = parsed.slice(1);

        setHeaders(head);
        setRows(body);

        // por defecto: primeras 6 columnas (si existen)
        setSelectedCols(head.map((_, i) => i).slice(0, Math.min(6, head.length)));
      } catch (e: any) {
        setErrorMsg(e?.message || 'Error cargando inventario');
      } finally {
        setLoading(false);
      }
    }

    loadTXT();
  }, []);

  function toggleColumn(index: number) {
    setSelectedCols((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  const selectedHeaders = useMemo(
    () => selectedCols.map((i) => headers[i]).filter(Boolean),
    [selectedCols, headers]
  );

  return (
    <main className="min-h-screen p-5 bg-[#E9EEF3] text-[#1B1F23]">
      {/* “Estilo SAP” (gris azulado + amarillo suave de selección) */}
      <div className="max-w-7xl mx-auto">
        {/* Header tipo SAP */}
        <div className="rounded-md border border-[#B7C2CC] bg-[#DDE6EE] shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-semibold tracking-tight">
                Inventario – Vista BI
              </h1>
              <p className="text-[12px] text-[#3B4A5A]">
                Selecciona columnas visibles (estilo SAP).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#3B4A5A]">
                Columnas: <b>{selectedHeaders.length}</b> / {headers.length}
              </span>
            </div>
          </div>
        </div>

        {/* Estado */}
        {loading && (
          <div className="mt-4 rounded-md border border-[#B7C2CC] bg-white px-4 py-3">
            <div className="text-[13px] text-[#3B4A5A]">Cargando inventario…</div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 rounded-md border border-[#D9A3A3] bg-[#FFF2F2] px-4 py-3">
            <div className="text-[13px] text-[#8A1F1F] font-semibold">
              Error cargando inventario
            </div>
            <div className="text-[12px] text-[#8A1F1F] mt-1">{errorMsg}</div>
          </div>
        )}

        {!loading && !errorMsg && (
          <>
            {/* Panel selector (tipo “lista” SAP) */}
            <div className="mt-4 rounded-md border border-[#B7C2CC] bg-white shadow-sm">
              <div className="px-4 py-2 border-b border-[#D0DAE4] bg-[#F3F7FB]">
                <div className="text-[13px] font-semibold text-[#2B3A49]">
                  Columnas visibles
                </div>
              </div>

              <div className="p-3 max-h-56 overflow-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {headers.map((h, i) => {
                    const checked = selectedCols.includes(i);
                    return (
                      <label
                        key={i}
                        className={[
                          'flex items-center gap-2 rounded-md border px-3 py-2 text-[12px] cursor-pointer select-none',
                          'transition-colors',
                          checked
                            ? 'bg-[#FFF2B3] border-[#D6B656] text-[#2B2B2B]' // amarillo SAP selección
                            : 'bg-white border-[#D0DAE4] hover:bg-[#F3F7FB] text-[#2B3A49]',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleColumn(i)}
                          className="accent-[#2C6EA3]"
                        />
                        <span className="truncate" title={h}>
                          {h}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tabla estilo SAP */}
            <div className="mt-4 rounded-md border border-[#B7C2CC] bg-white shadow-sm overflow-hidden">
              <div className="overflow-auto">
                <table className="w-full text-[12px] border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#DDE6EE]">
                      {selectedCols.map((i) => (
                        <th
                          key={i}
                          className="border border-[#B7C2CC] px-3 py-2 text-left whitespace-nowrap font-semibold text-[#2B3A49]"
                        >
                          {headers[i]}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={[
                          idx % 2 === 0 ? 'bg-white' : 'bg-[#F7FAFD]', // zebra suave
                          'hover:bg-[#FFF2B3]/60', // hover amarillo suave
                        ].join(' ')}
                      >
                        {selectedCols.map((i) => (
                          <td
                            key={i}
                            className="border border-[#D0DAE4] px-3 py-1.5 whitespace-nowrap text-[#1B1F23]"
                          >
                            {r[i] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
