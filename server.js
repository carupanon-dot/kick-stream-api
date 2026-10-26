const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Range']
}));

app.get('/api/stream/:channel', async (req, res) => {
    const channel = req.params.channel.replace('https://kick.com/', '').replace('/', '').trim();
    
    try {
        const response = await fetch(`https://kick.com/api/v1/channels/${channel}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            return res.status(404).json({ error: 'Canal no encontrado o en diferido/offline' });
        }
        
        const data = await response.json();
        
        if (data && data.playback_url) {
            return res.json({ 
                success: true,
                channel: channel,
                playback_url: data.playback_url 
            });
        } else {
            return res.status(404).json({ error: 'Playback URL no disponible' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Error interno en el servidor proxy', details: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({ status: 'API Proxy Activa' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor activo en puerto ${PORT}`));
