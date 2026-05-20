# LAGFM Mobile (Technical Docs)
> **Platform:** Android / Web | **Stack:** Capacitor + React 19

Source code for the mobile radio client.

## 🛠️ Development
- **Setup:** `npm install`
- **Dev Mode:** `npm run dev`
- **Build Web:** `npm run build`
- **Android Sync:** `npx cap sync android`
- **Local APK Build:** `cd android && ./gradlew assembleDebug`

## 📡 LLP v1.5 Protocol
The app receives telemetry via the **LAGNode Link Protocol**.
- **Port:** `3827`
- **Handshake:** `GET /ping` for session validation.
- **Stream:** WebSocket at 10Hz.

## 🛡️ Native Resilience
- **WiFi Lock:** High-performance mode to prevent telemetry jitter.
- **Foreground Service:** Keeps the app active in the background.
- **LagResiliencePlugin:** Native bridge for hardware control.

---
**By the community, for the community.**
