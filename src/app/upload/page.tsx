'use client';

import { useState, ChangeEvent } from 'react';

type OsRow = {
  planta: string;
  numeroDocumento: string;
  descripcionOs: string;
};

function parseCsv(text: string): OsRow[] {
  // Separamos por líneas
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];

  const headerLine = lines[0];

  // Detectamos separador: ; (típico Excel en español) o ,
  const delimiter = headerLine.includes(';') ? ';' : ',';

  const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase());

  const idxPlanta = headers.findIndex((h) => h.startsWith('planta'));
  const idxDoc = headers.findIndex(
    (h) =>
      h.includes('n° documento') ||
      h.includes('n documento') ||
      h.includes('nro documento') ||
      h.includes('nº documento')
  );
  const idxDesc = headers.findIndex(
    (h) => h.includes('descripción o/s') || h.includes('descripcion o/s')
  );

  return lines.slice(1).map((line) => {
    const cols = line.split(delimiter);

    return {
      planta: cols[idxPlanta] ?? '',
      numeroDocumento: cols[idxDoc] ?? '',
      descripcionOs: cols[idxDesc] ?? '',
    };
  });
}

export default function UploadPage() {
  const [rows, setRows] = useState<OsRow[]>([]);
  const [search, setSearch] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const parsed = parseCsv(text);
        setRows(parsed);
      } catch (err) {
        console.error(err);
        setError('No se pudo leer el archivo. Revisa que sea un CSV válido.');
        setRows([]);
      }
    };
    reader.onerror = () => {
      setError('Error leyendo el archivo.');
      setRows([]);
    };

    reader.readAsText(file, 'UTF-8');
  };

  const filtered = rows.filter((row) =>
    row.numeroDocumento.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-4xl space-y-6">
        {/* Título */}
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">Carga de Status O/S (CSV)</h1>
          <p className="text-sm text-slate-400">
            Sube un archivo <code>status_os.csv</code> para visualizar y filtrar por número de O/S
            (columna B). Esto se usa solo en esta sesión del navegador.
          </p>
          <p className="text-xs text-slate-500">
            En producción, Vercel seguirá usando el archivo que está en{' '}
            <code>/public/status_os.csv</code>. Para actualizarlo de forma real, hay que reemplazar
            ese archivo en el proyecto y hacer deploy.
          </p>
        </header>

        {/* Selector de archivo */}
        <section className="space-y-3">
          <label className="block text-sm font-medium">
            1. Selecciona tu archivo CSV (exportado desde Excel)
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-200
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-violet-600 file:text-white
                       hover:file:bg-violet-700
                       cursor-pointer"
          />
          {fileName && (
            <p className="text-xs text-slate-400">
              Archivo cargado:&nbsp;
              <span className="font-mono">{fileName}</span> ({rows.length} filas)
            </p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </section>

        {/* Buscador */}
        <section className="space-y-2">
          <label className="block text-sm font-medium">2. Buscar O/S (columna B)</label>
          <input
            type="text"
            placeholder="Ej: 6251726"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2
                       text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </section>

        {/* Resultados */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">Resultados</h2>

          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">
              Primero sube un archivo CSV para ver los datos.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay resultados para esa O/S o no existe en el archivo cargado.
            </p>
          ) : (
            <div className="border border-slate-800 rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Planta</th>
                    <th className="px-3 py-2 text-left">N° Documento (O/S)</th>
                    <th className="px-3 py-2 text-left">Descripción O/S</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 50).map((row, idx) => (
                    <tr
                      key={`${row.numeroDocumento}-${idx}`}
                      className={idx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900'}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">{row.planta}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">
                        {row.numeroDocumento}
                      </td>
                      <td className="px-3 py-2">{row.descripcionOs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 50 && (
                <p className="text-[11px] text-slate-500 px-3 py-2">
                  Mostrando 50 primeras filas de {filtered.length} resultados.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
