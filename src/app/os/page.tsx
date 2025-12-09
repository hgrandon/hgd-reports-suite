'use client';

import { useState, useEffect } from 'react';

type Row = string[];

export default function OSPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadCSV() {
      // 👈 NUEVO NOMBRE DE ARCHIVO
      const res = await fetch('/status_os.csv');
      const text = await res.text();

      const lineas = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const data: Row[] = lineas.map((linea) =>
        // ⚠️ Si tu CSV usa COMA cambia ';' por ','
        linea.split(',').map((c) => c.replace(/^"|"$/g, '').trim())
      );

      console.log('CSV cargado:', data); // 👈 para revisar en consola
      setRows(data);
    }

    loadCSV();
  }, []);

  const headers = rows[0] || [];
  const body = rows.slice(1);

  const filtrado = search
    ? body.filter((r) => r[1]?.includes(search))
    : body;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <h1 className="text-xl font-bold mb-4">Consulta Orden de Servicio</h1>

      <input
        type="text"
        placeholder="Buscar O/S (columna B)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-2 mb-4 w-full max-w-sm rounded-lg border border-slate-600 bg-slate-900"
      />

      {filtrado.length ? (
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-800">
            <tr>
              <th className="border border-slate-700 px-3 py-2">
                {headers[0] || 'Col A'}
              </th>
              <th className="border border-slate-700 px-3 py-2">
                {headers[1] || 'Col B (O/S)'}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtrado.map((r, index) => (
              <tr key={index} className="hover:bg-slate-800">
                <td className="border border-slate-700 px-3 py-2">{r[0]}</td>
                <td className="border border-slate-700 px-3 py-2 font-semibold text-emerald-300">
                  {r[1]}
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
