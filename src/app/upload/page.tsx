'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Row = {
  planta: string;
  os: string;
  descripcion: string;
};

function normalize(value: string) {
  return value.trim();
}

export default function UploadPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState('');
  const [csvName, setCsvName] = useState('status_os.csv');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar siempre el CSV base desde /public/status_os.csv
  useEffect(() => {
    loadFromPublic();
  }, []);

  async function loadFromPublic() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/status_os.csv', { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudo leer status_os.csv');
      const text = await res.text();
      const parsed = parseCsv(text);
      setRows(parsed);
      setCsvName('status_os.csv');
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar CSV');
    } finally {
      setLoading(false);
    }
  }

  // Lee el CSV y toma:
  //  - Columna A = Planta
  //  - Columna B = N° Documento (O/S)
  //  - Columna D = Descripción O/S
  function parseCsv(text: string): Row[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
    if (lines.length < 2) return [];

    const sep =
      lines[0].split(';').length > 1
        ? ';'
        : lines[0].split(',').length > 1
        ? ','
        : '\t';

    return lines
      .slice(1)
      .map((line) => {
        const cols = line.split(sep);
        const planta = cols[0] ?? '';
        const os = cols[1] ?? '';
        const descripcion = cols[3] ?? ''; // col D
        return {
          planta: normalize(planta),
          os: normalize(os),
          descripcion: normalize(descripcion),
        };
      })
      .filter((r) => r.os !== '');
  }

  // Permitir cambiar el CSV desde la pantalla (opcional)
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target?.result ?? '');
        const parsed = parseCsv(text);
        setRows(parsed);
        setCsvName(file.name);
      } catch (err: any) {
        setError('No se pudo leer el archivo');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        filter.trim() === ''
          ? true
          : r.os.toLowerCase().includes(filter.trim().toLowerCase())
      ),
    [rows, filter]
  );

  return (
    <div className="min-h-screen bg-[#00152A] text-[#E5F0FF] flex items-start justify-center py-10 px-3 sm:px-6">
      <div className="w-full max-w-5xl bg-[#021932] border border-[#123456] shadow-[0_0_0_1px_rgba(255,255,255,0.02)] rounded-xl overflow-hidden">
        {/* Barra superior estilo SAP */}
        <div className="bg-gradient-to-r from-[#062A4D] to-[#014A7F] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-wide">
              Consulta Status O/S
            </h1>
            <p className="text-xs sm:text-sm text-[#B2C8E6]">
              Fuente: {csvName} · Columnas Planta / N° Documento (O/S) / Descripción O/S
            </p>
          </div>
          <button
            onClick={loadFromPublic}
            className="hidden sm:inline-flex text-xs items-center gap-2 px-3 py-1.5 rounded-md border border-[#71C2FF] text-[#D9F2FF] hover:bg-[#0B355C] transition"
          >
            Recargar CSV base
          </button>
        </div>

        {/* Toolbar */}
        <div className="border-b border-[#123456] bg-[#031C3B] px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label className="text-[11px] uppercase tracking-wide text-[#9EB4D6]">
              Buscar O/S (columna B)
            </label>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Ej: 6251726"
              className="bg-[#020C1A] border border-[#22426D] rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#35B3FF] focus:border-[#35B3FF] min-w-[180px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] uppercase tracking-wide text-[#9EB4D6] hidden sm:block">
              Cambiar archivo CSV
            </label>
            <label className="inline-flex cursor-pointer items-center px-3 py-1.5 rounded-md bg-[#0B2C4A] border border-[#20466F] text-xs hover:bg-[#12385A]">
              Seleccionar archivo...
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-4 sm:px-6 py-4 bg-[#00152A]">
          {error && (
            <div className="mb-3 rounded-md border border-red-500/70 bg-red-900/30 text-xs sm:text-sm px-3 py-2">
              {error}
            </div>
          )}

          {loading && (
            <div className="mb-3 text-xs sm:text-sm text-[#B2C8E6]">
              Cargando datos, por favor espere...
            </div>
          )}

          {/* Tabla */}
          <div className="border border-[#163555] rounded-lg overflow-auto max-h-[60vh] bg-[#020F23]">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-[#052448] text-[#E5F0FF] sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold border-b border-[#163555] w-20">
                    Planta
                  </th>
                  <th className="px-3 py-2 text-left font-semibold border-b border-[#163555] w-40">
                    N° Documento (O/S)
                  </th>
                  <th className="px-3 py-2 text-left font-semibold border-b border-[#163555]">
                    Descripción O/S
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-[#9EB4D6]"
                      colSpan={3}
                    >
                      {rows.length === 0
                        ? 'No se han cargado datos desde el CSV.'
                        : 'No hay resultados para ese número de O/S.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, idx) => (
                    <tr
                      key={`${row.planta}-${row.os}-${idx}`}
                      className={idx % 2 === 0 ? 'bg-[#020F23]' : 'bg-[#03182E]'}
                    >
                      <td className="px-3 py-2 border-b border-[#102743] whitespace-nowrap">
                        {row.planta}
                      </td>
                      <td className="px-3 py-2 border-b border-[#102743] whitespace-nowrap font-medium text-[#C1E0FF]">
                        {row.os}
                      </td>
                      <td className="px-3 py-2 border-b border-[#102743]">
                        {row.descripcion}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-2 text-[10px] sm:text-xs text-[#6E84A8] flex justify-between">
            <span>Registros totales: {rows.length}</span>
            <span>Mostrando: {filtered.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
