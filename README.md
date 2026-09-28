# DrainGuard AI

Nền tảng giám sát miệng thu nước đô thị bằng YOLO, với Model Registry, Dataset Registry, lịch sử phân tích, dashboard và API FastAPI. Giao diện chính dùng tiếng Việt và tối ưu cho desktop lẫn mobile.

## Kiến trúc

`Next.js 16 (frontend) → FastAPI (REST API + YOLO) → PostgreSQL`

Tệp ảnh gốc, ảnh annotated và tệp model được lưu cục bộ dưới `backend/uploads`, `backend/outputs`, `backend/model_storage`. Chúng không được commit Git.

## Chạy trên Ubuntu

Yêu cầu: Docker Engine + Compose plugin, Python 3.11+, Node.js 22+ và npm.

```bash
cd /home/hduc/IdeaProjects/DrainGuard-AI
docker compose up -d postgres

python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
cd backend
alembic upgrade head
uvicorn app.main:app --reload
```

Trong terminal thứ hai:

```bash
cd /home/hduc/IdeaProjects/DrainGuard-AI/frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Mở `http://localhost:3000`. API docs ở `http://localhost:8000/docs`.

## Workflow model

1. Tạo Dataset metadata tại **Datasets** (tùy chọn).
2. Vào **AI Models**, chọn tệp `.pt`, nhập tên và version, sau đó Upload & Validate.
3. Backend load thử bằng Ultralytics, đọc `task` và danh sách class thật từ model. Model lỗi được đánh dấu `INVALID`.
4. Kích hoạt model `READY`. Model active trước đó quay về `READY`, vì vậy có thể rollback chỉ bằng cách activate lại bản cũ.
5. Mở **Phân tích** để gửi ảnh thật. Không có model active sẽ nhận lỗi rõ ràng, không có dữ liệu AI giả.

Model chỉ có class `drain` trả `blockage_percent: null` và `MODEL_LIMITED`. Khi model segmentation có class `drain` và `debris`, backend tính diện tích giao nhau của mask để tính blockage thật.

## API chính

- `POST /api/analyze`
- `GET /api/records`, `GET /api/records/{id}`, `DELETE /api/records/{id}`
- `GET /api/dashboard/stats`, `/recent`, `/timeline`
- `GET/POST /api/models`; upload, validate, activate, test và download model
- `GET/POST/PUT/DELETE /api/datasets`
- `GET /api/health`, `/api/system`, `/api/system/model`

## Lưu ý GPU

Runtime tự chọn `cuda:0` khi `torch.cuda.is_available()`, nếu không sẽ dùng CPU. Trang **Hệ thống** hiển thị device và GPU. Để dùng CUDA cần cài bản PyTorch tương ứng với CUDA driver của máy theo tài liệu PyTorch.

## Khắc phục lỗi nhanh

- PostgreSQL không kết nối: kiểm tra `docker compose ps` và `DATABASE_URL` trong `backend/.env`.
- Lỗi upload model: chỉ chấp nhận `.pt`; file sẽ được load thử bằng Ultralytics và không tự kích hoạt.
- Không có kết quả phân tích: upload và activate ít nhất một model trước.
- Model chạy chậm: hạ `DEFAULT_IMGSZ` trong `backend/.env`, hoặc dùng GPU CUDA.
Lần sau khi muốn bật lại, bạn chỉ cần:
docker compose up -d postgres
Bật lại backend (source .venv/bin/activate rồi uvicorn app.main:app --reload trong thư mục backend).
Bật lại frontend (npm run dev trong thư mục frontend). (Không cần chạy lại các bước pip install hay npm install nữa).   # DrainGuard_Web
