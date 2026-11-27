# Quy tắc cho Claude và mọi người sửa kho này (chị Duyên chốt 27/11/2026)

Kho này là **WEB GỐC** của chương trình Anh – Trung (lớp offline: Little Seed, Seedling 48 buổi, bài, tranh, giọng, dữ liệu). Các web khác là **NHÂN BẢN**.

1. **Một chiều: gốc → nhân bản.** Sửa nội dung ở kho này, rồi đồng bộ sang các nhân bản để chị khỏi làm lại nhiều lần. Không có chiều ngược lại: sửa ở nhân bản thì KHÔNG chép về đây. Lần đồng bộ sau KHÔNG ghi đè phần chỉnh riêng của nhân bản: công cụ trộn 3 bên, giữ các chỉnh riêng không xung đột với thay đổi ở gốc; chỗ nào cùng bị sửa ở cả hai thì giữ bản nhân bản và báo chị quyết.
2. **Nhân bản hiện có:**
   - `ces-training/anh-trung-kids-tu-hoc` (web tự học bán gói; công cụ `cong-cu/lay_bai_tu_web_offline.py`)
   - `ces-training/anh-trung-kids-cuoc-thi-7-chang` (cuộc thi mùa 3; công cụ `cuoc-thi-mua-3/cong-cu/lay_bai_tu_web_offline.py`)
   - bản sao `cuoc-thi-mua-3/` trong chính kho này (dựng bằng `cuoc-thi-mua-3/cong-cu/dung_bai_offline.py`, sinh tự động, không sửa tay)
3. **Cách đồng bộ:** sửa và đẩy kho gốc trước, rồi chạy `python3 cong-cu/dong_bo_nhan_ban.py --thu` (xem trước) và bỏ `--thu` (chép thật; clone nhân bản cạnh kho này hoặc chỉ `--tu-hoc DIR --cuoc-thi DIR`). Sau đó kiểm bằng trình duyệt (cỡ máy tính và điện thoại, không lỗi JS, không tệp 404) rồi commit và đẩy `main` từng nhân bản, báo chị kết quả. Chị Duyên đã cho phép đẩy thẳng `main` các nhân bản theo quy tắc này.
4. **Phần riêng của từng nhân bản** (đăng nhập, gói, hạn, máy chủ Sheet, xếp hạng, phòng đổi quà, quản trị và BẢNG ĐIỀU KHIỂN) không đồng bộ từ đây và không bao giờ bị đụng: mỗi web trong mỗi Project có bảng điều khiển riêng theo nhu cầu admin của web đó, không để chồng nhau. Danh sách nằm trong `RIENG` của `cong-cu/dong_bo_nhan_ban.py`; mỗi nhân bản có tệp `.dong-bo-goc` ghi commit gốc đã đồng bộ lần cuối (mốc để trộn).
5. Hỏi chị trước khi: xoá nhiều tệp, hoặc số tệp mã (không phải ảnh, giọng) đổi lớn bất thường ngoài lần đồng bộ chị đã duyệt.
6. Không dán khoá API, mật khẩu vào kho. Khoá Gemini chỉ qua biến môi trường.
7. Sửa hình lệch nghĩa ở cảnh `canh/`: dùng `seedling/cong-cu/sua_canh_2711.py` (bảng `FIX`), chỉ ghi đè ảnh cùng tên.
