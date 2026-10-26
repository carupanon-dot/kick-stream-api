const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/api/stream/:channel', async (req, res) => {
    let rawChannel = req.params.channel;
    const channel = rawChannel.replace('https://kick.com/', '').split('?')[0].split('/')[0].trim();
    
    try {
        // Consultamos la API pública de Kick para extraer el enlace IVS vigente
        const response = await fetch(`https://kick.com/api/v1/channels/${channel}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://kick.com/'
            }
        });
        
        if (!response.ok) {
            return res.status(404).json({ error: `El canal '${channel}' no existe o está offline.` });
        }
        
        const data = await response.json();
        const playbackUrl = data && (data.playback_url || (data.livestream && data.livestream.playback_url));
        
        if (!playbackUrl) {
            return res.status(404).json({ error: `El canal '${channel}' no está transmitiendo en este momento.` });
        }

        // Descargamos el archivo .m3u8 oficial
        const m3u8Res = await fetch(playbackUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        if (!m3u8Res.ok) {
            return res.status(502).json({ error: 'No se pudo conectar con el servidor de video de Kick.' });
        }
        
        const m3u8Text = await m3u8Res.text();

        // Servimos el contenido como un HLS legítimo
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        return res.send(m3u8Text);

    } catch (error) {
        return res.status(500).json({ error: 'Error interno en el servidor proxy', details: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({ status: 'Proxy HLS de Kick Operativo' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor proxy en puerto ${PORT}`));
