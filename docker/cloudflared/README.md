# Cloudflare Tunnel — Dev test setup

Mục tiêu: expose stack local (frontend Vite + backend NestJS + ml_service) ra
internet qua `https://www.teamnghiencuu.id.vn` để test web.

## Kiến trúc

```
Browser
   │  https://www.teamnghiencuu.id.vn
   ▼
Cloudflare Edge ── Tunnel ──► cloudflared (máy bạn)
                                 │
                                 ▼
                        Vite dev server :5173  (gateway)
                            ├── /            → React app
                            ├── /api/*       → NestJS :3000  (strip /api)
                            ├── /uploads/*   → NestJS :3000
                            ├── /audio/*     → NestJS :3000
                            └── /socket.io/* → NestJS :3000  (ws)

NestJS gọi ml_service :8000 nội bộ (không cần expose).
```

## 1. Cấu hình Public Hostname trên Cloudflare Dashboard

Bạn đã tạo route:

- Hostname: `www.teamnghiencuu.id.vn`
- Service: **HTTP** `localhost:5173`

Trong **Additional application settings** của route đó:

- **TLS** → No TLS Verify: tuỳ (Vite không có TLS, không cần).
- **HTTP** → HTTP Host Header: `www.teamnghiencuu.id.vn`
- **Connection** → bật **WebSocket** (bắt buộc cho HMR + socket.io).

Nếu muốn dùng file config thay vì dashboard, xem `config.example.yml`.

## 2. Cập nhật env

### Frontend (`Ed_Vision/.env.local`) — đã tạo

```
VITE_API_BASE_URL=/api
VITE_SOCKET_BASE_URL=/
VITE_UPLOADS_BASE_URL=/
VITE_ENABLE_WEBSOCKET=true
```

### Backend (`ed_vision_backend/.env`) — thêm 2 dòng

```
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://www.teamnghiencuu.id.vn,https://teamnghiencuu.id.vn
TRUST_PROXY=true
```

(Xem mẫu trong `ed_vision_backend/.env.tunnel.example`.)

## 3. Khởi động (Windows PowerShell, mỗi lệnh 1 terminal)

```powershell
# Terminal 1 — ml_service (nếu cần AI features)
cd ml_service
.\.venv\Scripts\Activate.ps1
uvicorn XgBoots:app --host 0.0.0.0 --port 8000

# Terminal 2 — backend NestJS
cd ed_vision_backend
npm run start:dev

# Terminal 3 — frontend Vite (lắng nghe 0.0.0.0:5173)
cd Ed_Vision
npm run dev

# Terminal 4 — Cloudflared tunnel
cloudflared tunnel run 9494cb2a-f173-44dd-8a0d-503481163e74
```

Mở `https://www.teamnghiencuu.id.vn` — toàn bộ traffic (HTML, API, WS, uploads)
sẽ đi qua tunnel rồi được Vite dispatch về backend.

## 4. Troubleshooting

| Triệu chứng | Nguyên nhân & fix |
|---|---|
| `Blocked request. This host is not allowed.` | Thiếu domain trong `server.allowedHosts` của `vite.config.ts`. Đã thêm `www.teamnghiencuu.id.vn` + `.teamnghiencuu.id.vn`. |
| HMR không reload, console báo `wss://localhost:...` | `server.hmr` đã set `host=www.teamnghiencuu.id.vn`, `protocol=wss`, `clientPort=443`. Đảm bảo restart `npm run dev`. |
| `CORS error` khi gọi `/api/...` | Thường KHÔNG xảy ra vì same-origin. Nếu xảy ra → kiểm tra `CORS_ORIGINS` backend đã có domain tunnel chưa. |
| WebSocket socket.io không kết nối | Bật **WebSocket** trên Cloudflare (Network settings) + ingress route. |
| 502 Bad Gateway | cloudflared không gọi được `localhost:5173`. Check Vite đã chạy với `host: true` (đã cấu hình). |
| LiveKit không hoạt động qua tunnel | LiveKit server cần TURN/UDP riêng — KHÔNG khuyến nghị tunnel cho LiveKit. Giữ `VITE_LIVEKIT_URL=ws://localhost:7880` (chỉ test trên máy bạn). |

## 5. Quay về dev local thuần

Xoá / đổi tên `Ed_Vision/.env.local`, restart Vite. Cấu hình proxy mới vẫn
hoạt động bình thường cho `localhost:5173`.
