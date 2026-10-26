const { exec } = require('child_process');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/api/stream/:channel', (req, res) => {
    const channel = req.params.channel;
    
    // Ejecuta streamlink para obtener la URL directa del m3u8
    exec(streamlink --stream-url https://kick.com/\ best, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ 
                error: 'No se pudo obtener el stream', 
                details: stderr.trim() 
            });
        }
        
        const streamUrl = stdout.trim();
        if (!streamUrl) {
            return res.status(404).json({ error: 'Canal no encontrado o apagado' });
        }

        // Redirige directamente al reproductor hacia el enlace HLS fresco
        res.redirect(streamUrl);
    });
});

app.get('/', (req, res) => {
    res.send('API Proxy de Kick funcionando correctamente.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(Servidor corriendo en puerto \);
});
