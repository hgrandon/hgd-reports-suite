'use client';

import React from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SubirArchivoPage() {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { error } = await supabase.storage
      .from('archivos')
      .upload(`inventarios/${file.name}`, file, { upsert: true });

    if (error) {
      alert('❌ Error al subir archivo');
      console.error(error);
    } else {
      alert('✅ Archivo subido correctamente');
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Subir archivo</h1>
      <input type="file" accept=".txt,.pdf" onChange={handleUpload} />
    </main>
  );
}
