'use client';

import { useEffect, useState } from 'react';

type Row = string[];

function parseLine(line: string): string[] {
  // separa por uno o más espacios o tabs (formato SAP)
  return line.trim().split(/\s{2,}|\t+/);
}

export default function InventarioPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedCols, setSelectedCols] = useState<number[]>([]);

  useEffect(() => {
    async function loadTXT() {
      const res = await fetch(
        '/02-SQ00-MM-06-REF-PLTDATA-Inventario%201.txt',
        { cache: 'no-store' }
      );
      const text = await res.text();

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const parsed = lines.map(parseLine);

      setHeaders(parsed[0]);
      setRows(parsed.slice(1));

      // por defecto: mostrar las primeras 5 columnas
      setSelectedCols(parsed[0].map((_, i) => i).slice(0, 5));
    }

    loadTXT();
  }, []);

  function toggleColumn(index: number) {
    setSelectedCols((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Inventario – Vista BI</h1>

      {/* Selector tipo combo */}
      <div className="mb-4 max-w-xl">
        <label className="block mb-1 text-sm text-slate-300">
          Columnas visibles
        </label>
        <div className="border border-slate-600 rounded-lg bg-slate-900 p-2 max-h-48 overflow-auto">
          {headers.map((h, i) => (
            <label
              key={i}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-800 px-2 py-1 rounded"
            >
              <input
                type="checkbox"
                checked={selectedCols.includes(i)}
                onChange={() => toggleColumn(i)}
              />
              {h}
            </label>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-auto border border-slate-700 rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-800 sticky top-0">
            <tr>
              {selectedCols.map((i) => (
                <th
                  key={i}
                  className="border border-slate-700 px-3 py-2 text-left whitespace-nowrap"
                >
                  {headers[i]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="hover:bg-slate-800">
                {selectedCols.map((i) => (
                  <td
                    key={i}
                    className="border border-slate-700 px-3 py-1 whitespace-nowrap"
                  >
                    {r[i]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
