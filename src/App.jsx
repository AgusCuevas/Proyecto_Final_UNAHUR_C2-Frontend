import { useState, useEffect } from 'react';

function App() {
  const [respuesta, setRespuesta] = useState('Esperando al backend...');

  useEffect(() => {
    // Llamamos al puerto 3000 que expusimos en el Docker del backend
    fetch('http://localhost:3000/api/ping')
      .then((res) => res.json())
      .then((data) => {
        setRespuesta(data.mensaje);
      })
      .catch((err) => {
        console.error(err);
        setRespuesta('Error de conexión con el backend 🔴');
      });
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
      <h1>GalacticApp - Prueba de Integración</h1>
      <div style={{ padding: '20px', border: '1px solid #ccc', display: 'inline-block', borderRadius: '8px' }}>
        <p>Estado del Backend:</p>
        <h2>{respuesta}</h2>
      </div>
    </div>
  );
}

export default App;