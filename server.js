const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

// 1. Endpoint principal que resuelve y redirige el manifiesto HLS maestro de Kick
app.apiStreamUrl = async function(channel) {
    const response = await fetch(`https://kick.com/api/v1/channels/${channel}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data && data.playback_url ? data.playback_url : null;
};

app.get('/api/stream/:channel', async (req, res) => {
    let rawChannel = req.params.channel;
    const channel = rawChannel.replace('https://kick.com/', '').split('?')[0].split('/')[0].trim();
    
    try {
        const playbackUrl = await app.apiStreamUrl(channel);
        
        if (!playbackUrl) {
            return res.status(404).json({ error: `Canal '${channel}' offline o no disponible` });
        }

        // Descargamos el archivo .m3u8 original de Amazon IVS
        const m3u8Res = await fetch(playbackUrl);
        if (!m3u8Res.ok) throw new Error('No se pudo acceder al manifiesto de video');
        
        const m3u8Text = await m3u8Res.text();

        // Devolvemos el contenido con el tipo MIME correcto para que hls.js y la TV lo lean como HLS nativo
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        return res.send(m3u8Text);

    } catch (error) {
        return res.status(500).json({ error: 'Error en el puente proxy HLS', details: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({ status: 'Puente Proxy HLS de Kick Activo' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Puente HLS corriendo en puerto ${PORT}`));
