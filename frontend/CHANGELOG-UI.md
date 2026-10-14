# DrainGuard AI — Báo cáo tối ưu giao diện (UI v2)

Phạm vi: chỉ lớp giao diện (CSS, class, bố cục, nhãn hiển thị, trạng thái tải/rỗng, truy cập).
Không đổi: `services/api.ts`, `types/index.ts`, `components/analysis-map.tsx`, `query-provider.tsx`,
`package.json`, `next.config.ts`, 3 file `app/admin/{models,datasets,system}/page.tsx`
(các file này chỉ re-export trang người dùng nên tự hưởng giao diện mới).

Mức độ kiểm chứng: đã kiểm tra **cú pháp** toàn bộ file TS/TSX, **cân bằng ngoặc CSS**, và patch **áp sạch** lên bản gốc.
**Chưa** chạy `next build` / chưa xem trên trình duyệt (môi trường không có mạng để cài dependency). Xem mục "Cách kiểm thử".

---

## 1. Lỗi thật phát hiện được (có sửa) — ngoài phạm vi thuần UI, nên báo riêng

| # | Vị trí | Vấn đề | Xử lý |
|---|--------|--------|-------|
| B1 | `app/map/page.tsx` | Component đặt tên `Map` che khuất constructor `Map` toàn cục. Trong `queryFn` có `new Map<string,RecordItem>()` → gọi nhầm chính component → API môi trường (mưa/cao độ/rủi ro ngập) lỗi, và `next build` báo lỗi kiểu TS7009. | Đổi tên component thành `MapPage`. Không đổi hành vi nào khác. |
| B2 | `globals.css` (media ≤800px) | Quy tắc `th:nth-child(n+5),td:nth-child(n+5){display:none}` áp cho **mọi bảng** → trên điện thoại mất cột Blockage/Trạng thái/nút **Xóa** (Lịch sử), **Trạng thái/Thao tác: Activate, Archive** (Models), **Sửa/Xóa** (Datasets). Không thể thao tác trên mobile. | Bỏ quy tắc; thay bằng bảng dạng thẻ (`.rtable` + `data-label`) trên mobile. |

## 2. Thay đổi theo file

### `app/globals.css` (3 sửa trực tiếp + 1 khối nối thêm cuối file, đánh dấu "UI v2")
Sửa trực tiếp:
1. `--muted: #66809a → #587089` — tăng tương phản chữ phụ từ ~4.0:1 lên ~5.1:1 (đạt WCAG AA).
2. `font-family` Arial → system font stack (`system-ui, Segoe UI, Roboto…`) — nhìn hiện đại hơn, không cần tải font ngoài.
3. Xóa quy tắc ẩn cột (xem B2).

Khối nối thêm (mục A–J, không đụng CSS cũ nên dễ gỡ):
- **A. Truy cập:** skip-link, viền focus rõ (`:focus-visible`), tôn trọng `prefers-reduced-motion`.
- **B. Khung/điều hướng:** sidebar `sticky` (không cuộn mất khi trang dài; chỉ áp dụng ≥801px), logo, icon, viền trạng thái active; thanh dưới mobile có safe-area (iPhone) + icon.
- **C. Nút:** hover/active/disabled, cỡ `.sm`, biến thể `.danger`, `.light`, `.outline-light`; `<a class="button">` căn giữa đúng.
- **D. Form:** `.form-grid`, `.field` (nhãn trên ô nhập), input/select/textarea đồng bộ chiều cao 44px + focus ring, style nút chọn file.
- **E. Thông báo/trạng thái:** `.notice` có 4 biến thể (info/error/success/warn); huy hiệu có chấm màu; thêm màu cho READY/ACTIVE/INVALID/ARCHIVED; chấm trạng thái hệ thống.
- **F. Bảng:** tiêu đề cột nhỏ-in hoa, hover/selected dòng, thumbnail cố định, skeleton loading, trạng thái rỗng, bảng-thẻ trên mobile.
- **G. Trang chủ:** hero gradient, thẻ có hover + icon, bước quy trình có số.
- **H. Phân tích:** dropzone, lớp phủ "đang phân tích", thanh đo mức tắc nghẽn, viền màu theo mức độ.
- **I. Chi tiết:** lưới ảnh gốc/ảnh AI dùng `min(320px,100%)` (trước đây 320px cứng gây tràn trên màn hình hẹp).
- **J. Bản đồ:** xem mục 3.

