## Cách cài pgvector cho PostgreSQL 18 trên Windows

PostgreSQL của bạn là phiên bản 18 trên Windows. pgvector cần được cài thủ công.

### Option 1: Dùng pgvector pre-built binary (khuyên dùng)

1. Tải pgvector phù hợp với PostgreSQL 18:
   - https://github.com/pgvector/pgvector/releases
   - Tải file `vector-<version>-pg18-win64.zip`

2. Giải nén và copy vào thư mục PostgreSQL:
   ```
   copy vector.dll "C:\Program Files\PostgreSQL\18\lib\"
   copy vector.control "C:\Program Files\PostgreSQL\18\share\extension\"
   copy vector--*.sql "C:\Program Files\PostgreSQL\18\share\extension\"
   ```

3. Khởi động lại PostgreSQL service:
   ```
   net stop postgresql-x64-18
   net start postgresql-x64-18
   ```

4. Chạy setup script:
   ```
   node scripts/setup_pgvector.js
   ```

### Option 2: Dùng Docker PostgreSQL với pgvector

```yaml
# docker-compose.yml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_PASSWORD: 123456
      POSTGRES_DB: Ad_Vision
    ports:
      - "5432:5432"
```

### Tạm thời (trong khi chưa cài):

Hệ thống đã được thiết kế để hoạt động mà không cần pgvector ngay lập tức.
Embedding vectors được lưu dưới dạng JSON array trong cột `embedding_json` (Float[] thay vì vector(768)).
Tìm kiếm cosine similarity sẽ được thực hiện tại application layer (Node.js) thay vì database.
Điều này hoạt động tốt cho < 10,000 chunks. Khi scale lên, chuyển sang pgvector để tăng tốc.
