const http = require('http');
const WebSocket = require('ws');

const PORT = 3827;

// 1. Crear Servidor HTTP para el Handshake (PLP v1.1)
const server = http.createServer((req, res) => {
  if (req.url === '/ping') {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' 
    });
    res.end(JSON.stringify({
      status: 'ok',
      version: '1.5.0',
      pcName: 'LINUX-MOCK-SERVER',
      sessionId: 'MOCK_SESSION_' + Date.now()
    }));
    console.log('📥 Handshake recibido!');
  } else {
    res.writeHead(404);
    res.end();
  }
});

// 2. Crear Servidor WebSocket para la Telemetría
const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('🚀 App Conectada! Enviando telemetría...');
  
  let frame = 0;
  const interval = setInterval(() => {
    frame++;
    const speed = 80 + Math.sin(frame * 0.1) * 20;
    
    const payload = {
      sessionId: 'MOCK_SESSION_ACTIVE',
      game: { gameName: "MOCK-LINUX", connected: true, time: "18:30" },
      truck: {
        speed: speed,
        rpm: 1200 + Math.sin(frame * 0.2) * 400,
        gear: "12",
        fuel: 0.85 + Math.sin(frame * 0.05) * 0.1,
        avgConsumption: 32.1,
        damage: speed > 95 ? 10 : 0,
        oilTemp: 90,
        airPressure: 125,
        cruiseControl: 90,
        lights: {
          blinkerLeft: (frame % 10 < 5),
          blinkerRight: false,
          beamLow: true,
          beamHigh: false,
          beacons: true,
          hazards: false
        },
        brakes: { parking: false, retarder: false, engine: false }
      },
      navigation: { remainingDistance: 450, remainingTime: 1200, speedLimit: 90 }
    };

    ws.send(JSON.stringify(payload));
  }, 100);

  ws.on('close', () => {
    console.log('🔌 App Desconectada.');
    clearInterval(interval);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ LAGNode Mock Server running on port ${PORT}`);
  console.log(`👉 Remember to run: avahi-publish-service LAGNodePC _lagnode._tcp ${PORT}`);
});
