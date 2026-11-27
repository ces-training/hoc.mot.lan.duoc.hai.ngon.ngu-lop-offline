/**
 * MÁY CHỦ LỚP OFFLINE 48 BUỔI · Little Seed + Seedling (Google Apps Script gắn với Google Sheet quản lý)
 *
 * Một Sheet, một link /exec dùng chung cho cả hai web:
 *   little-seed/ls-may-chu.js      → lop = 'ls'
 *   seedling/seedling-may-chu.js   → lop = 'sd'
 *
 * Tab trong Sheet (tự tạo nếu thiếu, chạy hàm caiDat một lần):
 *   CaiDat   : PIN của từng lớp (cô sửa thẳng trong Sheet)
 *   HocSinh  : mỗi con một dòng: lớp, mã, tên, tổng sao web, ví sao, số ngày web, lần học cuối
 *   TienDo   : bản lưu ĐẦY ĐỦ tiến độ của con (ngày đã học, Hộp ôn, sao, quà…) để con đổi máy không mất bài
 *   Thuong   : từng lượt cô thưởng sao
 *   DoiQua   : yêu cầu đổi quà thật
 *
 * Lệnh của web con (không cần PIN, chỉ cần mã con):
 *   GET  kid, hello, redeem, tai (lấy tiến độ)      POST luu (gửi tiến độ, có kiểm phiên bản)
 *   GET  video (Góc vinh danh: danh sách video trong thư mục Drive của lớp, ai cũng xem được)
 * Lệnh của Bảng của cô (cần PIN của lớp):
 *   GET  cls, award, unaward, order, addkid
 * Lệnh của Trang quản trị giáo viên (quan-tri-lop/, bản 4, cần PIN, web gọi bằng POST):
 *   qt_tai, qt_buoi, qt_gc_them, qt_gc_xoa, qt_hs, qt_lop, qt_tn_luu, qt_tn_xoa
 *   Tab mới: BuoiHS, BuoiLop, GhiChu, TaiNguyen (chạy hàm caiDatQuanTri một lần)
 * Bản 5 (tài khoản các con): PIN 4 số mỗi con (cột pin_con), nhớ tối đa max_may máy (mặc định 2), máy mới chờ cô duyệt.
 *   Phía con: dangnhap, bang (báo cáo chung con + ba mẹ). Phía cô: qt_kids_them, qt_pin, qt_may, qt_gc_chia.
 *   Con chưa có PIN: mọi thứ chạy như cũ.
 * Bản 6 (16/11/2026): con chưa có PIN đăng nhập bằng HỌ TÊN (lệnh ten). Web tìm tên trong lớp; chưa có thì tạo dòng mới
 *   (cột nguon = tu_nhap) để lưu kết quả luyện tập, đổi máy nhập lại đúng họ tên là lấy lại bài. Đăng nhập bằng tên chỉ mở Unit 1;
 *   từ Unit 2 web vẫn đòi mã + PIN do CES cấp. Con đã có PIN mà nhập tên → web hỏi PIN.
 * Bản 7 (26/11/2026, web lớp offline bản riêng): LỚP HỌC do quản trị lập trong mỗi khoá (ls/sd), nhiều lớp dùng chung một web.
 *   Tab LopHoc (id, khoa, ten, lich, khai_giang, ghi_chu, tao, an); HocSinh thêm cột lop_hoc (mã lớp học của con);
 *   BuoiLop thêm cột lh (mỗi lớp học ghi ngày dạy, ghi chú buổi riêng). Lệnh: qt_lh_luu, qt_lh_xoa, qt_chuyen.
 *   Không có lớp học nào thì mọi thứ chạy như bản 6.
 * Bản 8 (27/11/2026): TRAO ĐỔI giữa Giáo viên và Quản lý lớp. Tab TraoDoi: tin nhắn hoặc việc nhờ
 *   (tu/den = gv | ql), gắn được với một con, một buổi, hạn; trạng thái mo / xong / xoa, kèm trả lời.
 *   Lệnh: qt_td_them, qt_td_sua. qt_tai trả thêm td.
 * Bản 9 (27/11/2026): HỌC LIỆU GỬI THÊM. Giáo viên tải file (tối đa HL_MAX_MB) lên ngay trên trang quản trị; máy chủ cất vào
 *   thư mục Drive "Học liệu gửi thêm · lớp offline" (nằm cạnh Sheet này, chia thư mục con theo khoá / lớp học). File lớn hơn
 *   thì giáo viên thả vào Drive của mình rồi dán link. Tab HocLieu ghi buổi, lớp, bạn nào, cách đưa (in phát / gửi phụ huynh),
 *   quản lý lớp đánh dấu đã in phát, đã gửi. Lệnh: qt_hl_them, qt_hl_sua, qt_hl_lay (tải file qua máy chủ, cần PIN).
 *   Xoá trên trang chỉ ẩn dòng, KHÔNG xoá file trong Drive.
 * Bản 10 (27/11/2026): TÀI KHOẢN NHÂN SỰ, LINK RIÊNG CỦA CON, CHUYỂN KHOÁ, BÁO CÁO HỌC TẬP.
 *   - Trang quản trị đăng nhập bằng tên đăng nhập + mật khẩu (tab TaiKhoan; mật khẩu chỉ lưu dạng băm có muối).
 *     Vai: qt (quản trị, thấy mọi lớp, quản lý tài khoản), gv (giáo viên), ql (quản lý học tập) – gv/ql chỉ thấy lớp được giao.
 *     Tài khoản quản trị đầu tiên tạo bằng PIN khoá cũ (lệnh qt_tk_dau); sau đó PIN khoá không mở trang quản trị nữa.
 *   - Mỗi con một link riêng: .../con/?k=MÃ_LINK (cột ma_link). Mở link là vào học, không cần PIN; link tự đưa con sang
 *     đúng web Little Seed hoặc Seedling. Đổi link (qt_link) thì link cũ hết dùng.
 *   - Chuyển lớp sang khoá khác (Little Seed → Seedling): giữ mã con, link, thú cưng, quái vật; sao trong ví thành
 *     "sao mang sang"; tiến độ khoá cũ cất ở TienDo với mã "MÃ@ls"; web khoá mới bắt đầu từ ngày 1.
 *   - Báo cáo học tập trên web của con (lệnh bang): thêm bài cô giao lên web (HocLieu cột web), tải qua con_hl_lay.
 *   - Cột phien của HocSinh: hàm lamLaiTuDau() xoá dữ liệu học tập cũ, tăng phien; máy nào còn bản cũ sẽ tự bỏ.
 */