### `app/layout.tsx`
- Thêm `viewport` (`viewportFit: 'cover'`, `themeColor`) để safe-area hoạt động trên iPhone; thêm skip-link. Giữ nguyên `metadata`, `QueryProvider`, `Navigation`.

### `components/navigation.tsx`
- Thêm icon (lucide, đã có sẵn trong dependencies), `aria-current`, `aria-label`.
- **Active đúng ở trang con** (trước: chỉ khớp tuyệt đối). `/` và `/admin` vẫn khớp chính xác để không sáng mãi.
- Mobile admin: thêm mục "Người dùng" (trước đây sidebar bị ẩn nên **không có đường quay về** từ khu admin trên điện thoại).
- Danh sách link và đường dẫn **giữ nguyên**.

### `components/ui.tsx` (file mới)
- `StatusBadge` (nhãn tiếng Việt, enum gốc ở tooltip), `ModelStatusBadge`, `noticeClass`, `TableSkeleton`, `EmptyState`.
- `noticeClass` chọn màu thông báo theo tiền tố có sẵn của message ("Đang…" = info, "Đã…" = success, "Vui lòng…" = cảnh báo, còn lại = lỗi) → **không phải đổi logic set message**.

### `app/page.tsx` (Trang chủ)
- Inline style → class; hero; thẻ có icon + hover; thẻ "Cảnh báo" hiển thị 4 mức độ bằng huy hiệu; thêm khoảng cách giữa hero và lưới thẻ (trước đó dính nhau). Nội dung chữ giữ nguyên.

### `app/analyze/page.tsx` (luồng chính — logic giữ nguyên 100%)
`getLocation`, `run`, gọi `/analyze`, xử lý lỗi **không đổi**. Chỉ:
- Kéo-thả ảnh vào dropzone (gọi lại `chooseFile`; chặn file không phải ảnh bằng thông báo).
- `URL.revokeObjectURL` ảnh xem trước cũ khi đổi ảnh (tránh rò bộ nhớ).
- Lớp phủ + spinner trên ảnh khi đang phân tích ("Đang lấy vị trí GPS…" / "AI đang phân tích ảnh…").
- Icon thay emoji; ô GPS đổi màu (xanh = có, vàng = không lấy được).
- Lỗi hiển thị dạng đỏ (`role="alert"`) thay vì xanh như thông báo thường.
- Kết quả: viền màu theo mức độ + thanh đo % tắc nghẽn; `aria-live`.

### `app/history/page.tsx`
Query, lọc, xóa **không đổi**. Chỉ:
- Bộ lọc dùng `.filter-bar`; select mức độ hiển thị nhãn tiếng Việt (giá trị gửi API vẫn là enum cũ).
- Bảng: huy hiệu thay vì chữ enum thô; ảnh thumbnail `object-fit`, `lazy`; dòng chọn được bằng bàn phím; bảng-thẻ trên mobile (sửa B2).
- Loading skeleton, trạng thái rỗng, đếm số bản ghi.
- Chọn dòng → tự cuộn tới panel chi tiết (trước đây panel nằm dưới bảng, người dùng không thấy).

### `app/datasets/page.tsx`, `app/models/page.tsx`
Mọi hàm `save/remove/upload/activate/archive/runTest` **không đổi** (ngoại lệ nhỏ ở Models bên dưới). Chỉ:
- Mỗi ô nhập có `<label>` (trước đây chỉ có placeholder → mất gợi ý khi gõ, kém accessibility); dấu `*` cho ô bắt buộc.
- Thông báo có màu theo loại; bảng-thẻ trên mobile; loading/empty state; nút có icon, cỡ nhỏ, nút Xóa/Archive màu đỏ; link Download thành nút.
- **Models — thêm state `uploading`** để vô hiệu hóa nút khi đang upload (chặn bấm đúp tạo trùng model). Đây là thay đổi state duy nhất ngoài thuần-CSS; nằm trong `try/finally` quanh đúng lời gọi API cũ.

### `app/system/page.tsx`, `app/admin/page.tsx`
- Chấm màu cho ONLINE/UNAVAILABLE/Available/YES/NO; banner "Hệ thống sẵn sàng / chưa sẵn sàng" tính từ dữ liệu `/system` đã có.
- Dashboard: huy hiệu thay enum thô; ô HIGH/CRITICAL đỏ khi > 0; nút làm mới có icon quay.
- **Đổi nhãn:** "Trạng thái hệ thống" → "Phân bố mức độ tắc nghẽn" (nhãn cũ sai nghĩa: đó là phân bố status của lượt phân tích, không phải trạng thái hệ thống).

