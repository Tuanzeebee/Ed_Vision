# Production Docker

1. Copy `.env.docker.example` to `.env.docker` and fill in real secrets.
2. Start the stack:
   `powershell -ExecutionPolicy Bypass -File .\docker\deploy-prod.ps1 -Build`
3. Scale stateless services by changing `BACKEND_REPLICAS` and `ML_REPLICAS` in `.env.docker`, then rerun the deploy script.

Notes:
- Public traffic goes through `gateway` (Nginx).
- `backend` is safe to scale with shared Redis state and a shared uploads volume on the same Docker host.
- `postgres`, `mongo`, and `redis` stay single-primary in this compose stack.