const TAB = {
  CaiDat:  ['lop', 'ten_lop', 'pin', 'ghi_chu', 'video_folder', 'khai_giang', 'max_may'],
  HocSinh: ['lop', 'id', 'ten', 'tao', 'web', 'vi', 'ngay', 'cuoi', 'luu_cuoi', 'trang_thai', 'pin_con', 'may', 'cho_may', 'nguon', 'lop_hoc', 'ma_link', 'phien', 'lich_su'],
  TienDo:  ['lop', 'id', 'v', 't', 'capnhat', 'do_dai', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6'],
  Thuong:  ['id', 'lop', 'kid', 'n', 'why', 'at', 'huy'],
  DoiQua:  ['code', 'lop', 'kid', 'ten', 'qua', 'ten_qua', 'sao', 'at', 'st', 'note'],
  /* ---- Trang quản trị giáo viên (quan-tri-lop/), bản 4 ---- */
  BuoiHS:  ['k', 'lop', 'buoi', 'kid', 'cm', 'tg', 'en', 'zh', 'bt', 'note', 'at'],   // mỗi con mỗi buổi một dòng: có mặt, tham gia, nói EN, nói ZH, bài tập (0–3)
  BuoiLop: ['k', 'lop', 'buoi', 'ngay', 'da_day', 'ghi_chu', 'at', 'lh'],             // mỗi buổi (của mỗi lớp học, cột lh) một dòng: ngày dạy, đã dạy chưa, ghi chú buổi
  GhiChu:  ['id', 'lop', 'kid', 'buoi', 'loai', 'noi_dung', 'at', 'xoa', 'chia_se'],  // nhật ký từng con; chia_se = x thì con và ba mẹ thấy trong Bảng của con
  TaiNguyen: ['id', 'lop', 'nhom', 'ten', 'url', 'ghi_chu', 'thu_tu'],                // link tài liệu của lớp (chỉ hiện sau khi nhập PIN)
  /* ---- bản 7: lớp học trong mỗi khoá ---- */
  LopHoc:  ['id', 'khoa', 'ten', 'lich', 'khai_giang', 'ghi_chu', 'tao', 'an'],       // khoa = ls / sd; an = x là đã xoá
  /* ---- bản 8: trao đổi, nhờ việc giữa GV và quản lý lớp ---- */
  TraoDoi: ['id', 'lop', 'lh', 'tu', 'den', 'loai', 'kid', 'buoi', 'noi_dung', 'han', 'tt', 'tra_loi', 'ten', 'at', 'xong_at'],
  /* ---- bản 9: học liệu gửi thêm (file trong Drive hoặc link) ---- */
  HocLieu: ['id', 'lop', 'lh', 'buoi', 'kid', 'ten', 'file', 'mime', 'co', 'url', 'file_id', 'cach', 'ghi_chu', 'tu', 'nguoi', 'at', 'phat_at', 'gui_at', 'an', 'web'],
  /* ---- bản 10: tài khoản nhân sự ---- */
  TaiKhoan: ['id', 'ten_dn', 'ho_ten', 'vai', 'lh', 'muoi', 'bam', 'khoa', 'tao', 'dn_cuoi']
};
const TK_NGAY = 30;                 // đăng nhập nhớ 30 ngày trên máy
const TK_VAI = { qt: 'Quản trị', gv: 'Giáo viên', ql: 'Quản lý học tập' };
const HL_MAX_MB = 10;                                     // file lớn hơn: giáo viên thả vào Drive rồi dán link
const HL_THU_MUC = 'Học liệu gửi thêm · lớp offline';     // thư mục tạo cạnh Sheet quản lý
const LOAI_GHI = ['tien_bo', 'ho_tro', 'phu_huynh', 'hanh_vi', 'khac'];
const LOP_MAC_DINH = [['ls', 'Little Seed offline 48 buổi'], ['sd', 'Seedling offline 48 buổi']];
const TEXT_COLS = { HocSinh: ['lop', 'id', 'ten', 'cuoi', 'pin_con', 'may', 'cho_may', 'nguon', 'lop_hoc', 'ma_link', 'lich_su'], TaiKhoan: ['id', 'ten_dn', 'lh', 'muoi', 'bam'], TienDo: ['lop', 'id', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6'], Thuong: ['id', 'lop', 'kid'],
  DoiQua: ['code', 'lop', 'kid'], CaiDat: ['lop', 'pin', 'video_folder', 'khai_giang'],
  BuoiHS: ['k', 'lop', 'kid'], BuoiLop: ['k', 'lop', 'ngay', 'lh'], GhiChu: ['id', 'lop', 'kid'], TaiNguyen: ['id', 'lop'],
  LopHoc: ['id', 'khoa', 'khai_giang'], TraoDoi: ['id', 'lop', 'lh', 'kid', 'han', 'ten'],
  HocLieu: ['id', 'lop', 'lh', 'kid', 'file_id', 'nguoi', 'file'] };
const VIDEO_CACHE_GIAY = 300;   // danh sách video nhớ 5 phút: video mới thả vào Drive hiện trên web chậm nhất ~5 phút
const CHUNK = 45000;           // một ô Google Sheet chứa tối đa 50.000 ký tự
const MAX_DATA = CHUNK * 6;    // ~270.000 ký tự tiến độ mỗi con

/* ===================== cổng vào ===================== */
function doGet(e) { return run_(() => handle_((e && e.parameter) || {})); }
function doPost(e) {
  return run_(() => {
    let q = {};
    try { q = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { return { ok: false, err: 'Dữ liệu gửi lên không đọc được' }; }
    return handle_(q);
  });
}
function run_(fn) {
  let out; const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); out = fn(); }
  catch (err) { out = { ok: false, err: String(err && err.message || err) }; }
  finally { try { lock.releaseLock(); } catch (x) {} }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function handle_(q) {
  const lop = String(q.lop || '').trim();
  const pinOk = () => { const p = pinOf_(lop); return !!p && String(q.pin || '').trim() === p; };
  /* bản 10: lệnh qt_* của trang quản trị dùng tài khoản (q.tok); lệnh cũ của Bảng của cô trên web con vẫn dùng PIN khoá */
  const isQt = /^qt_/.test(String(q.action || '')), tk = isQt ? tkTuTok_(q.tok) : null, ad = !!tk && tk.vai === 'qt';
  const lhOk = lh => !tk || ad || (!!lh && tk.lh.includes(String(lh)));
  const kidOk = k => !tk || ad || lhOk(String(k.lop_hoc || ''));
  const chi = (...v) => (tk && !v.includes(tk.vai)) ? { ok: false, err: 'Tài khoản ' + TK_VAI[tk.vai] + ' không làm được việc này' } : null;
  const needPin = () => {
    if (!isQt) return pinOk() ? null : { ok: false, err: lop ? 'Sai mã PIN' : 'Thiếu mã lớp' };
    if (!tk) return { ok: false, het: true, err: 'Phiên đăng nhập đã hết. Đăng nhập lại nhé.' };
    if (!LOP_MAC_DINH.some(x => x[0] === lop)) return { ok: false, err: 'Thiếu mã khoá' };
    return (ad || lopHoc_(lop).some(l => tk.lh.includes(l.id))) ? null : { ok: false, err: 'Tài khoản này chưa được giao lớp nào ở khoá này', khong_lop: true };
  };
  const vaiTu = v => tk && !ad ? tk.vai : (['gv', 'ql'].includes(v) ? v : 'ql');   // vai người gửi: theo tài khoản

  switch (q.action) {
    case 'ping': return { ok: true, v: 10 };

    /* ---------- bản 10: tài khoản nhân sự ---------- */
    case 'qt_dn': {   // đăng nhập: u (tên đăng nhập), p (mật khẩu)
      const u = String(q.u || '').trim().toLowerCase(), cache = CacheService.getScriptCache(), key = 'dn_' + u, sai = +cache.get(key) || 0;
      if (sai >= 6) return { ok: false, err: 'Nhập sai nhiều lần. Chờ 10 phút rồi thử lại nhé.' };
      const r = rows_('TaiKhoan').find(x => x.ten_dn === u && !truthy_(x.khoa));
      if (!r || bam_(String(q.p || ''), r.muoi) !== r.bam) { cache.put(key, String(sai + 1), 600); return { ok: false, err: 'Sai tên đăng nhập hoặc mật khẩu' }; }
      cache.remove(key); const f = find_('TaiKhoan', 'id', r.id); set_('TaiKhoan', f.row, { dn_cuoi: new Date() });
      return { ok: true, tok: tokTao_(r), toi: tkOut_(r) };
    }
    case 'qt_tk_dau': {   // tạo tài khoản quản trị đầu tiên bằng PIN khoá (chỉ khi chưa có quản trị nào)
      if (rows_('TaiKhoan').some(x => x.vai === 'qt' && !truthy_(x.khoa))) return { ok: false, err: 'Đã có tài khoản quản trị. Đăng nhập bằng tài khoản đó nhé.' };
      if (!pinOk()) return { ok: false, err: 'Sai PIN khoá' };
      const e = tkKiem_(q, true); if (e) return e;
      const o = tkMoi_(q, 'qt', []); add_('TaiKhoan', o); return { ok: true, tok: tokTao_(o), toi: tkOut_(o) };
    }
    case 'qt_tk_ds': { const bad = needTk_(tk) || chi('qt'); if (bad) return bad; return { ok: true, tk: rows_('TaiKhoan').map(tkOut_), lh_all: lhAll_() }; }
    case 'qt_tk_luu': {   // quản trị tạo / sửa tài khoản: ten_dn, ho_ten, vai, lh (mảng mã lớp), p (mật khẩu mới, bắt buộc khi tạo)
      const bad = needTk_(tk) || chi('qt'); if (bad) return bad;
      const vai = TK_VAI[q.vai] ? q.vai : 'gv', lhs = lhList_(q.lh).filter(id => rows_('LopHoc').some(l => l.id === id && !truthy_(l.an)));
      if (q.id) {
        const f = find_('TaiKhoan', 'id', q.id); if (!f) return { ok: false, err: 'Không có tài khoản này' };
        if (String(q.id) === tk.id && vai !== 'qt') return { ok: false, err: 'Không tự bỏ quyền quản trị của mình được' };
        const o = { ho_ten: String(q.ho_ten || f.obj.ho_ten).trim().slice(0, 60), vai, lh: lhs.join(',') };
        if (q.p) { if (String(q.p).length < 6) return { ok: false, err: 'Mật khẩu cần ít nhất 6 ký tự' }; o.muoi = muoi_(); o.bam = bam_(String(q.p), o.muoi); }
        set_('TaiKhoan', f.row, o); return { ok: true };
      }
      const e = tkKiem_(q, true); if (e) return e;
      const o = tkMoi_(q, vai, lhs); add_('TaiKhoan', o); return { ok: true, id: o.id };
    }
    case 'qt_tk_khoa': {   // khoá / mở tài khoản
      const bad = needTk_(tk) || chi('qt'); if (bad) return bad;
      if (String(q.id) === tk.id) return { ok: false, err: 'Không tự khoá tài khoản của mình được' };
      const f = find_('TaiKhoan', 'id', q.id); if (!f) return { ok: false, err: 'Không có tài khoản này' };
      set_('TaiKhoan', f.row, { khoa: +q.khoa ? 'x' : '' }); return { ok: true };
    }
    case 'qt_mk': {   // tự đổi mật khẩu: cu, moi
      const bad = needTk_(tk); if (bad) return bad;
      const f = find_('TaiKhoan', 'id', tk.id); if (bam_(String(q.cu || ''), f.obj.muoi) !== f.obj.bam) return { ok: false, err: 'Mật khẩu cũ chưa đúng' };
      if (String(q.moi || '').length < 6) return { ok: false, err: 'Mật khẩu mới cần ít nhất 6 ký tự' };
      const o = { muoi: muoi_() }; o.bam = bam_(String(q.moi), o.muoi); set_('TaiKhoan', f.row, o);
      return { ok: true, tok: tokTao_(Object.assign({}, f.obj, o)) };
    }
    case 'qt_link': {   // tạo / đổi link riêng cho các con (link cũ hết dùng)
      const bad = needPin() || chi('qt', 'ql'); if (bad) return bad;
      const ids = (Array.isArray(q.ids) ? q.ids : String(q.ids || '').split(',')).map(String).filter(Boolean), out = [];
      ids.forEach(id => { const k = find_('HocSinh', 'id', id); if (!k || k.obj.lop !== lop || !kidOk(k.obj)) return; const m = maLinkMoi_(); set_('HocSinh', k.row, { ma_link: m }); out.push({ id, link: m }); });
      return { ok: true, kids: out };
    }

    /* ---------- bản 10: link riêng của con ---------- */
    case 'con_link': {   // web của con mở bằng link .../con/?k=MÃ: trả mã con, khoá đang học
      const m = String(q.k || '').trim(); if (m.length < 8) return { ok: false, err: 'Link chưa đúng' };
      const k = rows_('HocSinh').find(x => x.ma_link === m); if (!k) return { ok: false, err: 'Link này không còn dùng được. Ba mẹ xin cô link mới nhé.' };
      return { ok: true, id: String(k.id), lop: k.lop, ten: k.ten, ph: +k.phien || 0 };
    }
    case 'con_hl_lay': {   // ba mẹ tải bài cô giao lên web
      const k = find_('HocSinh', 'id', q.id); if (!k) return { ok: false, err: 'Không có mã con này' };
      const g = kidGate_(q, k); if (g) return g;
      const h = rows_('HocLieu').find(r => r.id === String(q.hl)); if (!h || !hlChoCon_(h, k.obj) || !h.file_id) return { ok: false, err: 'Không có bài này' };
      const b = DriveApp.getFileById(String(h.file_id)).getBlob();
      return { ok: true, b64: Utilities.base64Encode(b.getBytes()), mime: b.getContentType(), ten: b.getName() };
    }

    /* ---------- Góc vinh danh (công khai) ---------- */
    case 'video': {
      const cfg = rows_('CaiDat').find(x => x.lop === lop); if (!cfg) return { ok: false, err: 'Thiếu mã lớp' };
      const cache = CacheService.getScriptCache(), ck = 'vd_' + lop + '_' + String(cfg.video_folder || '');
      if (q.moi !== '1') { const c = cache.get(ck); if (c) return JSON.parse(c); }
      const out = { ok: true, start: ngay_(cfg.khai_giang), items: cfg.video_folder ? videos_(String(cfg.video_folder).trim()) : [] };
      try { cache.put(ck, JSON.stringify(out), VIDEO_CACHE_GIAY); } catch (x) {}
      return out;
    }

    /* ---------- web của con ---------- */
    /* ---------- bản 5: nhập PIN ở máy mới, Bảng của con (con và ba mẹ cùng xem) ---------- */
    case 'dangnhap': {
      const k = find_('HocSinh', 'id', q.id); if (!k) return { ok: false, err: 'Không có mã con này' };
      const pin = String(k.obj.pin_con || '').trim(); if (!pin) return { ok: true, free: true };
      const dev = String(q.dev || '').slice(0, 40); if (dev.length < 8) return { ok: false, err: 'Máy này chưa có mã nhận diện. Mở lại trang rồi thử lại.' };
      const may = parseJ_(k.obj.may); if (may.some(m => m.d === dev)) return { ok: true };
      const cache = CacheService.getScriptCache(), key = 'sai_' + k.obj.id, fails = +cache.get(key) || 0;
      if (fails >= KHOA_SAI) return { ok: false, khoa: true, err: 'Nhập sai nhiều lần rồi. Chờ ' + KHOA_PHUT + ' phút nhé, hoặc nhờ cô giúp.' };
      if (String(q.pin || '').trim() !== pin) {
        cache.put(key, String(fails + 1), KHOA_PHUT * 60); const con = KHOA_SAI - fails - 1;
        return { ok: false, sai: true, con, khoa: con <= 0, err: con > 0 ? 'Chưa đúng rồi, con thử lại nhé.' : 'Nhập sai nhiều lần rồi. Chờ ' + KHOA_PHUT + ' phút nhé, hoặc nhờ cô giúp.' };
      }
      cache.remove(key);
      const m = { d: dev, at: Date.now(), ua: String(q.ua || '').slice(0, 30) };
      if (may.length < maxMay_(k.obj.lop)) { may.push(m); set_('HocSinh', k.row, { may: JSON.stringify(may), cho_may: JSON.stringify(parseJ_(k.obj.cho_may).filter(x => x.d !== dev)) }); return { ok: true, moi: true }; }
      const cho = parseJ_(k.obj.cho_may); if (!cho.some(x => x.d === dev)) { cho.push(m); set_('HocSinh', k.row, { cho_may: JSON.stringify(cho.slice(-6)) }); }
      return { ok: false, need: 'duyet', ten: k.obj.ten };
    }
    case 'ten': {   // bản 6: con chưa có PIN đăng nhập bằng họ tên (web chỉ mở Unit 1 cho kiểu đăng nhập này)
      if (!LOP_MAC_DINH.some(x => x[0] === lop)) return { ok: false, err: 'Thiếu mã lớp' };
      const ten = tenSach_(q.ten); if (ten.length < 3 || ten.split(' ').length < 2) return { ok: false, err: 'Con nhập cả họ và tên nhé, ví dụ: Nguyễn Minh An.' };
      const a = tenSo_(ten), b = boDau_(a), all = rows_('HocSinh').filter(k => k.lop === lop && k.trang_thai !== 'nghi');
      const exact = all.filter(k => tenSo_(k.ten) === a), gan = exact.length ? [] : all.filter(k => boDau_(tenSo_(k.ten)) === b);
      const tim = (exact.length ? exact : gan).slice(0, 5).map(k => ({ id: String(k.id), ten: String(k.ten), pin: !!String(k.pin_con || '').trim() }));
      if (q.tao !== '1' || exact.length || (gan.length && q.ep !== '1')) return { ok: true, tim, dung: exact.length > 0 };
      if (all.filter(k => k.nguon === 'tu_nhap').length >= 80) return { ok: false, err: 'Lớp đã có nhiều tên tự nhập. Ba mẹ liên hệ CES giúp con nhé.' };
      let id; do { id = newId_(''); } while (find_('HocSinh', 'id', id));
      add_('HocSinh', { lop, id, ten, tao: new Date(), web: 0, vi: 0, ngay: 0, cuoi: '', luu_cuoi: '', nguon: 'tu_nhap' });
      return { ok: true, moi: true, id, ten };
    }
    case 'bang': {   // báo cáo chung cho con và ba mẹ: chỉ số liệu của chính con + nhận xét cô chọn chia sẻ
      const k = find_('HocSinh', 'id', q.id); if (!k) return { ok: false, err: 'Không có mã con này' };
      const g = kidGate_(q, k); if (g) return g;
      const id = String(k.obj.id), lopK = k.obj.lop, cfg = rows_('CaiDat').find(x => x.lop === lopK) || {};
      const lh = String(k.obj.lop_hoc || ''), lhO = lh ? lopHoc_(lopK).find(x => x.id === lh) : null;   // bản 7: buổi và khai giảng theo lớp học của con
      const bl = rows_('BuoiLop').filter(r => r.lop === lopK && String(r.lh || '') === (lhO ? lh : '')), ngayBuoi = {}; bl.forEach(r => { ngayBuoi[+r.buoi] = ngay_(r.ngay); });
      return { ok: true, ten: k.obj.ten, lop: lopK, web: +k.obj.web || 0, ngay: +k.obj.ngay || 0, cuoi: String(k.obj.cuoi || ''), khai_giang: ngay_((lhO && lhO.khai_giang) || cfg.khai_giang), lop_hoc: lhO ? lhO.ten : '',
        sao_co: rows_('Thuong').filter(a => a.kid === id && a.lop === lopK && !truthy_(a.huy)).reduce((t, a) => t + (+a.n || 0), 0),
        hl: rows_('HocLieu').filter(h => hlChoCon_(h, k.obj)).reverse().slice(0, 40).map(h => ({ id: String(h.id), ten: h.ten || '', buoi: h.buoi === '' ? '' : +h.buoi, gc: h.ghi_chu || '', co_file: !!h.file_id, url: h.file_id ? '' : (h.url || ''), file: String(h.file || ''), at: +h.at || 0 })),
        da_day: bl.filter(r => truthy_(r.da_day)).map(r => +r.buoi).sort((a, b) => a - b),
        buoi: rows_('BuoiHS').filter(r => r.kid === id).map(r => { const o = hsOut_(r); delete o.note; o.ngay = ngayBuoi[o.buoi] || ''; return o; }).sort((a, b) => a.buoi - b.buoi),
        gc: rows_('GhiChu').filter(r => r.kid === id && !truthy_(r.xoa) && truthy_(r.chia_se)).reverse().slice(0, 30).map(gcOut_) };
    }

    case 'kid': {
      const k = find_('HocSinh', 'id', q.id);
      const g = k && kidGate_(q, k); if (g) return g;
      return { ok: true, kid: k ? kidOut_(k.obj) : null,
        awards: rows_('Thuong').filter(a => a.kid === String(q.id) && (!k || a.lop === k.obj.lop) && !truthy_(a.huy)).map(awardOut_),
        orders: rows_('DoiQua').filter(o => o.kid === String(q.id) && (!k || o.lop === k.obj.lop)).map(orderOut_) };
    }
    case 'hello': {
      const k = find_('HocSinh', 'id', q.id); if (!k) return { ok: false, err: 'Không có mã con này' };
      const g = kidGate_(q, k); if (g) return g;
      const lc = lechPhien_(q, k.obj); if (lc) return lc;
      set_('HocSinh', k.row, { web: +q.web || 0, vi: +q.vi || 0, ngay: +q.ngay || 0, cuoi: String(q.cuoi || '') });
      return { ok: true };
    }
    case 'redeem': {
      const k = find_('HocSinh', 'id', q.id); if (!k) return { ok: false, err: 'Không có mã con này' };
      const g = kidGate_(q, k); if (g) return g;
      const lc = lechPhien_(q, k.obj); if (lc) return lc;
      if (!find_('DoiQua', 'code', q.code)) add_('DoiQua', { code: String(q.code), lop: k.obj.lop, kid: String(q.id), ten: k.obj.ten,
        qua: q.qua || '', ten_qua: q.ten_qua || '', sao: +q.sao || 0, at: new Date(), st: 'cho', note: '' });
      return { ok: true };
    }
    case 'tai': {   // lấy bản tiến độ đầy đủ của con
      const k = find_('HocSinh', 'id', q.id); if (!k) return { ok: false, err: 'Không có mã con này' };
      const g = kidGate_(q, k); if (g) return g;
      const t = find_('TienDo', 'id', q.id);
      return { ok: true, v: t ? +t.obj.v || 0 : 0, t: t ? +t.obj.t || 0 : 0, data: t ? readData_(t.obj) : '', ph: +k.obj.phien || 0, lop: k.obj.lop };
    }
    case 'luu': {   // lưu bản tiến độ; base phải trùng phiên bản đang có, nếu không trả bản mới hơn để web gộp rồi gửi lại
      const k = find_('HocSinh', 'id', q.id); if (!k) return { ok: false, err: 'Không có mã con này' };
      const g = kidGate_(q, k); if (g) return g;
      const lc = lechPhien_(q, k.obj); if (lc) return lc;
      const data = typeof q.data === 'string' ? q.data : JSON.stringify(q.data || {});
      if (data.length > MAX_DATA) return { ok: false, err: 'Tiến độ quá lớn để lưu' };
      const t = find_('TienDo', 'id', q.id), cur = t ? +t.obj.v || 0 : 0;
      if ((+q.base || 0) !== cur) return { ok: false, xung: true, v: cur, t: t ? +t.obj.t || 0 : 0, data: t ? readData_(t.obj) : '' };
      const o = { lop: k.obj.lop, id: String(q.id), v: cur + 1, t: +q.t || Date.now(), capnhat: new Date(), do_dai: data.length };
      for (let i = 0; i < 6; i++) o['d' + (i + 1)] = data.slice(i * CHUNK, (i + 1) * CHUNK);
      if (t) set_('TienDo', t.row, o); else add_('TienDo', o);
      set_('HocSinh', k.row, { luu_cuoi: new Date() });
      return { ok: true, v: cur + 1 };
    }

    /* ---------- Bảng của cô (PIN theo lớp) ---------- */
    case 'cls': {
      const bad = needPin(); if (bad) return bad;
      const kids = rows_('HocSinh').filter(k => k.lop === lop), ids = new Set(kids.map(k => k.id));
      return { ok: true, kids: kids.map(kidOut_),
        awards: rows_('Thuong').filter(a => ids.has(a.kid)).reverse().slice(0, 300).map(awardOut_),
        orders: rows_('DoiQua').filter(o => ids.has(o.kid)).reverse().map(orderOut_) };
    }
    case 'award': {
      const bad = needPin(); if (bad) return bad;
      const ids = String(q.ids || '').split(',').filter(Boolean), mine = new Set(rows_('HocSinh').filter(k => k.lop === lop).map(k => k.id));
      let n = 0; ids.forEach(id => { if (!mine.has(id)) return; add_('Thuong', { id: newId_('A'), lop, kid: id, n: +q.n || 1, why: String(q.why || '').slice(0, 120), at: new Date(), huy: '' }); n++; });
      return { ok: true, n };
    }
    case 'unaward': {
      const bad = needPin(); if (bad) return bad;
      const a = find_('Thuong', 'id', q.aid); if (a && a.obj.lop === lop) set_('Thuong', a.row, { huy: 'x' });
      return { ok: true };
    }
    case 'order': {
      const bad = needPin(); if (bad) return bad;
      const o = find_('DoiQua', 'code', q.code); if (o && o.obj.lop === lop) set_('DoiQua', o.row, { st: String(q.st || ''), note: String(q.note || '') });
      return { ok: true };
    }
    case 'addkid': {
      const bad = needPin(); if (bad) return bad;
      const ten = String(q.ten || '').trim().slice(0, 40) || 'Bạn mới';
      let id; do { id = newId_(''); } while (find_('HocSinh', 'id', id));
      add_('HocSinh', { lop, id, ten, tao: new Date(), web: 0, vi: 0, ngay: 0, cuoi: '', luu_cuoi: '' });
      return { ok: true, id };
    }

    /* ---------- Trang quản trị giáo viên (PIN theo lớp; web gọi bằng POST để PIN không nằm trên đường link) ---------- */
    case 'qt_tai': {   // một lần tải đủ dữ liệu cho cả trang quản trị
      const bad = needPin(); if (bad) return bad;
      const cfg = rows_('CaiDat').find(x => x.lop === lop) || {};
      const kids = rows_('HocSinh').filter(k => k.lop === lop && kidOk(k)), ids = new Set(kids.map(k => k.id)), lhV = r => lhOk(String(r.lh || ''));
      return { ok: true, v: 10, toi: tkOut_(tk), lh_all: lhAll_().filter(l => lhOk(l.id)), hl_max: HL_MAX_MB, hl: rows_('HocLieu').filter(r => r.lop === lop && !truthy_(r.an) && lhV(r)).reverse().slice(0, 300).map(hlOut_),
        td: rows_('TraoDoi').filter(r => r.lop === lop && r.tt !== 'xoa' && lhV(r)).reverse().slice(0, 400).map(tdOut_), cfg: { ten_lop: cfg.ten_lop || '', khai_giang: ngay_(cfg.khai_giang) }, lh: lopHoc_(lop).filter(l => lhOk(l.id)).map(lhOut_),
        kids: kids.map(k => Object.assign(kidOut_(k), { pin: String(k.pin_con || ''), may: parseJ_(k.may), cho: parseJ_(k.cho_may), lh: String(k.lop_hoc || ''), link: String(k.ma_link || ''), lich_su: parseJ_(k.lich_su) })), max_may: maxMay_(lop),
        awards: rows_('Thuong').filter(a => ids.has(a.kid)).reverse().slice(0, 400).map(awardOut_),
        orders: rows_('DoiQua').filter(o => ids.has(o.kid)).reverse().map(orderOut_),
        hs: rows_('BuoiHS').filter(r => r.lop === lop && ids.has(r.kid)).map(hsOut_),
        bl: rows_('BuoiLop').filter(r => r.lop === lop && lhV(r)).map(blOut_),
        gc: rows_('GhiChu').filter(r => r.lop === lop && !truthy_(r.xoa) && ids.has(r.kid)).reverse().slice(0, 1500).map(gcOut_),
        tn: rows_('TaiNguyen').filter(r => r.lop === lop).sort((a, b) => (+a.thu_tu || 0) - (+b.thu_tu || 0)).map(tnOut_) };
    }
    case 'qt_buoi': {   // lưu một buổi: thông tin buổi + điểm danh/ghi nhận từng con
      const bad = needPin(); if (bad) return bad;
      const b = Math.round(+q.buoi); if (!(b >= 0 && b <= 60)) return { ok: false, err: 'Số buổi không hợp lệ' };
      const mine = new Set(rows_('HocSinh').filter(k => k.lop === lop && kidOk(k)).map(k => k.id)), now = new Date();
      const lh = String(q.lh || ''); if (lh && !lopHoc_(lop).some(x => x.id === lh)) return { ok: false, err: 'Không có lớp học này' };
      if (!lhOk(lh)) return { ok: false, err: 'Chọn lớp của mình ở ô Lớp trên đầu trang trước khi lưu buổi' };
      upsertMany_('BuoiLop', [{ k: lop + '|' + b + (lh ? '|' + lh : ''), lop, buoi: b, ngay: ngay_(q.ngay), da_day: truthy_(q.da_day) ? 1 : '', ghi_chu: String(q.ghi_chu || '').slice(0, 600), at: now, lh }]);
      let rows = q.rows; if (typeof rows === 'string') { try { rows = JSON.parse(rows); } catch (x) { rows = []; } }
      const lv = x => (x === '' || x == null) ? '' : Math.max(0, Math.min(3, Math.round(+x) || 0));
      const list = (rows || []).filter(r => mine.has(String(r.kid))).map(r => ({ k: lop + '|' + b + '|' + r.kid, lop, buoi: b, kid: String(r.kid),
        cm: ['c', 'v', 'p', 't'].includes(r.cm) ? r.cm : '', tg: lv(r.tg), en: lv(r.en), zh: lv(r.zh), bt: lv(r.bt), note: String(r.note || '').slice(0, 300), at: now }));
      upsertMany_('BuoiHS', list);
      return { ok: true, n: list.length };
    }
    case 'qt_gc_them': {
      const bad = needPin(); if (bad) return bad;
      const k = find_('HocSinh', 'id', q.kid); if (!k || k.obj.lop !== lop || !kidOk(k.obj)) return { ok: false, err: 'Không có con này trong lớp' };
      const nd = String(q.noi_dung || '').trim().slice(0, 800); if (!nd) return { ok: false, err: 'Chưa có nội dung' };
      const o = { id: newId_('N'), lop, kid: String(q.kid), buoi: q.buoi === '' || q.buoi == null ? '' : Math.round(+q.buoi), loai: LOAI_GHI.includes(q.loai) ? q.loai : 'khac', noi_dung: nd, at: new Date(), xoa: '', chia_se: (q.chia_se === '1' || q.chia_se === 1 || q.chia_se === true) ? 'x' : '' };
      add_('GhiChu', o); return { ok: true, note: gcOut_(o) };
    }
    case 'qt_gc_xoa': {
      const bad = needPin(); if (bad) return bad;
      const g = find_('GhiChu', 'id', q.id), gk = g && find_('HocSinh', 'id', g.obj.kid); if (g && g.obj.lop === lop && (!gk || kidOk(gk.obj))) set_('GhiChu', g.row, { xoa: 'x' });
      return { ok: true };
    }
    case 'qt_hs': {   // sửa tên, đánh dấu nghỉ học / đang học
      const bad = needPin() || chi('qt', 'ql'); if (bad) return bad;
      const k = find_('HocSinh', 'id', q.id); if (!k || k.obj.lop !== lop || !kidOk(k.obj)) return { ok: false, err: 'Không có con này trong lớp' };
      const o = {}; if (q.ten != null && String(q.ten).trim()) o.ten = String(q.ten).trim().slice(0, 40);
      if (q.tt != null) o.trang_thai = q.tt === 'nghi' ? 'nghi' : '';
      set_('HocSinh', k.row, o); return { ok: true };
    }
    case 'qt_lop': {   // ngày khai giảng của lớp
      const bad = needPin() || chi('qt'); if (bad) return bad;
      const c = find_('CaiDat', 'lop', lop); if (!c) return { ok: false, err: 'Thiếu mã lớp' };
      set_('CaiDat', c.row, { khai_giang: String(q.khai_giang || '') }); CacheService.getScriptCache().remove('vd_' + lop + '_' + String(c.obj.video_folder || ''));
      return { ok: true };
    }
    /* ---------- bản 5: tài khoản các con (PIN, máy, chia sẻ ghi chú) ---------- */
    case 'qt_kids_them': {   // dán danh sách tên → tạo hàng loạt, mỗi con một mã và một PIN 4 số
      const bad = needPin() || chi('qt', 'ql'); if (bad) return bad;
      if (!lhOk(String(q.lh || ''))) return { ok: false, err: 'Chọn lớp của mình để thêm các con vào' };
      let names = q.ten; if (typeof names === 'string') { try { names = JSON.parse(names); } catch (x) { names = names.split('\n'); } }
      names = (names || []).map(x => String(x).trim().slice(0, 40)).filter(Boolean).slice(0, 60);
      const have = new Set(rows_('HocSinh').map(x => x.id)), out = [];
      const lh = String(q.lh || ''); if (lh && !lopHoc_(lop).some(x => x.id === lh)) return { ok: false, err: 'Không có lớp học này' };
      names.forEach(ten => { let id; do { id = newId_(''); } while (have.has(id)); have.add(id); const pin = newPin_();
        const ml = maLinkMoi_(); add_('HocSinh', { lop, id, ten, tao: new Date(), web: 0, vi: 0, ngay: 0, cuoi: '', luu_cuoi: '', pin_con: pin, may: '', cho_may: '', lop_hoc: lh, ma_link: ml, phien: +phienHT_() || 0 }); out.push({ id, ten, pin, link: ml }); });
      return { ok: true, kids: out };
    }
    case 'qt_pin': {   // mode: moi = PIN mới (xoá hết máy đã nhớ), tat = bỏ PIN. ids: danh sách mã, hoặc tat_ca=1 cho mọi con chưa có PIN
      const bad = needPin() || chi('qt', 'ql'); if (bad) return bad;
      const mine = rows_('HocSinh').filter(x => x.lop === lop && kidOk(x)); let ids = String(q.ids || q.id || '').split(',').filter(Boolean);
      if (q.tat_ca === '1' || q.tat_ca === 1) ids = mine.filter(x => !String(x.pin_con || '').trim()).map(x => x.id);
      const out = [];
      ids.forEach(id => { const k = find_('HocSinh', 'id', id); if (!k || k.obj.lop !== lop || !kidOk(k.obj)) return;
        const pin = q.mode === 'tat' ? '' : newPin_(); set_('HocSinh', k.row, { pin_con: pin, may: '', cho_may: '' }); out.push({ id, ten: k.obj.ten, pin }); });
      return { ok: true, kids: out };
    }
    case 'qt_may': {   // act: duyet (máy chờ → máy được dùng), tu_choi (bỏ máy chờ), go (gỡ máy đã nhớ)
      const bad = needPin() || chi('qt', 'ql'); if (bad) return bad;
      const k = find_('HocSinh', 'id', q.id); if (!k || k.obj.lop !== lop || !kidOk(k.obj)) return { ok: false, err: 'Không có con này trong lớp' };
      let may = parseJ_(k.obj.may), cho = parseJ_(k.obj.cho_may); const dev = String(q.dev || '');
      if (q.act === 'duyet') { const m = cho.find(x => x.d === dev); if (m && !may.some(x => x.d === dev)) may.push(m); cho = cho.filter(x => x.d !== dev); }
      else if (q.act === 'tu_choi') cho = cho.filter(x => x.d !== dev);
      else if (q.act === 'go') may = may.filter(x => x.d !== dev);
      else return { ok: false, err: 'Lệnh không rõ' };
      set_('HocSinh', k.row, { may: JSON.stringify(may), cho_may: JSON.stringify(cho) }); return { ok: true, may, cho };
    }
    case 'qt_gc_chia': {   // bật/tắt chia sẻ một ghi chú với con và ba mẹ
      const bad = needPin(); if (bad) return bad;
      const g = find_('GhiChu', 'id', q.id), gk = g && find_('HocSinh', 'id', g.obj.kid); if (!g || g.obj.lop !== lop || (gk && !kidOk(gk.obj))) return { ok: false, err: 'Không có ghi chú này' };
      set_('GhiChu', g.row, { chia_se: (q.v === '1' || q.v === 1 || q.v === true) ? 'x' : '' }); return { ok: true };
    }

    case 'qt_tn_luu': {   // thêm hoặc sửa một link tài nguyên
      const bad = needPin() || chi('qt', 'ql'); if (bad) return bad;
      const url = String(q.url || '').trim(); if (!/^https?:\/\//i.test(url)) return { ok: false, err: 'Link phải bắt đầu bằng https://' };
      const o = { lop, nhom: String(q.nhom || 'Khác').slice(0, 40), ten: String(q.ten || url).slice(0, 100), url: url.slice(0, 600), ghi_chu: String(q.ghi_chu || '').slice(0, 200), thu_tu: +q.thu_tu || 0 };
      const cur = q.id ? find_('TaiNguyen', 'id', q.id) : null;
      if (cur && cur.obj.lop === lop) { set_('TaiNguyen', cur.row, o); return { ok: true, id: String(q.id) }; }
      o.id = newId_('T'); add_('TaiNguyen', o); return { ok: true, id: o.id };
    }
    case 'qt_tn_xoa': {
      const bad = needPin() || chi('qt', 'ql'); if (bad) return bad;
      const t = find_('TaiNguyen', 'id', q.id); if (t && t.obj.lop === lop) sh_('TaiNguyen').deleteRow(t.row);
      return { ok: true };
    }

    /* ---------- bản 7: lớp học trong khoá ---------- */
    case 'qt_lh_luu': {   // tạo lớp mới hoặc sửa tên, lịch, ngày khai giảng, ghi chú
      const bad = needPin() || chi('qt'); if (bad) return bad;
      const ten = String(q.ten || '').trim().slice(0, 60); if (!ten) return { ok: false, err: 'Chưa có tên lớp' };
      const all = lopHoc_(lop); if (all.some(x => x.id !== String(q.id || '') && tenSo_(x.ten) === tenSo_(ten))) return { ok: false, err: 'Khoá này đã có lớp tên như vậy' };
      const o = { ten, lich: String(q.lich || '').trim().slice(0, 120), khai_giang: ngay_(q.khai_giang), ghi_chu: String(q.ghi_chu || '').trim().slice(0, 300) };
      if (q.id) { const c = find_('LopHoc', 'id', q.id); if (!c || c.obj.khoa !== lop || truthy_(c.obj.an)) return { ok: false, err: 'Không có lớp này' }; set_('LopHoc', c.row, o); return { ok: true, id: String(q.id) }; }
      o.id = newId_('L'); o.khoa = lop; o.tao = new Date(); o.an = ''; add_('LopHoc', o); return { ok: true, id: o.id };
    }
    case 'qt_lh_xoa': {   // chỉ xoá được lớp không còn bạn nào
      const bad = needPin() || chi('qt'); if (bad) return bad;
      const c = find_('LopHoc', 'id', q.id); if (!c || c.obj.khoa !== lop) return { ok: false, err: 'Không có lớp này' };
      const n = rows_('HocSinh').filter(k => k.lop === lop && String(k.lop_hoc || '') === String(q.id)).length;
      if (n) return { ok: false, err: 'Lớp còn ' + n + ' bạn. Chuyển các bạn sang lớp khác trước khi xoá.' };
      set_('LopHoc', c.row, { an: 'x' }); return { ok: true };
    }
    case 'qt_td_them': {   // bản 8: gửi tin hoặc nhờ việc cho vai kia
      const bad = needPin(); if (bad) return bad;
      const nd = String(q.noi_dung || '').trim().slice(0, 1000); if (!nd) return { ok: false, err: 'Chưa có nội dung' };
      const tu = vaiTu(q.tu), den = tu === 'gv' ? 'ql' : 'gv';
      let kk = null; if (q.kid) { kk = find_('HocSinh', 'id', q.kid); if (!kk || kk.obj.lop !== lop || !kidOk(kk.obj)) return { ok: false, err: 'Không có con này trong lớp' }; }
      const lhT = String(q.lh || (kk ? kk.obj.lop_hoc : '') || (tk && !ad ? (lopHoc_(lop).find(l => tk.lh.includes(l.id)) || {}).id || '' : ''));
      if (!lhOk(lhT)) return { ok: false, err: 'Không có lớp học này' };
      const o = { id: newId_('T'), lop, lh: lhT, tu, den, loai: q.loai === 'viec' ? 'viec' : 'tin', kid: String(q.kid || ''), buoi: q.buoi === '' || q.buoi == null ? '' : Math.round(+q.buoi),
        noi_dung: nd, han: ngay_(q.han), tt: 'mo', tra_loi: '', ten: String((tk && !ad ? tk.ho_ten : (q.ten || (tk && tk.ho_ten))) || '').trim().slice(0, 40), at: new Date(), xong_at: '' };
      add_('TraoDoi', o); return { ok: true, td: tdOut_(o) };
    }
    case 'qt_td_sua': {   // đánh dấu xong / mở lại / xoá, hoặc trả lời
      const bad = needPin(); if (bad) return bad;
      const t = find_('TraoDoi', 'id', q.id); if (!t || t.obj.lop !== lop || !lhOk(String(t.obj.lh || ''))) return { ok: false, err: 'Không có mục này' };
      const o = {}; if (['mo', 'xong', 'xoa'].includes(q.tt)) { o.tt = q.tt; o.xong_at = q.tt === 'xong' ? new Date() : ''; }
      if (q.tra_loi != null) o.tra_loi = String(q.tra_loi).trim().slice(0, 600);
      set_('TraoDoi', t.row, o); return { ok: true };
    }
    case 'qt_hl_them': {   // bản 9: giáo viên gửi thêm học liệu (file b64 hoặc link)
      const bad = needPin(); if (bad) return bad;
      const ten = String(q.ten || '').trim().slice(0, 120); if (!ten) return { ok: false, err: 'Chưa đặt tên bài' };
      const kids = (Array.isArray(q.kid) ? q.kid : String(q.kid || '').split(',')).map(String).filter(Boolean);
      for (const id of kids) { const k = find_('HocSinh', 'id', id); if (!k || k.obj.lop !== lop || !kidOk(k.obj)) return { ok: false, err: 'Không có con này trong lớp' }; }
      const lh = String(q.lh || (tk && !ad ? (kids.length ? find_('HocSinh', 'id', kids[0]).obj.lop_hoc : (lopHoc_(lop).find(l => tk.lh.includes(l.id)) || {}).id) || '' : '')), lhx = lh ? lopHoc_(lop).find(x => x.id === lh) : null;
      if ((lh && !lhx) || !lhOk(lh)) return { ok: false, err: 'Không có lớp học này' };
      const buoi = q.buoi === '' || q.buoi == null ? '' : Math.max(0, Math.min(48, Math.round(+q.buoi) || 0));
      const o = { id: newId_('H'), lop, lh, buoi, kid: kids.join(','), ten, file: '', mime: '', co: '', url: '', file_id: '', cach: ['in', 'zalo', 'ca_hai'].includes(q.cach) ? q.cach : 'in',
        ghi_chu: String(q.ghi_chu || '').trim().slice(0, 500), tu: vaiTu(q.tu), nguoi: String((tk && !ad ? tk.ho_ten : (q.nguoi || (tk && tk.ho_ten))) || '').trim().slice(0, 40), at: new Date(), phat_at: '', gui_at: '', an: '', web: truthy_(q.web) && q.web !== '0' ? 'x' : '' };
      if (q.b64) {
        const bytes = Utilities.base64Decode(String(q.b64));
        if (bytes.length > HL_MAX_MB * 1048576) return { ok: false, err: 'File lớn hơn ' + HL_MAX_MB + ' MB', qua_lon: true };
        const goc = String(q.file || 'tai-lieu').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 120) || 'tai-lieu';
        const cfg = rows_('CaiDat').find(x => x.lop === lop) || {};
        const dir = thuMucCon_(thuMucCon_(thuMucHL_(), cfg.ten_lop || lop), lhx ? lhx.ten : 'Chưa xếp lớp');
        const f = dir.createFile(Utilities.newBlob(bytes, String(q.mime || 'application/octet-stream'), (buoi !== '' ? 'Buổi ' + buoi + ' – ' : '') + goc));
        f.setDescription(ten + (o.ghi_chu ? ' · ' + o.ghi_chu : ''));
        Object.assign(o, { file: goc, mime: f.getMimeType(), co: bytes.length, file_id: f.getId(), url: f.getUrl() });
      } else {
        const u = String(q.url || '').trim(); if (!/^https:\/\/\S+$/.test(u)) return { ok: false, err: 'Cần file hoặc một link bắt đầu bằng https://' };
        o.url = u.slice(0, 500);
      }
      add_('HocLieu', o); return { ok: true, hl: hlOut_(o) };
    }
    case 'qt_hl_sua': {   // đánh dấu đã in phát / đã gửi phụ huynh (1 = có, 0 = bỏ), hoặc ẩn (an = 1)
      const bad = needPin(); if (bad) return bad;
      const t = find_('HocLieu', 'id', q.id); if (!t || t.obj.lop !== lop || !lhOk(String(t.obj.lh || ''))) return { ok: false, err: 'Không có học liệu này' };
      const o = {}; if (q.web != null) o.web = +q.web ? 'x' : ''; if (q.phat != null) o.phat_at = +q.phat ? new Date() : ''; if (q.gui != null) o.gui_at = +q.gui ? new Date() : ''; if (q.an != null) o.an = +q.an ? 'x' : '';
      set_('HocLieu', t.row, o); return { ok: true };
    }
    case 'qt_hl_lay': {   // tải file về qua máy chủ (người không có quyền vào Drive của chị vẫn tải được, nhưng phải có PIN)
      const bad = needPin(); if (bad) return bad;
      const t = find_('HocLieu', 'id', q.id); if (!t || t.obj.lop !== lop || !t.obj.file_id || !lhOk(String(t.obj.lh || ''))) return { ok: false, err: 'Không có file này' };
      const b = DriveApp.getFileById(String(t.obj.file_id)).getBlob();
      return { ok: true, b64: Utilities.base64Encode(b.getBytes()), mime: b.getContentType(), ten: b.getName() };
    }
    case 'qt_chuyen': {   // xếp / chuyển lớp: ids = danh sách mã con, lh = mã lớp đích ('' = chưa xếp lớp)
      const bad = needPin() || chi('qt', 'ql'); if (bad) return bad;
      const lh = String(q.lh || ''), L = lh ? rows_('LopHoc').find(x => x.id === lh && !truthy_(x.an)) : null;
      if (lh && !L) return { ok: false, err: 'Không có lớp học này' };
      if (!lhOk(lh)) return { ok: false, err: 'Chỉ chuyển được sang lớp mình được giao' };
      const ids = (Array.isArray(q.ids) ? q.ids : String(q.ids || '').split(',')).map(String).filter(Boolean);
      let n = 0, khoa = 0;
      ids.forEach(id => { const k = find_('HocSinh', 'id', id); if (!k || k.obj.lop !== lop || !kidOk(k.obj)) return;
        if (L && L.khoa !== lop) { chuyenKhoa_(k, L.khoa); khoa++; }
        set_('HocSinh', k.row, { lop_hoc: lh }); n++; });
      return { ok: true, n, khoa };
    }
  }
  return { ok: false, err: 'Lệnh không rõ' };
}

/* ===================== cài đặt lần đầu (chị chạy hàm này 1 lần trong trình soạn Apps Script) ===================== */
function caiDat() {
  Object.keys(TAB).forEach(name => sh_(name));
  const cd = sh_('CaiDat'), have = rows_('CaiDat').map(r => r.lop);
  LOP_MAC_DINH.forEach(([lop, ten]) => { if (!have.includes(lop)) add_('CaiDat', { lop, ten_lop: ten, pin: String(100000 + Math.floor(Math.random() * 900000)), ghi_chu: 'Cô có thể sửa PIN ở ô này' }); });
  cd.autoResizeColumns(1, 4);
  khoaBi_();
  let nl = 0; { const s = sh_('HocSinh'), v = s.getDataRange().getValues(), h = v[0].map(String), c = h.indexOf('ma_link'), ci = h.indexOf('id');
    for (let i = 1; i < v.length; i++) if (v[i][ci] !== '' && String(v[i][c] || '').length < 8) { s.getRange(i + 1, c + 1).setNumberFormat('@').setValue(maLinkMoi_()); nl++; } }
  if (nl) Logger.log('Đã tạo link riêng cho ' + nl + ' con.');
  Logger.log(rows_('TaiKhoan').some(x => x.vai === 'qt') ? 'Đã có tài khoản quản trị.' : 'Chưa có tài khoản quản trị: mở trang quản trị → "Lần đầu dùng" → tạo bằng PIN khoá.');
  try { Logger.log('Thư mục học liệu gửi thêm: ' + thuMucHL_().getUrl()); } catch (x) { Logger.log('Chưa tạo được thư mục học liệu: ' + x); }
  Logger.log('Xong. PIN hiện tại: ' + rows_('CaiDat').map(r => r.ten_lop + ' = ' + r.pin).join(' · '));
}

/* ===================== bản 10: làm lại từ đầu (chị chạy tay một lần trong trình soạn Apps Script) =====================
   1) Chép một bản sao lưu của cả Sheet vào cùng thư mục.  2) Xoá dữ liệu học tập: TienDo, Thuong, DoiQua, BuoiHS, GhiChu.
   3) Mỗi con: sao, ngày web, máy đã nhớ, lịch sử khoá về trống; tăng "phien" để máy nào còn bản cũ tự bỏ.
   GIỮ: danh sách con (mã, tên, PIN, link riêng, lớp), lớp học, buổi lớp, tài khoản, tài nguyên, trao đổi, học liệu. */
function lamLaiTuDau() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), f = DriveApp.getFileById(ss.getId()), ps = f.getParents(), cha = ps.hasNext() ? ps.next() : DriveApp.getRootFolder();
  const bk = f.makeCopy('Sao lưu trước khi làm lại · ' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd-MM-yyyy HH:mm') + ' · ' + ss.getName(), cha);
  Logger.log('Đã sao lưu: ' + bk.getUrl());
  ['TienDo', 'Thuong', 'DoiQua', 'BuoiHS', 'GhiChu'].forEach(n => { const s = sh_(n), r = s.getLastRow(); if (r > 1) s.getRange(2, 1, r - 1, Math.max(1, s.getLastColumn())).clearContent(); Logger.log('Đã xoá ' + (r - 1) + ' dòng ở ' + n); });
  const P = PropertiesService.getScriptProperties(), ph = (+P.getProperty('PHIEN') || 0) + 1; P.setProperty('PHIEN', String(ph));
  const s = sh_('HocSinh'), v = s.getDataRange().getValues(), h = v[0].map(String), ci = h.indexOf('id'), rws = [];
  for (let i = 1; i < v.length; i++) if (v[i][ci] !== '') rws.push(i + 1);
  const o = { web: 0, vi: 0, ngay: 0, cuoi: '', luu_cuoi: '', may: '', cho_may: '', lich_su: '', phien: ph };
  rws.forEach(r => Object.keys(o).forEach(k => { const c = h.indexOf(k); if (c >= 0) s.getRange(r, c + 1).setValue(o[k]); }));
  const n = rws.length;
  Logger.log('Xong: làm mới ' + n + ' con (phiên ' + ph + '). Máy nào mở web sẽ tự bỏ bài cũ và học lại từ ngày 1.');
}

/* ===================== Góc vinh danh ===================== */
/* Đọc video trong thư mục của lớp (và một tầng thư mục con, nếu cô muốn chia theo tuần).
   Tên tệp: "Bông – đọc truyện Unit 2.mp4"; có thể thêm mã con trong ngoặc vuông: "Bông [ZTK2A7] – đọc truyện.mp4". */
function videos_(folderId) {
  const out = [], seen = {};
  const scan = (f, depth) => {
    const it = f.getFiles();
    while (it.hasNext() && out.length < 600) {
      const x = it.next(), mt = String(x.getMimeType() || '');
      if (!/^video\//.test(mt) || seen[x.getId()] || x.isTrashed()) continue; seen[x.getId()] = 1;
      const raw = String(x.getName() || '').replace(/\.[A-Za-z0-9]{2,4}$/, '');
      const m = raw.match(/\[([A-Za-z0-9]{4,8})\]/), kid = m ? m[1].toUpperCase() : '';
      const clean = raw.replace(/\s*\[[A-Za-z0-9]{4,8}\]\s*/, ' ').replace(/\s+/g, ' ').trim();
      const parts = clean.split(/\s+[–—-]\s+|_/);
      out.push({ id: x.getId(), ten: (parts[0] || '').trim(), bai: parts.slice(1).join(' – ').trim(), kid, t: x.getDateCreated().getTime() });
    }
    if (depth < 1) { const sub = f.getFolders(); while (sub.hasNext()) scan(sub.next(), depth + 1); }
  };
  scan(DriveApp.getFolderById(folderId), 0);
  return out.sort((a, b) => b.t - a.t);
}
/* ngày khai giảng → "yyyy-mm-dd" (web tự tính tuần theo giờ trên máy con). Nhận ô ngày, "2026-11-16" hoặc "16/11/2026" */
function ngay_(v) {
  if (v === '' || v == null) return '';
  if (typeof v === 'number') return Utilities.formatDate(new Date(v), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  const s = String(v).trim(), p2 = n => ('0' + n).slice(-2); let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return m[1] + '-' + p2(m[2]) + '-' + p2(m[3]);
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return m[3] + '-' + p2(m[2]) + '-' + p2(m[1]);
  return '';
}
/* Chị chạy hàm này một lần trong trình soạn Apps Script để cấp quyền đọc Drive và xem máy chủ thấy bao nhiêu video */
function thuVideo() {
  rows_('CaiDat').forEach(r => {
    if (!r.video_folder) return Logger.log(r.ten_lop + ': chưa có thư mục video');
    const v = videos_(String(r.video_folder).trim());
    Logger.log(r.ten_lop + ': ' + v.length + ' video' + (v[0] ? ' · mới nhất: ' + v[0].ten + ' – ' + v[0].bai : ''));
  });
}

/* ===================== trang quản trị: tiện ích ===================== */
/* ghi nhiều dòng một lượt theo cột khoá k (có thì sửa, chưa có thì thêm) */
function upsertMany_(name, list) {
  if (!list.length) return;
  const s = sh_(name), h = head_(s), tx = TEXT_COLS[name] || [], kc = h.indexOf('k'), n = Math.max(0, s.getLastRow() - 1);
  const v = n ? s.getRange(2, 1, n, h.length).getValues() : [], idx = {}; v.forEach((r, i) => { idx[String(r[kc])] = i; });
  const cell = (c, x) => x === undefined ? '' : (tx.includes(c) ? String(x) : x), add = [];
  list.forEach(o => { const i = idx[o.k];
    if (i === undefined) add.push(o); else h.forEach((c, j) => { if (o[c] !== undefined) v[i][j] = cell(c, o[c]); }); });
  if (v.length) s.getRange(2, 1, v.length, h.length).setValues(v);
  if (add.length) { const st = s.getLastRow() + 1;
    h.forEach((c, j) => { if (tx.includes(c)) s.getRange(st, j + 1, add.length, 1).setNumberFormat('@'); });
    s.getRange(st, 1, add.length, h.length).setValues(add.map(o => h.map(c => cell(c, o[c])))); }
}
function hsOut_(r) { return { buoi: +r.buoi, kid: r.kid, cm: r.cm || '', tg: r.tg === '' ? '' : +r.tg, en: r.en === '' ? '' : +r.en, zh: r.zh === '' ? '' : +r.zh, bt: r.bt === '' ? '' : +r.bt, note: r.note || '' }; }
function blOut_(r) { return { buoi: +r.buoi, ngay: ngay_(r.ngay), da_day: truthy_(r.da_day), ghi_chu: r.ghi_chu || '', lh: String(r.lh || '') }; }
function gcOut_(r) { return { id: String(r.id), kid: r.kid, buoi: r.buoi === '' ? '' : +r.buoi, loai: r.loai || 'khac', nd: r.noi_dung || '', at: +r.at || 0, cs: truthy_(r.chia_se) }; }
/* ---------- bản 10: tài khoản, link riêng, chuyển khoá ---------- */
function hex_(b) { return b.map(x => ('0' + ((x + 256) % 256).toString(16)).slice(-2)).join(''); }
function muoi_() { return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Math.random() + '|' + Date.now() + '|' + Math.random(), Utilities.Charset.UTF_8)).slice(0, 24); }
function bam_(p, m) { let h = String(m) + '|' + p; for (let i = 0; i < 300; i++) h = hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + '|' + m, Utilities.Charset.UTF_8)); return h; }
function khoaBi_() { const P = PropertiesService.getScriptProperties(); let k = P.getProperty('TK_KHOA'); if (!k) { k = muoi_() + muoi_(); P.setProperty('TK_KHOA', k); } return k; }
function ky_(s) { return hex_(Utilities.computeHmacSha256Signature(s, khoaBi_(), Utilities.Charset.UTF_8)).slice(0, 40); }
function tokTao_(r) { const het = Date.now() + TK_NGAY * 864e5, base = String(r.id) + '.' + het; return base + '.' + ky_(base + '.' + String(r.bam).slice(0, 16)); }
function tkTuTok_(t) {
  const p = String(t || '').split('.'); if (p.length !== 3 || !(+p[1] > Date.now())) return null;
  const r = rows_('TaiKhoan').find(x => x.id === p[0] && !truthy_(x.khoa)); if (!r) return null;
  if (ky_(p[0] + '.' + p[1] + '.' + String(r.bam).slice(0, 16)) !== p[2]) return null;
  return { id: String(r.id), ten_dn: r.ten_dn, ho_ten: String(r.ho_ten || ''), vai: TK_VAI[r.vai] ? r.vai : 'gv', lh: lhList_(r.lh) };
}
function needTk_(tk) { return tk ? null : { ok: false, het: true, err: 'Phiên đăng nhập đã hết. Đăng nhập lại nhé.' }; }
function lhList_(x) { return (Array.isArray(x) ? x : String(x || '').split(',')).map(s => String(s).trim()).filter(Boolean); }
function tkOut_(r) { return r ? { id: String(r.id), ten_dn: String(r.ten_dn || ''), ho_ten: String(r.ho_ten || ''), vai: r.vai, lh: lhList_(r.lh), khoa: truthy_(r.khoa), dn_cuoi: +r.dn_cuoi || 0 } : null; }
function tkKiem_(q, moi) {
  const u = String(q.ten_dn || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(u)) return { ok: false, err: 'Tên đăng nhập 3–30 ký tự, chỉ chữ không dấu, số, dấu chấm, gạch' };
  if (moi && rows_('TaiKhoan').some(x => x.ten_dn === u)) return { ok: false, err: 'Tên đăng nhập này đã có người dùng' };
  if (String(q.p || '').length < 6) return { ok: false, err: 'Mật khẩu cần ít nhất 6 ký tự' };
  if (!String(q.ho_ten || '').trim()) return { ok: false, err: 'Nhập họ tên người dùng' };
  return null;
}
function tkMoi_(q, vai, lhs) { const m = muoi_(); return { id: newId_('U'), ten_dn: String(q.ten_dn).trim().toLowerCase(), ho_ten: String(q.ho_ten).trim().slice(0, 60), vai, lh: lhs.join(','), muoi: m, bam: bam_(String(q.p), m), khoa: '', tao: new Date(), dn_cuoi: '' }; }
function lhAll_() { return rows_('LopHoc').filter(x => !truthy_(x.an)).map(x => ({ id: String(x.id), khoa: x.khoa, ten: x.ten || '' })).sort((a, b) => (a.khoa + a.ten).localeCompare(b.khoa + b.ten, 'vi')); }
function maLinkMoi_() { const A = 'abcdefghjkmnpqrstuvwxyz23456789'; let s; do { s = ''; for (let i = 0; i < 10; i++) s += A[Math.floor(Math.random() * A.length)]; } while (rows_('HocSinh').some(x => x.ma_link === s)); return s; }
function phienHT_() { return PropertiesService.getScriptProperties().getProperty('PHIEN') || 0; }
/* lệnh của con từ máy còn giữ dữ liệu trước lần làm lại, hoặc từ web khoá cũ sau khi con đã chuyển khoá: không ghi */
function lechPhien_(q, k) {
  if (q.lop && LOP_MAC_DINH.some(x => x[0] === q.lop) && q.lop !== k.lop) return { ok: false, chuyen: k.lop, err: 'Con đã chuyển sang khoá khác' };
  if (q.ph != null && q.ph !== '' && +q.ph !== (+k.phien || 0)) return { ok: false, phien: true, ph: +k.phien || 0, err: 'Dữ liệu học đã được làm mới' };
  if ((q.ph == null || q.ph === '') && (+k.phien || 0) > 0 && q.action === 'luu') return { ok: false, phien: true, ph: +k.phien || 0, err: 'Dữ liệu học đã được làm mới' };
  return null;
}
function hlChoCon_(h, k) { return h.lop === k.lop && truthy_(h.web) && !truthy_(h.an) && (!h.lh || String(h.lh) === String(k.lop_hoc || '')) && (!String(h.kid || '') || String(h.kid).split(',').includes(String(k.id))); }
/* chuyển một con sang khoá khác (k: kết quả find_ HocSinh) */
function chuyenKhoa_(k, moi) {
  const o = k.obj, id = String(o.id), cu = o.lop, now = new Date(), t = find_('TienDo', 'id', id);
  let shop = null;
  if (t) {
    const data = readData_(t.obj), arc = find_('TienDo', 'id', id + '@' + cu), a = { lop: cu, id: id + '@' + cu, v: +t.obj.v || 0, t: +t.obj.t || 0, capnhat: now, do_dai: data.length };
    for (let i = 1; i <= 6; i++) a['d' + i] = t.obj['d' + i] || '';
    if (arc) set_('TienDo', arc.row, a); else add_('TienDo', a);
    try { const j = JSON.parse(data || '{}'); shop = j._shop || null; } catch (x) {}
    const n = { _t: Date.now() };
    if (shop) n._shop = { pets: shop.pets || [], mons: shop.mons || [], own: shop.own || {}, deco: shop.deco || {}, album: shop.album || [], ava: shop.ava, spent: 0, orders: [], boss: {}, bossTry: {} };
    const s = JSON.stringify(n), w = { lop: moi, v: (+t.obj.v || 0) + 1, t: Date.now(), capnhat: now, do_dai: s.length, d1: s, d2: '', d3: '', d4: '', d5: '', d6: '' };
    set_('TienDo', t.row, w);
  }
  const vi = +o.vi || 0, tenCu = (rows_('CaiDat').find(c => c.lop === cu) || {}).ten_lop || cu;
  if (vi > 0) add_('Thuong', { id: newId_('A'), lop: moi, kid: id, n: vi, why: 'Sao mang sang từ ' + tenCu, at: now, huy: '' });
  const ls = parseJ_(o.lich_su); ls.push({ lop: cu, ngay: +o.ngay || 0, web: +o.web || 0, vi, den: Date.now() });
  set_('HocSinh', k.row, { lop: moi, web: 0, vi, ngay: 0, cuoi: '', lich_su: JSON.stringify(ls) });
}

