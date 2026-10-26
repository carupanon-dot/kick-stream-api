const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/api/stream/:channel', async (req, res) => {
    let rawChannel = req.params.channel;
    const channel = rawChannel.replace('https://kick.com/', '').split('?')[0].split('/')[0].trim();
    
    try {
        // Intentamos obtener el enlace oficial de la API de Kick
        let playbackUrl = null;
        const response = await fetch(`https://kick.com/api/v1/channels/${channel}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.playback_url) {
                playbackUrl = data.playback_url;
            }
        }

        // Si la API directa falla o está bloqueada, intentamos la ruta alternativa de IVS de respaldo
        if (!playbackUrl) {
            playbackUrl = `https://ws-us.kick.com/app/v1/${channel}/index.m3u8`;
        }

        // Descargamos el contenido del .m3u8 para actuar como puente limpio
        const m3u8Res = await fetch(playbackUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        if (!m3u8Res.ok) {
            return res.status(404).json({ error: `El canal '${channel}' no está transmitiendo o la señal no está disponible.` });
        }
        
        const m3u8Text = await m3u8Res.text();

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        return res.send(m3u8Text);

    } catch (error) {
        return res.status(500).json({ error: 'Error en el puente HLS', details: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({ status: 'Puente Proxy HLS Activo' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor en puerto ${PORT}`));
