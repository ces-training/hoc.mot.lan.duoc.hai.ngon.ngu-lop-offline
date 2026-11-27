# Máy chủ lớp offline 48 buổi (Little Seed + Seedling)

Một Google Sheet và một link Apps Script dùng chung cho hai web:
- `little-seed/` (mã lớp `ls`), `seedling/` (mã lớp `sd`)
- Sheet: **Lớp offline 48 buổi – Quản lý học sinh và tiến độ (Little Seed, Seedling)**, thư mục Drive "Dữ liệu web Anh - Trung" (link Sheet không ghi ở repo công khai vì Sheet chứa PIN và dữ liệu của con; chỉ chia sẻ Sheet cho người cụ thể, không bật "Bất kỳ ai có đường liên kết").

## Bật máy chủ (làm một lần, khoảng 10 phút)
1. Mở Sheet → **Tiện ích mở rộng → Apps Script**. Đặt tên dự án "Máy chủ lớp offline 48 buổi".
2. Xoá mã có sẵn trong `Code.gs`. Mở [Code.gs](https://raw.githubusercontent.com/ces-training/hoc.mot.lan.duoc.hai.ngon.ngu-lop-offline/main/apps-script/lop-offline-48/Code.gs), chọn hết (Ctrl+A), chép, dán vào. Bấm **Lưu**.
3. Ở thanh trên, chọn hàm **caiDat** → **Chạy**. Google hỏi quyền: chọn tài khoản → nếu thấy "Google chưa xác minh ứng dụng này" thì bấm **Nâng cao → Đi tới … (không an toàn) → Cho phép**.
4. **Triển khai → Tùy chọn triển khai mới** → bánh răng → **Ứng dụng web**. "Thực thi với tư cách": **Tôi**. "Người có quyền truy cập": **Bất kỳ ai**. Bấm **Triển khai**, chép link kết thúc bằng `/exec`.
5. Dán link vào dòng `const SDL_API = '';` của **cả hai** tệp `little-seed/ls-may-chu.js` và `seedling/seedling-may-chu.js` (hoặc gửi link cho Claude để gắn).
6. Kiểm tra: mở link /exec trên trình duyệt, thấy `{"ok":true,"v":2}` là máy chủ đã chạy.

Sửa mã sau này: dán mã mới → Lưu → **Triển khai → Quản lý triển khai → bút chì → Phiên bản: Phiên bản mới → Triển khai**. Link /exec giữ nguyên.

## Các tab
| Tab | Nội dung |
|---|---|
| CaiDat | PIN của từng lớp. Cô sửa PIN ngay trong ô, không cần sửa mã. |
| HocSinh | Mỗi con một dòng: lớp, mã, tên, tổng sao web, sao trong ví, số ngày web đã học, ngày học gần nhất, lần lưu tiến độ gần nhất. |
| TienDo | Bản lưu đầy đủ tiến độ của con (ngày, bước, sao, Hộp ôn, quà, huy hiệu). Không sửa tay. |
| Thuong | Từng lượt cô thưởng sao. Cột `huy` = x là đã huỷ. |
| DoiQua | Yêu cầu đổi quà thật: `cho` chờ duyệt, `da_trao` đã trao, `tu_choi` không duyệt. |
| BuoiHS | (bản 4) Mỗi bạn mỗi buổi một dòng: có mặt, tham gia, nói EN, nói ZH, bài tập, ghi chú. Trang quản trị ghi vào đây. |
| BuoiLop | (bản 4) Mỗi buổi một dòng: ngày dạy, đã dạy chưa, ghi chú buổi. |
| GhiChu | (bản 4) Nhật ký từng bạn (tiến bộ, cần hỗ trợ, phụ huynh, nề nếp). Cột `xoa` = x là đã xoá. |
| TaiNguyen | (bản 4) Link tài liệu riêng của lớp (Drive, Sheet, Zalo…), chỉ hiện sau khi nhập PIN. Cô sửa ngay trong Sheet hoặc ở mục Tài nguyên của trang quản trị. |
| LopHoc | (bản 7) Mỗi lớp học một dòng: mã lớp, khoá (ls/sd), tên lớp, lịch học, ngày khai giảng, ghi chú. Cột `an` = x là đã xoá. Trang quản trị ghi vào đây; HocSinh có thêm cột `lop_hoc` (mã lớp của con), BuoiLop thêm cột `lh`. |

## Tiến độ không mất khi đổi máy
- Mỗi lần con làm xong một việc, web lưu trên máy và gửi bản đầy đủ lên tab TienDo (gom 5 giây/lần; khi con tắt tab cũng gửi nốt).
- Máy mới: ba mẹ mở lại link cô gửi (`…?con=MÃ`) hoặc nhập mã ở mục Ba mẹ → web lấy bài về rồi học tiếp.
- Hai máy cùng học: máy chủ giữ số phiên bản (cột `v`). Máy gửi bản cũ hơn sẽ nhận bản mới để gộp rồi gửi lại. Khi gộp, web giữ mọi ngày, bước, thẻ Hộp ôn, phiếu quà có ở bất kỳ máy nào. Sao lấy số lớn hơn của hai máy, nên nếu con học xen kẽ hai máy cùng lúc khi mất mạng thì tổng sao có thể thiếu vài sao, không mất ngày học.
- Anh chị em dùng chung một máy: mỗi con mở link của mình, web cất riêng bài của từng con.
- Bảng của cô có nút 🔗 Link cạnh tên mỗi con để chép lại link gửi ba mẹ.

## Góc vinh danh (video các bạn làm bài tốt)
- Mỗi lớp một thư mục Drive (trong "Dữ liệu web Anh - Trung"): **Video vinh danh – Little Seed 48 buổi**, **Video vinh danh – Seedling 48 buổi**. ID thư mục ghi ở tab CaiDat, cột `video_folder`.
- Cô chọn video con làm tốt, đặt tên `Tên con – tên bài.mp4` rồi thả vào thư mục. Web tự hiện video mới chậm nhất khoảng 5 phút sau (máy chủ nhớ danh sách 5 phút). Muốn chia thư mục con theo tuần cũng được (đọc một tầng thư mục con).
- Thêm mã con trong ngoặc vuông để con và ba mẹ thấy huy hiệu "Video của con": `Bông [ZTK2A7] – đọc truyện Unit 2.mp4`.
- Điền ngày khai giảng ở cột `khai_giang` (ví dụ 16/11/2026) để web đánh số Tuần 1, Tuần 2…; để trống thì web chỉ ghi khoảng ngày.
- Thứ tự theo ngày video được tải lên Drive. Ai mở web cũng xem được (thư mục để "Bất kỳ ai có đường liên kết đều xem được" thì video mới phát được). Xoá video khỏi thư mục là web bỏ video đó.
- Bố cục: màn rộng (≥1180px) có cột trái cạnh thanh nút; trong lúc làm bài và trên máy tính bảng là dải hẹp "🌟 Vinh danh", chạm để mở; điện thoại dọc có nút 🌟 nổi. Mã web: `little-seed/ls-vinh-danh.js`, `seedling/seedling-vinh-danh.js` (giống nhau), `vinh-danh.css`.
- Cập nhật máy chủ lên bản có Góc vinh danh: dán Code.gs mới → Lưu → chạy hàm **thuVideo** (Google hỏi thêm quyền đọc Drive: Cho phép) → **Triển khai → Quản lý triển khai → bút chì → Phiên bản mới → Triển khai**. Link /exec giữ nguyên. Mở link /exec thấy `"v":3` là xong.

## Trang quản trị giáo viên (bản 4)
Trang: https://anh-trung-kids-ces.github.io/hoc.mot.lan.duoc.hai.ngon.ngu/quan-tri-lop/ (mô tả ở `quan-tri-lop/README.md`). Thử trước: thêm `?demo=1`.
Nâng cấp máy chủ lên bản 4 (link /exec giữ nguyên):
1. Mở Apps Script của Sheet, dán toàn bộ `Code.gs` mới (Ctrl+A rồi dán) → **Lưu**.
2. Chọn hàm **caiDatQuanTri** → **Chạy**. Hàm tạo bốn tab mới và nạp sẵn link Sheet quản lý, thư mục video vinh danh vào tab TaiNguyen (link nằm trong Sheet, không nằm trên GitHub). Lần này Google không hỏi thêm quyền.
3. **Triển khai → Quản lý triển khai → bút chì → Phiên bản: Phiên bản mới → Triển khai.**
4. Mở link /exec thấy `"v":4` là xong. Cột `trang_thai` tự thêm vào tab HocSinh khi có người dùng trang quản trị.
Các lệnh cũ của web con và Bảng của cô không đổi, nên hai web học vẫn chạy bình thường trong lúc nâng cấp.

## Giới hạn
- Ai có mã của con thì mở được tiến độ của con đó (mã 6 ký tự ngẫu nhiên). Không ghi họ tên đầy đủ hay thông tin khác của con vào web.
- Mỗi con lưu được khoảng 270.000 ký tự tiến độ (đủ cho 99 ngày web và Hộp ôn).

## Tài khoản cho các con (bản 5)

Mỗi con có **mã** (trong link `?con=MÃ`) và **PIN 4 số**. Mỗi con nhớ tối đa **2 máy** (đổi ở tab `CaiDat`, cột `max_may`, từ 1 đến 6). Máy thứ 3 hiện ở tab "Tài khoản con" của trang quản trị để cô duyệt hoặc từ chối. Nhập sai PIN 5 lần thì khoá con đó 10 phút. Con chưa có PIN vẫn học như cũ.

**Nâng lên bản 5** (không cần chạy lại `caiDatQuanTri`; các cột mới tự thêm vào tab):
1. Mở Apps Script, xoá nội dung `Code.gs` cũ, dán `Code.gs` mới, bấm Lưu.
2. Triển khai → Quản lý các lần triển khai → ✏️ → Phiên bản mới → Triển khai (link `/exec` giữ nguyên).
3. Kiểm tra: mở `…/exec?action=ping`, phải thấy `"v":5`.

**Dùng hằng ngày**
- Trang quản trị → tab **Tài khoản con** → dán danh sách tên (mỗi dòng một bạn) → Tạo tài khoản → chọn các bạn → **In thẻ** (có QR và PIN). Giao thẻ cho ba mẹ qua Zalo riêng hoặc phát ở lớp, đừng đăng lên nhóm chung.
- Con quên PIN: bấm "PIN mới" (các máy cũ bị xoá, con nhập PIN mới ở lần mở sau).
- **Bảng của con** (nút ❓ → Bảng của con, hoặc `#/bang`): con và ba mẹ cùng xem sao, chuyên cần, mức tham gia từng buổi và các **nhận xét cô chọn chia sẻ**. Không có dữ liệu bạn khác, không xếp hạng. Khi cô thêm ghi chú, ô "Chia sẻ với con và ba mẹ" bật sẵn; bỏ chọn nếu là ghi chú riêng của cô.
- Xin ba mẹ đồng ý cho con dùng web và lưu tiến độ học (nên ghi sẵn vào phiếu đăng ký).

## Đăng nhập bằng họ tên · mở Unit 1 (bản 6, 16/11/2026)

- Vào web là hiện cửa sổ đăng nhập: **Con có mã PIN** (thẻ CES) hoặc **Con chưa có PIN** (nhập họ và tên). Có nút "Học thử" cho bạn chưa muốn đăng nhập.
- Đăng nhập bằng tên: web tìm tên trong lớp (không phân biệt hoa thường, gõ không dấu vẫn tìm ra), hỏi lại "Có phải con là … không?". Chưa có thì tạo dòng mới trong tab `HocSinh`, cột `nguon` = `tu_nhap` (trang quản trị hiện nhãn **tự nhập**). Đổi máy, nhập lại đúng họ tên là lấy lại bài và sao.
- Tên trùng một bạn đã có PIN → web đòi PIN. Hai bạn trùng họ tên → web nhờ con thêm tên ở nhà (ví dụ "Nguyễn Minh An Bin").
- **Unit 1 (tuần 1–3) mở cho mọi bạn.** Từ Unit 2, con phải đăng nhập bằng **mã + PIN** do CES cấp; đăng nhập bằng tên chỉ học được Unit 1. Thông báo có hotline CES 0974.840.845.
- Bạn tự nhập tên mà cô muốn cho học tiếp: trong trang quản trị, tab **Tài khoản con**, cấp PIN cho bạn đó rồi gửi thẻ. Con nhập mã + PIN, bài đã học bằng tên đi theo con.
- Cô mở web bằng link có `?gv=1` thì không bị hỏi đăng nhập và thấy hết các ngày.

**Nâng lên bản 6** (cột `nguon` tự thêm vào tab `HocSinh`):
1. Mở Apps Script, xoá nội dung `Code.gs` cũ, dán `Code.gs` mới, bấm Lưu.
2. Triển khai → Quản lý các lần triển khai → ✏️ → Phiên bản mới → Triển khai (link `/exec` giữ nguyên).
3. Kiểm tra: mở `…/exec?action=ping`, phải thấy `"v":6`. Chưa nâng thì nút "Con chưa có PIN" báo chưa tìm được tên.


## Lớp học trong mỗi khoá (bản 7, 26/11/2026 · web lớp offline bản riêng)
- Nhiều lớp ở CES dùng chung web Little Seed hoặc Seedling. Ở trang quản trị, mục **Lớp học**: tạo lớp (tên, lịch học, ngày khai giảng), xếp các con vào lớp, chuyển con sang lớp khác (từng bạn hoặc chọn nhiều bạn một lần). Chuyển lớp không làm mất sao, tiến độ web, điểm danh.
- Ô **Lớp** trên đầu trang quản trị lọc mọi mục theo một lớp. Điểm danh, ngày dạy, ghi chú buổi và ngày khai giảng ghi riêng cho lớp đang chọn. Bảng của con hiện buổi học và khai giảng của đúng lớp con.
- Chỉ xoá được lớp không còn bạn nào. Tạo tài khoản con khi đang chọn một lớp thì các bạn mới vào luôn lớp đó.
- Cập nhật máy chủ lên bản 7: dán Code.gs mới → Lưu → chạy hàm **caiDat** (tạo tab LopHoc và các cột mới) → **Triển khai → Quản lý triển khai → ✏️ → Phiên bản: Phiên bản mới → Triển khai**. Mở link /exec?action=ping thấy `"v":7` là xong.

## Trao đổi, nhờ việc giữa giáo viên và quản lý lớp (bản 8)

- Máy chủ thêm tab **TraoDoi** (`id, lop, lh, tu, den, loai, kid, buoi, noi_dung, han, tt, tra_loi, ten, at, xong_at`); chạy `caiDat` một lần để tạo tab.
- Lệnh mới: `qt_td_them` (gửi tin hoặc nhờ việc, cần PIN khoá), `qt_td_sua` (đánh dấu xong, mở lại, xoá, trả lời). `qt_tai` trả thêm `td`.
- Trên trang quản trị, ở "Việc của tôi" của mỗi vai có thẻ **Trao đổi với giáo viên / quản lý lớp**: việc vai kia gửi mình (bấm "Đã làm xong", "Trả lời"), ô gửi tin hoặc nhờ việc (chọn con, buổi, hạn, có câu mẫu), danh sách mình đã gửi kèm trạng thái. Số việc đang chờ hiện trên tab "Việc của tôi".
- Ở thẻ "Con cần hỗ trợ", các giải pháp thuộc vai kia có nút 📌 để nhờ thẳng.
- Cập nhật: dán Code.gs mới → Lưu → chạy `caiDat` → Triển khai → Quản lý triển khai → ✏️ → Phiên bản mới → Triển khai. Mở `/exec?action=ping` thấy `"v":8` là xong.

## Học liệu gửi thêm (bản 9)

- Giáo viên vào mục **Học liệu gửi thêm**: đặt tên bài, chọn buổi, cho cả lớp hay vài bạn, cách đưa (in phát / gửi phụ huynh / cả hai), ghi chú, rồi chọn file (tối đa 10 MB) hoặc dán link.
- File được cất vào thư mục Drive **"Học liệu gửi thêm · lớp offline"**, tự tạo cạnh Sheet quản lý (trong "Dữ liệu web Anh - Trung"), chia thư mục con theo khoá → lớp học; tên file có số buổi. Mã thư mục nhớ trong Thuộc tính tập lệnh `HL_FOLDER`. Không đụng tới thư mục "Tài liệu 9 khoá học Anh - Trung".
- File lớn hơn 10 MB: trang hướng dẫn giáo viên thả vào Google Drive của mình, chia sẻ "Bất kỳ ai có đường liên kết", dán link; link được gửi cho quản lý lớp. Muốn đổi giới hạn thì sửa `HL_MAX_MB` trong Code.gs (không nên quá 20).
- Quản lý lớp thấy số bài chờ trên tab và ở "Việc của tôi"; bấm **Tải về** (tải qua máy chủ, không cần quyền vào Drive), đánh dấu **Đã in phát** / **Đã gửi phụ huynh**, có tin mẫu để chép gửi Zalo. Thẻ "Buổi tới" nhắc buổi đó có bao nhiêu bài thêm.
- "Ẩn" chỉ bỏ khỏi danh sách, file trong Drive vẫn còn.
- Cập nhật: dán Code.gs mới → Lưu → chạy `caiDat` (lần này Google có thể hỏi quyền Drive: bấm Cho phép; nhật ký in đường dẫn thư mục học liệu) → Triển khai → Quản lý triển khai → ✏️ → Phiên bản mới. `?action=ping` ra `"v":9` là xong.

## Bản 10: tài khoản nhân sự, link riêng của con, chuyển khoá, báo cáo học tập, làm lại từ đầu

**Có gì mới**
- Trang quản trị đăng nhập bằng **tên đăng nhập + mật khẩu** (nhớ 30 ngày trên máy), không dùng PIN khoá nữa. Tab **TaiKhoan** chỉ lưu mật khẩu dạng băm có muối.
  - Quản trị: thấy mọi lớp của cả Little Seed và Seedling, tạo / sửa / khoá tài khoản ở mục **Nhân sự**, giao lớp cho từng người.
  - Giáo viên, Quản lý học tập: chỉ thấy các lớp được giao; vai cố định theo tài khoản. Giáo viên không chuyển lớp, không tạo tài khoản con.
- Mỗi con một **link riêng** `.../con/?k=MÃ` (cột `ma_link`): mở là học, không cần PIN; tự mở đúng web Little Seed hay Seedling. Lộ link: bấm **Đổi link** ở mục Tài khoản con.
- **Chuyển lớp sang khoá khác** (vd. Little Seed → Seedling) ở mục Lớp học: giữ mã con, link, thú cưng, quái vật; sao trong ví thành "sao mang sang"; tiến độ khoá cũ cất ở TienDo mã `MÃ@ls`; web khoá mới học từ ngày 1.
- Web của con có ô **Báo cáo học tập** trên trang chủ: lịch 14 ngày con học web, số ngày web đã xong, bài cô giao lên web (ba mẹ tải về), từng buổi trên lớp, nhận xét cô chia sẻ.
  - Bài giao thêm: khi tải lên ở mục Học liệu gửi thêm, giữ dấu tích **🌐 Giao lên web của con** (cột `web` của HocLieu).
  - Nhận xét: chỉ nhận xét cô bật "chia sẻ" mới hiện (như trước).
- Hàm **lamLaiTuDau()**: sao lưu cả Sheet, xoá dữ liệu học tập cũ (TienDo, Thuong, DoiQua, BuoiHS, GhiChu; sao, ngày web, máy đã nhớ của từng con), tăng "phiên" để máy nào còn bản cũ tự bỏ. **Giữ** danh sách con, link, lớp, tài khoản, tài nguyên, trao đổi, học liệu.

**Cập nhật (làm theo thứ tự)**
1. Dán Code.gs mới → Lưu → chạy `caiDat` (tạo tab TaiKhoan, tạo link riêng cho các con) → Triển khai → Quản lý triển khai → ✏️ → Phiên bản mới. `?action=ping` ra `"v":10`.
2. Mở trang quản trị → bấm **"Lần đầu dùng: tạo tài khoản quản trị bằng PIN khoá"** → nhập PIN khoá (tab CaiDat), họ tên, tên đăng nhập, mật khẩu. Chỉ làm được một lần.
3. Mục **Nhân sự** → tạo tài khoản cho giáo viên, quản lý học tập, tích các lớp được giao. Thông tin đăng nhập tự chép để dán gửi riêng.
4. Trong trình soạn Apps Script chọn hàm **`lamLaiTuDau`** → Chạy (một lần). Nhật ký in link bản sao lưu.
5. Mục **Tài khoản con** → **📋 Chép link** gửi riêng từng ba mẹ, hoặc chọn các con → **In thẻ** (QR mở link riêng).