function hlOut_(r) { return { id: String(r.id), lh: String(r.lh || ''), buoi: r.buoi === '' ? '' : +r.buoi, kid: String(r.kid || '').split(',').filter(Boolean), ten: r.ten || '', file: String(r.file || ''), mime: r.mime || '', co: +r.co || 0,
  url: r.url || '', co_file: !!r.file_id, web: truthy_(r.web), cach: r.cach || 'in', gc: r.ghi_chu || '', tu: r.tu || 'gv', nguoi: String(r.nguoi || ''), at: +r.at || +new Date(r.at) || 0, phat: +r.phat_at || 0, gui: +r.gui_at || 0 }; }
/* thư mục Drive chứa học liệu gửi thêm: tạo một lần cạnh Sheet quản lý, nhớ mã trong Thuộc tính tập lệnh */
function thuMucHL_() {
  const P = PropertiesService.getScriptProperties(), id = P.getProperty('HL_FOLDER');
  if (id) { try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (x) {} }
  const ss = SpreadsheetApp.getActiveSpreadsheet(), ps = DriveApp.getFileById(ss.getId()).getParents(), cha = ps.hasNext() ? ps.next() : DriveApp.getRootFolder();
  const cu = cha.getFoldersByName(HL_THU_MUC), f = cu.hasNext() ? cu.next() : cha.createFolder(HL_THU_MUC);
  P.setProperty('HL_FOLDER', f.getId()); return f;
}
function thuMucCon_(cha, ten) { ten = String(ten || '').replace(/[\\/]+/g, ' ').trim() || 'Khác'; const it = cha.getFoldersByName(ten); return it.hasNext() ? it.next() : cha.createFolder(ten); }
function tdOut_(r) { return { id: String(r.id), lh: String(r.lh || ''), tu: r.tu, den: r.den, loai: r.loai || 'tin', kid: String(r.kid || ''), buoi: r.buoi === '' ? '' : +r.buoi, nd: r.noi_dung || '', han: ngay_(r.han), tt: r.tt || 'mo', tl: r.tra_loi || '', ten: r.ten || '', at: +r.at || +new Date(r.at) || 0, xong: +r.xong_at || 0 }; }
function lopHoc_(khoa) { return rows_('LopHoc').filter(x => x.khoa === khoa && !truthy_(x.an)).sort((a, b) => String(a.ten).localeCompare(String(b.ten), 'vi')); }
function lhOut_(r) { return { id: String(r.id), ten: r.ten || '', lich: r.lich || '', khai_giang: ngay_(r.khai_giang), ghi_chu: r.ghi_chu || '' }; }
function tnOut_(r) { return { id: String(r.id), nhom: r.nhom || 'Khác', ten: r.ten || '', url: r.url || '', ghi_chu: r.ghi_chu || '', thu_tu: +r.thu_tu || 0 }; }

