import { useEffect, useRef, useState } from 'react';
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicNoneIcon from '@mui/icons-material/MicNone';

function EntradaVoz({ value, onChange, ...props }) {
  const [escuchando, establecerEscuchando] = useState(false);
  const reconocimiento = useRef(null);
  const soportado = typeof window !== 'undefined'
    && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => () => reconocimiento.current?.stop(), []);

  const alternarDictado = () => {
    if (!soportado) return;
    if (escuchando) {
      reconocimiento.current?.stop();
      establecerEscuchando(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const instancia = new SpeechRecognition();
    instancia.lang = 'es-AR';
    instancia.continuous = false;
    instancia.interimResults = false;
    instancia.onresult = (event) => {
      const texto = event.results[0][0].transcript;
      onChange({ target: { value: value ? `${value} ${texto}` : texto } });
    };
    instancia.onend = () => establecerEscuchando(false);
    instancia.onerror = () => establecerEscuchando(false);
    reconocimiento.current = instancia;
    instancia.start();
    establecerEscuchando(true);
  };

  return (
    <TextField
      {...props}
      value={value}
      onChange={onChange}
      slotProps={{
        ...props.slotProps,
        input: {
          ...props.slotProps?.input,
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={soportado ? 'Dictar texto' : 'Dictado no disponible en este navegador'}>
                <span>
                  <IconButton
                    edge="end"
                    color={escuchando ? 'error' : 'default'}
                    onClick={alternarDictado}
                    disabled={!soportado}
                    aria-label={escuchando ? 'Detener dictado' : 'Dictar texto'}
                  >
                    {escuchando ? <MicIcon /> : <MicNoneIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export default EntradaVoz;
