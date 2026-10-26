const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/api/stream/:channel', async (req, res) => {
    const channel = req.params.channel;
    
    try {
        const response = await fetch(`https://kick.com/api/v1/channels/${channel}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        if (!response.ok) {
            return res.status(404).json({ error: 'Canal no encontrado o apagado' });
        }
        
        const data = await response.json();
        if (data && data.playback_url) {
            return res.redirect(data.playback_url);
        } else {
            return res.status(404).json({ error: 'Playback URL no disponible para este canal' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Error al procesar la solicitud', details: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({ status: 'API Proxy de Kick funcionando correctamente' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