### `app/map/page.tsx` (ngoài B1)
- Spinner khi đang tải; khi đã có dữ liệu nhưng bộ lọc không khớp → "Không có vị trí ở mức này" + nút "Hiển thị tất cả" (trước đây hiện nhầm "Chưa có vị trí"); trạng thái rỗng thật có nút tới `/analyze`.
- Lỗi hiển thị màu đỏ.

## 3. Bản đồ — chỉ CSS (mục J), `analysis-map.tsx` không đổi
- Dải môi trường (mưa/cao độ/rủi ro) chuyển từ góc phải-trên (**đè lên nút zoom MapLibre**) sang trái-trên.
- Chú giải và thẻ thống kê nâng lên 48px để **không đè thước tỉ lệ và dòng attribution** của MapLibre.
- Dòng ghi chú "Rủi ro ngập = …" chuyển xuống giữa-dưới, ẩn khi < 1280px.
- Mobile ≤900px: dải môi trường thành khối tĩnh phía trên bản đồ (không đè điều khiển); ≤560px: chú giải và thống kê xếp chồng bên trái (trước đây chồng lên nhau trên màn hình 360px).
- Chữ trong popup/overlay nâng từ 7–9px lên 10–12px; popup giới hạn 70vh và cuộn được.

## 4. Ghi nhận nhưng KHÔNG sửa (cần quyết định của bạn)
1. **`/admin/*` không có xác thực** và không có link từ khu người dùng — ai biết URL đều vào được, kể cả upload/activate/xóa model. Nếu triển khai thật cần auth ở backend + frontend.
2. `history/page.tsx` xóa bản ghi xong invalidate key `['recent']`, `['stats']` nhưng Dashboard dùng `['admin-recent']`, `['admin-stats']` → Dashboard không tự làm mới sau khi xóa.
3. Từ vựng mức độ **không thống nhất**: Phân tích/Lịch sử dùng "Có nguy cơ tắc/Tắc nhiều/Tắc nghiêm trọng", Bản đồ dùng "Theo dõi/Cảnh báo/Nguy hiểm". Nên chốt một bộ (đã gom về `statusText` trong `components/ui.tsx` để dễ đổi).
4. `window.confirm/alert` còn dùng ở Xóa/Archive — nên thay bằng hộp thoại tùy chỉnh (đụng luồng sự kiện nên chưa làm).
5. `globals.css` có nhiều khối CSS bản đồ lặp/ghi đè nhau (`.map-page`, `.map-topbar`, `.legend-zone`…). Nên dọn một lần khi có thể kiểm thử bằng mắt.
6. README ghi `http://localhost:3000` nhưng `npm run dev` chạy cổng **3001**.
7. File `.env.local` có trong bản nén — đảm bảo không commit (hiện chỉ chứa URL localhost nên không lộ bí mật).

## 5. Cách áp dụng
```bash
cd frontend
git status            # đảm bảo sạch, hoặc commit trước để dễ hoàn tác
git apply --check ui-v2.patch && git apply ui-v2.patch
# hoặc: giải nén drainguard-ui-v2.zip đè lên thư mục frontend
npm install
npm run build         # kiểm tra type + build
npm run dev           # http://localhost:3001
```
Hoàn tác: `git checkout -- .` và xóa `components/ui.tsx` (hoặc `git apply -R ui-v2.patch`).

## 6. Cách kiểm thử (đối chiếu luồng chính)
Desktop + mobile (DevTools 375px):
1. **Phân tích:** chọn ảnh → "Phân tích ảnh" → thấy lớp phủ → kết quả đúng như trước; thử kéo-thả; thử từ chối GPS (vẫn phân tích được).
2. **Bản đồ:** marker, popup, "Tra cứu địa chỉ", "Xem lịch sử"; kiểm tra không còn chồng lấn nút zoom/thước tỉ lệ; lọc mức cảnh báo; dải môi trường có số liệu (nhờ B1).
3. **Lịch sử:** lọc/tìm, click dòng → cuộn tới chi tiết, Xóa; trên mobile bấm được nút Xóa.
4. **Admin → Models:** upload `.pt` (nút khóa khi đang upload), Test, Activate, Archive, Download; trên mobile bấm được các nút.
5. **Datasets:** thêm/sửa/xóa. **Hệ thống / Dashboard:** hiển thị đúng số liệu.
Nếu `npm run build` báo thiếu icon lucide (ví dụ `FlaskConical`, `Droplets`), đổi sang icon tương đương — chỉ ảnh hưởng hình thức.