/* Chị chạy hàm này MỘT lần sau khi dán bản 4: tạo các tab mới và nạp sẵn vài link (Sheet quản lý, thư mục video vinh danh) vào tab TaiNguyen.
   Link nằm trong Sheet của chị, không nằm trên GitHub công khai. */
function caiDatQuanTri() {
  Object.keys(TAB).forEach(name => sh_(name));
  const have = rows_('TaiNguyen'), url = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  rows_('CaiDat').forEach((c, i) => {
    const has = u => have.some(r => r.lop === c.lop && r.url === u);
    if (!has(url)) add_('TaiNguyen', { id: newId_('T'), lop: c.lop, nhom: 'Quản lý lớp', ten: 'Google Sheet quản lý học sinh và tiến độ', url, ghi_chu: 'Chứa PIN: chỉ chia sẻ cho người cụ thể', thu_tu: 1 });
    if (c.video_folder) { const u = 'https://drive.google.com/drive/folders/' + String(c.video_folder).trim();
      if (!has(u)) add_('TaiNguyen', { id: newId_('T'), lop: c.lop, nhom: 'Quản lý lớp', ten: 'Thư mục video vinh danh', url: u, ghi_chu: 'Thả video con làm tốt vào đây', thu_tu: 2 }); }
  });
  Logger.log('Xong. Mở link /exec thấy "v":4 là máy chủ đã chạy bản mới.');
}

