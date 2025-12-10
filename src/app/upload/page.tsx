'use client';

import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';

type StatusRow = {
  Planta?: string;
  'N° Documento O/S'?: string;    // ajusta el nombre EXACTO de la columna
  'N° Documento (O/S)'?: string;  // deja las dos por si cambia el título
  'Descripción O/S'?: string;
};

export default function UploadPage() {
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [searchOs, setSearchOs] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) Cargar CSV automáticamente desde nuestra API (que a su vez va a OneDrive)
  useEffect(() => {
    const loadCsv = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/status-os');
        if (!res.ok) {
          throw new Error('No se pudo descargar el CSV desde la API');
        }

        const text = await res.text();

        const parsed = Papa.parse<StatusRow>(text, {
          header: true,
          skipEmptyLines: true,
        });

        if (parsed.errors.length > 0) {
          console.warn('Errores al parsear CSV:', parsed.errors);
        }

        setRows(parsed.data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    loadCsv();
  }, []);

  // 2) Filtrar por número de O/S (columna B)
  const filteredRows = useMemo(() => {
    if (!searchOs.trim()) return rows;

    const query = searchOs.trim().toLowerCase();

    return rows.filter((row) => {
      const osNumber =
        row['N° Documento (O/S)'] ??
        row['N° Documento O/S'] ??
        '';

      return String(osNumber).toLowerCase().includes(query);
    });
  }, [rows, searchOs]);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-6xl">
        {/* Título estilo SAP simple */}
        <header className="mb-6 border-b border-slate-700 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Carga de Status O/S (CSV) – Vista KMC
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Datos tomados automáticamente desde OneDrive (archivo{' '}
            <code>status_os.csv</code>).
          </p>
        </header>

        {/* Buscador */}
        <section className="mb-4">
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Buscar O/S (columna B)
          </label>
          <input
            type="text"
            value={searchOs}
            onChange={(e) => setSearchOs(e.target.value)}
            placeholder="Ej: 6251726"
            className="w-full max-w-md rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
          <p className="mt-1 text-xs text-slate-400">
            Se filtra por el número de documento O/S (columna B del Excel).
          </p>
        </section>

        {/* Estados */}
        {loading && (
          <div className="mt-6 text-sm text-slate-300">
            Cargando datos desde OneDrive…
          </div>
        )}

        {error && !loading && (
          <div className="mt-4 rounded border border-red-500 bg-red-900/20 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Tabla de resultados estilo SAP sencillo */}
        {!loading && !error && (
          <section className="mt-4 border border-slate-700 rounded-md overflow-hidden">
            <div className="bg-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              Resultados ({filteredRows.length.toLocaleString('es-CL')} filas)
            </div>
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-slate-700">
                      Planta
                    </th>
                    <th className="px-3 py-2 text-left border-b border-slate-700">
                      N° Documento O/S
                    </th>
                    <th className="px-3 py-2 text-left border-b border-slate-700">
                      Descripción O/S
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-4 text-center text-slate-400"
                      >
                        No hay resultados o la O/S no existe.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <tr
                        key={`${row.Planta}-${row['N° Documento (O/S)']}-${idx}`}
                        className={
                          idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/60'
                        }
                      >
                        <td className="px-3 py-2 border-b border-slate-800">
                          {row.Planta ?? ''}
                        </td>
                        <td className="px-3 py-2 border-b border-slate-800">
                          {row['N° Documento (O/S)'] ??
                            row['N° Documento O/S'] ??
                            ''}
                        </td>
                        <td className="px-3 py-2 border-b border-slate-800">
                          {row['Descripción O/S'] ?? ''}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
