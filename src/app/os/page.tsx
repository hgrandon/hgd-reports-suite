'use client';

import { useEffect, useState } from 'react';

type Row = string[];

// Función para probar distintos separadores (; , o tab)
function parseLine(line: string): string[] {
  const delimiters = [';', ',', '\t'];

  for (const d of delimiters) {
    const parts = line.split(d);
    if (parts.length > 1) {
      return parts.map((c) => c.replace(/^"|"$/g, '').trim());
    }
  }

  // Si no encontró ninguno, devuelve la línea completa como una sola columna
  return [line.trim()];
}

export default function OSPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadCSV() {
      try {
        const res = await fetch('/status_os.csv');
        const text = await res.text();

        const lineas = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        const data: Row[] = lineas.map(parseLine);

        console.log('Primera fila CSV:', data[0]); // 👀 revisa en consola
        setRows(data);
      } catch (err) {
        console.error('Error cargando CSV', err);
      }
    }

    loadCSV();
  }, []);

  if (!rows.length) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <h1 className="text-xl font-bold mb-4">Consulta Orden de Servicio</h1>
        <p>Cargando datos de status_os.csv…</p>
      </main>
    );
  }

  const headers = rows[0];
  const body = rows.slice(1);

  // Buscar índice de la columna "Planta" y "N° Documento"
  const idxPlanta =
    headers.findIndex((h) => h.toLowerCase().includes('planta')) ?? 0;

  const idxDoc =
    headers.findIndex((h) =>
      h.toLowerCase().includes('documento')
    ) ?? 1; // N° Documento

  // Filtrar por N° Documento (columna B)
  const filtrado = search
    ? body.filter((r) =>
        (r[idxDoc] || '').toLowerCase().includes(search.toLowerCase())
      )
    : body;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <h1 className="text-xl font-bold mb-4">Consulta Orden de Servicio</h1>

      <input
        type="text"
        placeholder="Buscar O/S (N° Documento - columna B)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-2 mb-4 w-full max-w-sm rounded-lg border border-slate-600 bg-slate-900"
      />

      {filtrado.length ? (
        <table className="w-full max-w-3xl text-left text-sm border-collapse">
          <thead className="bg-slate-800">
            <tr>
              <th className="border border-slate-700 px-3 py-2">
                {headers[idxPlanta] || 'Planta'}
              </th>
              <th className="border border-slate-700 px-3 py-2">
                {headers[idxDoc] || 'N° Documento'}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtrado.map((r, index) => (
              <tr key={index} className="hover:bg-slate-800">
                <td className="border border-slate-700 px-3 py-2">
                  {r[idxPlanta]}
                </td>
                <td className="border border-slate-700 px-3 py-2 font-semibold text-emerald-300">
                  {r[idxDoc]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay resultados o la O/S no existe.</p>
      )}
    </main>
  );
}