/* ===================== bản 5: PIN con, giới hạn máy ===================== */
const MAX_MAY_MAC_DINH = 2;   // mỗi con nhớ tối đa 2 máy; máy thứ 3 trở đi chờ cô duyệt (đổi ở tab CaiDat, cột max_may)
const KHOA_SAI = 5, KHOA_PHUT = 10;   // nhập sai PIN 5 lần thì khoá con đó 10 phút
function parseJ_(s) { try { const a = JSON.parse(String(s || '[]')); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function maxMay_(lop) { const c = rows_('CaiDat').find(x => x.lop === lop), n = c ? Math.round(+c.max_may) : 0; return n >= 1 && n <= 6 ? n : MAX_MAY_MAC_DINH; }
function newPin_() { let p; do { p = ''; for (let i = 0; i < 4; i++) p += Math.floor(Math.random() * 10); } while (/^(\d)\1{3}$/.test(p) || ['1234', '4321', '0123', '1230'].includes(p)); return p; }
/* Con CHƯA có PIN: vào như cũ. Con ĐÃ có PIN: chỉ máy đã được nhớ mới đọc/ghi được. */
function kidGate_(q, k) {
  if (q.k && String(k.obj.ma_link || '').length >= 8 && String(q.k) === String(k.obj.ma_link)) return null;   // bản 10: link riêng
  if (!String(k.obj.pin_con || '').trim()) return null;
  const dev = String(q.dev || '').slice(0, 40);
  if (dev) {
    if (parseJ_(k.obj.may).some(m => m.d === dev)) return null;
    if (parseJ_(k.obj.cho_may).some(m => m.d === dev)) return { ok: false, need: 'duyet', ten: k.obj.ten };
  }
  return { ok: false, need: 'pin', ten: k.obj.ten };
}

/* ===================== tiện ích Sheet ===================== */
const SH_ = {};   // nhớ tab đã kiểm trong một lượt gọi
function sh_(name) {
  if (SH_[name]) return SH_[name];
  const ss = SpreadsheetApp.getActiveSpreadsheet(); let s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  const head = TAB[name], cur = s.getLastColumn() ? s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(String) : [];
  const miss = head.filter(h => !cur.includes(h));
  if (!cur.filter(Boolean).length) {
    s.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#FFF4CC'); s.setFrozenRows(1);
  } else if (miss.length) {
    s.getRange(1, cur.length + 1, 1, miss.length).setValues([miss]).setFontWeight('bold').setBackground('#FFF4CC');
  }
  if (!cur.filter(Boolean).length || miss.length) {
    const hh = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(String);
    (TEXT_COLS[name] || []).forEach(c => { const j = hh.indexOf(c); if (j >= 0) s.getRange(2, j + 1, Math.max(1, s.getMaxRows() - 1), 1).setNumberFormat('@'); });
  }
  return (SH_[name] = s);
}
function head_(s) { return s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(String); }
function rows_(name) {
  const s = sh_(name), v = s.getDataRange().getValues(), h = v[0].map(String);
  return v.slice(1).filter(r => r.some(x => x !== '')).map(r => { const o = {}; h.forEach((k, j) => o[k] = norm_(k, r[j])); return o; });
}
function find_(name, key, val) {
  const s = sh_(name), v = s.getDataRange().getValues(), h = v[0].map(String), c = h.indexOf(key);
  for (let i = 1; i < v.length; i++) if (String(v[i][c]) === String(val)) { const o = {}; h.forEach((k, j) => o[k] = norm_(k, v[i][j])); return { row: i + 1, obj: o }; }
  return null;
}
/* cột chữ (mã con, ngày "2026-11-10"…) đặt định dạng văn bản trước khi ghi để Sheet không tự đổi thành số hay ngày */
function add_(name, o) {
  const s = sh_(name), h = head_(s), row = s.getLastRow() + 1, tx = TEXT_COLS[name] || [];
  h.forEach((k, j) => { if (tx.includes(k)) s.getRange(row, j + 1).setNumberFormat('@'); });
  s.getRange(row, 1, 1, h.length).setValues([h.map(k => o[k] === undefined ? '' : (tx.includes(k) ? String(o[k]) : o[k]))]);
}
function set_(name, row, o) {
  const s = sh_(name), h = head_(s), tx = TEXT_COLS[name] || [];
  Object.keys(o).forEach(k => { const c = h.indexOf(k); if (c < 0) return; const r = s.getRange(row, c + 1);
    if (tx.includes(k)) r.setNumberFormat('@').setValue(String(o[k])); else r.setValue(o[k]); });
}
function norm_(k, x) {
  if (x instanceof Date) return x.getTime();
  if (['id', 'kid', 'lop', 'code', 'pin', 'ten', 'cuoi', 'video_folder', 'pin_con', 'may', 'cho_may', 'lop_hoc', 'lh', 'khoa', 'file_id', 'file', 'nguoi', 'ma_link', 'ten_dn', 'muoi', 'bam', 'lich_su'].includes(k)) return String(x);
  return x;
}
function pinOf_(lop) { const r = rows_('CaiDat').find(x => x.lop === lop); return r ? String(r.pin).trim() : ''; }
function readData_(o) { let s = ''; for (let i = 1; i <= 6; i++) s += String(o['d' + i] || ''); return s; }
function kidOut_(k) { return { id: k.id, lop: k.lop, ten: k.ten, tao: k.tao, web: +k.web || 0, vi: +k.vi || 0, ngay: +k.ngay || 0, cuoi: String(k.cuoi || ''), luu: k.luu_cuoi || '', tt: k.trang_thai || '', nguon: k.nguon || '', pin: !!String(k.pin_con || '').trim() }; }
function awardOut_(a) { return { id: String(a.id), kid: a.kid, n: +a.n || 0, why: a.why || '', at: +a.at || 0, huy: truthy_(a.huy) }; }
function orderOut_(o) { return { code: o.code, kid: o.kid, ten: o.ten, qua: o.qua, ten_qua: o.ten_qua, sao: +o.sao || 0, at: +o.at || 0, st: o.st, note: o.note || '' }; }
/* họ tên: bỏ khoảng trắng thừa, viết hoa chữ đầu mỗi tiếng; so khớp không phân biệt hoa thường, có lần so thêm khi bỏ dấu */
function tenSach_(t) { return String(t || '').normalize('NFC').replace(/[^\p{L}\p{M} '\-()]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 40).split(' ').map(w => w.toLowerCase().replace(/^(\(?)(\p{L})/u, (m, a, b) => a + b.toUpperCase())).join(' '); }
function tenSo_(t) { return String(t || '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim(); }
function boDau_(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd'); }
function newId_(p) { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = p || ''; for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
function truthy_(x) { return x !== '' && x !== false && x !== 0 && x != null; }
