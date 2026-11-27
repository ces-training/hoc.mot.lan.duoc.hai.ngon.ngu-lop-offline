/* =====================================================================
   TRANG QUẢN TRỊ LỚP OFFLINE · Little Seed + Seedling 48 buổi (cho cô giáo)
   - Nói chuyện với máy chủ lớp offline 48 buổi (apps-script/lop-offline-48/Code.gs, bản 4). Đăng nhập bằng PIN của lớp (tab CaiDat).
   - ?demo=1: chạy với dữ liệu giả lưu trên máy này (PIN 2468) để xem thử, không cần máy chủ.
   - Máy chủ cũ (bản 3): vẫn xem được dashboard và sao/quà; điểm danh, ghi chú, tài nguyên cần bản 4.
   - Bản 7 (26/11/2026): LỚP HỌC trong mỗi khoá. Mục "Lớp học" để tạo lớp, xếp và chuyển con giữa các lớp;
     ô "Lớp" trên đầu trang lọc mọi mục theo một lớp; điểm danh, ngày khai giảng ghi riêng cho từng lớp.
   - Bản 10 (27/11/2026): ĐĂNG NHẬP BẰNG TÀI KHOẢN (tên đăng nhập + mật khẩu, nhớ 30 ngày trên máy), không dùng PIN khoá.
     Quản trị thấy mọi lớp, tạo tài khoản ở mục "Nhân sự" (nhan-su.js); giáo viên / quản lý học tập chỉ thấy lớp được giao.
     Mỗi con một link riêng .../con/?k=… (mở là học, không cần PIN). Chuyển lớp sang khoá khác = lên Seedling.
     ?demo=1: tên đăng nhập demo, mật khẩu 2468.
   ===================================================================== */
const API = 'https://script.google.com/macros/s/AKfycbxA0_S8xQRc9IpzVcQ06-waH5OT7H5crqr-yFTwmKUij09zf9qPbzRsiX-iCPHnnocz/exec';
const DEMO = /[?&]demo=1/.test(location.search);
const LOPS = { ls: { ten: 'Little Seed', web: '../little-seed/', tong: 99 }, sd: { ten: 'Seedling', web: '../seedling/', tong: 99 } };
const LOAI = { tien_bo: '🌱 Tiến bộ', ho_tro: '🤝 Cần hỗ trợ', phu_huynh: '👪 Phụ huynh', hanh_vi: '🧭 Nề nếp', khac: '📝 Khác' };
const CM = [['c', '✓', 'Có mặt'], ['t', 'T', 'Đến muộn'], ['p', 'P', 'Vắng có phép'], ['v', '✗', 'Vắng']];
const WHY = ['Phát biểu hăng hái', 'Giúp đỡ bạn', 'Nói được cả câu', 'Hoàn thành bài ở nhà', 'Tiến bộ rõ'];
const TABS = [['tq', 'Tổng quan'], ['lh', 'Lớp học'], ['hs', 'Học sinh'], ['dd', 'Điểm danh & buổi học'], ['tk', 'Tài khoản con'], ['sq', 'Sao & quà'], ['tn', 'Tài nguyên']];

/* ---------- tiện ích ---------- */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => ymd(new Date());
const dayDiff = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 864e5);
const dm = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) : '';
const dmt = t => { if (!t) return ''; const d = new Date(+t); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); };
let toastT = 0;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600); }
const store = { get: k => { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }, set: (k, v) => { try { v ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch (e) {} } };
const keep = { get: k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }, set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} } };   // nhớ đăng nhập 30 ngày

/* ---------- trạng thái ---------- */
const S = { lop: keep.get('qtl-lop') || 'ls', tok: keep.get(DEMO ? 'qtl-tok-demo' : 'qtl-tok'), toi: null, lhAll: [], d: null, tab: 'tq', kid: '', q: '', filt: '', dd: null, sel: new Set(), n: 3, why: WHY[0], tnEdit: null, v3: false, v5: false, err: '', tkSel: new Set(), tkNew: '', tkCards: null, v7: false, lh: '', lhEdit: null, lhSel: new Set(), lhFilt: 'pin' };
/* lớp học đang xem: '' = cả khoá, '_none' = các bạn chưa xếp lớp, còn lại là mã lớp */
const LH = () => (S.d && S.d.lh) || [];
const lhOf = id => LH().find(x => x.id === id);
const lhCur = () => (S.lh && S.lh !== '_none' ? lhOf(S.lh) : null);
const inLh = k => !S.lh || (S.lh === '_none' ? !k.lh || !lhOf(k.lh) : k.lh === S.lh);
const lhName = id => { const l = lhOf(id); return l ? l.ten : ''; };
const KICHBAN = 'https://claude.ai/artifact/3eh3RRL7K6HfMbzub28miF';   // trang xem kịch bản 96 buổi offline (LS 48 + SD 48), có khung góp ý
const dayUrl = n => (S.lop === 'sd' ? '../seedling/day/#/b/' : '../little-seed/day/#/b/') + n;   // sách bài tập, giáo án, học liệu in của buổi n
const KH = () => (window.KHUNG && KHUNG[S.lop]) || [];
const weekOf = n => n <= 3 ? n : 4 + Math.floor((n - 4) / 2);   // tuần 1–3: 1 buổi/tuần; từ tuần 4: 2 buổi/tuần (khung 48 buổi)

/* ---------- gọi máy chủ (POST text/plain: không cần hỏi trước, PIN không nằm trên link) ---------- */
async function call(action, extra = {}) {
  const q = Object.assign({ action, lop: S.lop, tok: S.tok }, extra);
  let r;
  if (DEMO) r = mock(q);
  else try { r = await (await fetch(API, { method: 'POST', body: JSON.stringify(q), redirect: 'follow' })).json(); }
  catch (e) { return { ok: false, err: 'Không nối được máy chủ. Kiểm tra mạng rồi thử lại.', net: true }; }
  if (r && r.het && S.d && !/^qt_(dn|tk_dau)$/.test(action)) { setTok(''); S.d = null; setTimeout(() => login(r.err), 0); }
  return r;
}
async function load() {
  let r = await call('qt_tai');
  if (!r.ok && /Lệnh không rõ/.test(r.err || '')) {   // máy chủ bản 3: chỉ có dữ liệu lớp cơ bản
    const c = await call('cls');
    if (!c.ok) return c;
    r = { ok: true, v: 3, cfg: {}, kids: c.kids, awards: c.awards, orders: c.orders, hs: [], bl: [], gc: [], tn: [] };
  }
  if (!r.ok) return r;
  S.toi = r.toi || S.toi; S.lhAll = r.lh_all || [];
  S.d = r; S.v3 = r.v < 4; S.v5 = r.v >= 5; S.v7 = r.v >= 7; S.v8 = r.v >= 8; S.v9 = r.v >= 9; r.lh = r.lh || []; r.td = r.td || []; r.hl = r.hl || [];
  S.lh = keep.get('qtl-lh-' + S.lop); if (S.lh && S.lh !== '_none' && !lhOf(S.lh)) S.lh = ''; return r;
}
async function refresh(keepScroll) { const y = scrollY; const r = await load(); if (!r.ok) { toast(r.err || 'Chưa tải được'); return; } draw(); if (keepScroll) scrollTo(0, y); }

/* ---------- dữ liệu suy ra ---------- */
function derive() {
  const d = S.d, kids = d.kids.filter(inLh).sort((a, b) => String(a.ten).localeCompare(String(b.ten), 'vi'));
  const blLh = (lhCur() || {}).id || '', bls = d.bl.filter(r => (r.lh || '') === blLh);   // buổi của lớp đang xem (cả khoá: buổi ghi chung)
  const active = kids.filter(k => !k.tt);
  const hsBy = {}; d.hs.forEach(r => { (hsBy[r.kid] = hsBy[r.kid] || {})[r.buoi] = r; });
  const blBy = {}; bls.forEach(r => { blBy[r.buoi] = r; });
  const mine = new Set(kids.map(k => k.id));
  const taught = new Set(); bls.forEach(r => { if (r.da_day) taught.add(r.buoi); }); d.hs.forEach(r => { if (r.cm && mine.has(r.kid)) taught.add(r.buoi); });
  const tl = [...taught].sort((a, b) => a - b);
  const info = {};
  kids.forEach(k => {
    const recs = Object.values(hsBy[k.id] || {}), cms = recs.filter(r => r.cm);
    const pres = cms.filter(r => r.cm === 'c' || r.cm === 't').length;
    const avg = f => { const v = recs.map(r => r[f]).filter(x => x !== '' && x > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    const dsc = k.cuoi ? dayDiff(today(), k.cuoi) : null;
    const lastCm = tl.slice(-2).map(b => (hsBy[k.id] || {})[b]).map(r => r && r.cm);
    const lowTg = tl.slice(-3).map(b => (hsBy[k.id] || {})[b]).filter(r => r && r.tg !== '' && r.tg > 0 && r.tg <= 1).length;
    info[k.id] = { att: cms.length ? pres / cms.length : null, nAtt: cms.length, tg: avg('tg'), en: avg('en'), zh: avg('zh'), dsc, lastCm, lowTg,
      stars: (k.web || 0) + d.awards.filter(a => a.kid === k.id && !a.huy).reduce((s, a) => s + a.n, 0) };
  });
  return { kids, active, hsBy, blBy, tl, info };
}
function expectedDays() {
  const st = (lhCur() || {}).khai_giang || (S.d.cfg && S.d.cfg.khai_giang); if (!st) return null;
  const w = Math.floor(dayDiff(today(), st) / 7) + 1; if (w < 1) return 0;
  let m = 0; KH().forEach(s => { if (weekOf(s.n) <= w) (s.days || []).forEach(x => { if (x > m) m = x; }); }); return m;
}
function flags(D) {
  const out = [], exp = expectedDays(), ord = S.d.orders.filter(o => o.st === 'cho');
  D.active.forEach(k => {
    const i = D.info[k.id], f = [];
    if (i.dsc == null) f.push(['r', 'Chưa mở web học lần nào']); else if (i.dsc >= 4) f.push(['r', `Chưa học web ${i.dsc} ngày (lần cuối ${dm(k.cuoi)})`]);
    if (exp != null && exp - (k.ngay || 0) >= 3 && (k.ngay || 0) > 0) f.push(['a', `Học web chậm hơn lịch ${exp - k.ngay} ngày`]);
    if (i.lastCm.length === 2 && i.lastCm.every(x => x === 'v' || x === 'p')) f.push(['r', 'Vắng 2 buổi dạy gần nhất']);
    if (i.lowTg >= 2) f.push(['a', 'Tham gia thấp ở ≥2 trong 3 buổi gần nhất']);
    if (ord.some(o => o.kid === k.id)) f.push(['b', 'Có phiếu đổi quà chờ duyệt']);
    if ((k.cho || []).length) f.push(['b', 'Có máy mới chờ cô duyệt (tab Tài khoản con)']);
    f.forEach(x => out.push({ kid: k.id, ten: k.ten, c: x[0], t: x[1] }));
  });
  return out;
}

/* ---------- vỏ trang ---------- */
function shell() {
  $('#top').hidden = false;
  $('#lopsw').innerHTML = khoaCuaToi().map(l => `<button class="pill" role="tab" aria-selected="${l === S.lop}" data-lop="${l}" type="button">${LOPS[l].ten}</button>`).join('');
  const lp = $('#lhpick'); if (lp) { const ls = LH(); lp.hidden = !(S.v7 && ls.length);
    const cnt = id => S.d.kids.filter(k => !k.tt && (id === '_none' ? !k.lh || !lhOf(k.lh) : k.lh === id)).length;
    lp.innerHTML = `<label for="lhsel">Lớp</label><select id="lhsel"><option value="">Cả khoá (${S.d.kids.filter(k => !k.tt).length} bạn)</option>${ls.map(l => `<option value="${esc(l.id)}" ${S.lh === l.id ? 'selected' : ''}>${esc(l.ten)} (${cnt(l.id)})</option>`).join('')}<option value="_none" ${S.lh === '_none' ? 'selected' : ''}>Chưa xếp lớp (${cnt('_none')})</option></select>`;
    $('#lhsel').onchange = e => { S.lh = e.target.value; keep.set('qtl-lh-' + S.lop, S.lh); S.kid = ''; S.dd = null; S.sel = new Set(); draw(); }; }
  const ord = S.d ? S.d.orders.filter(o => o.st === 'cho').length : 0;
  const chm = S.d && S.v5 ? S.d.kids.filter(k => !k.tt && (k.cho || []).length).length : 0;
  $('#nav').innerHTML = TABS.map(([k, t]) => `<button type="button" data-tab="${k}" ${S.tab === k ? 'aria-current="page"' : ''}>${t}${k === 'sq' && ord ? `<span class="dot">${ord}</span>` : ''}${k === 'tk' && chm ? `<span class="dot">${chm}</span>` : ''}</button>`).join('');
  const b = $('#banner');
  if (DEMO) { b.hidden = false; b.textContent = 'Chế độ xem thử: dữ liệu giả, lưu trên máy này. Đừng nhập thông tin thật.'; }
  else if (S.v3) { b.hidden = false; b.textContent = 'Máy chủ lớp đang là bản 3: xem được dashboard, sao và quà. Muốn điểm danh, ghi chú từng con và kho tài nguyên, dán Code.gs bản 4 (xem apps-script/lop-offline-48/HUONG-DAN.md).'; }
  else if (!S.v5) { b.hidden = false; b.textContent = 'Muốn cấp PIN và giới hạn máy cho các con, và cho con/ba mẹ xem Bảng của con: dán Code.gs bản 5 (xem apps-script/lop-offline-48/HUONG-DAN.md).'; }
  else if (!S.v7) { b.hidden = false; b.textContent = 'Muốn tạo lớp học và chuyển lớp cho các con: cập nhật máy chủ lên bản 7 (dán Code.gs mới rồi triển khai phiên bản mới, xem apps-script/lop-offline-48/HUONG-DAN.md).'; }
  else b.hidden = true;
}
function draw() {
  if (!S.d) return login();
  shell();
  const m = $('#main'); const f = { tq: vTq, lh: vLh, hs: vHs, dd: vDd, tk: vTk, sq: vSq, tn: vTn, ga: window.vGa, hl: window.vHl, nv: window.vNv }[S.tab] || vTq;
  m.innerHTML = f();
  document.title = (LOPS[S.lop].ten) + ' · Quản trị lớp offline (bản riêng)';
  bind();
}

/* ---------- đăng nhập bằng tài khoản (bản 10) ---------- */
function setTok(t) { S.tok = t; keep.set(DEMO ? 'qtl-tok-demo' : 'qtl-tok', t); }
/* các khoá tài khoản này vào được: quản trị = cả hai; còn lại = khoá có lớp được giao */
const khoaCuaToi = () => (!S.toi || S.toi.vai === 'qt') ? Object.keys(LOPS) : Object.keys(LOPS).filter(l => S.lhAll.some(x => x.khoa === l));
function login(err) {
  $('#top').hidden = true; $('#banner').hidden = !DEMO; if (DEMO) $('#banner').textContent = 'Chế độ xem thử: tên đăng nhập demo, mật khẩu 2468. Dữ liệu giả lưu trên máy này.';
  $('#main').innerHTML = `<div class="card login"><h1>Quản trị lớp offline · bản riêng</h1><p class="muted">Dành cho giáo viên, quản lý học tập và quản trị CES. Đăng nhập bằng tài khoản quản trị đã cấp.</p>
    <form id="lf"><label class="f" for="lu">Tên đăng nhập</label><input id="lu" autocomplete="username" autocapitalize="none" spellcheck="false" value="${DEMO ? 'demo' : ''}" autofocus>
    <label class="f" for="lp">Mật khẩu</label><input id="lp" type="password" autocomplete="current-password">
    <div class="err" id="lerr" role="alert">${esc(err || '')}</div><button class="btn" type="submit" style="width:100%">Vào quản trị</button></form>
    <details class="dau"><summary class="sm">Lần đầu dùng: tạo tài khoản quản trị bằng PIN khoá</summary>
      <p class="muted sm">Chỉ dùng một lần, khi chưa có tài khoản quản trị nào. PIN khoá nằm ở tab CaiDat của Google Sheet quản lý. Sau đó vào trang bằng tài khoản, tạo tài khoản cho giáo viên, quản lý học tập ở mục <b>Nhân sự</b>.</p>
      <form id="df"><div class="lopsw" role="tablist">${Object.keys(LOPS).map(l => `<button class="pill" role="tab" aria-selected="${l === S.lop}" data-lop0="${l}" type="button">PIN ${LOPS[l].ten}</button>`).join('')}</div>
      <label class="f" for="dpin">PIN khoá ${esc(LOPS[S.lop].ten)}</label><input id="dpin" type="password" inputmode="numeric" autocomplete="off">
      <label class="f" for="dten">Họ tên</label><input id="dten" autocomplete="name">
      <label class="f" for="du">Tên đăng nhập (chữ không dấu, số, dấu chấm)</label><input id="du" autocomplete="username" autocapitalize="none" spellcheck="false">
      <label class="f" for="dp">Mật khẩu (ít nhất 6 ký tự)</label><input id="dp" type="password" autocomplete="new-password">
      <label class="f" for="dp2">Nhập lại mật khẩu</label><input id="dp2" type="password" autocomplete="new-password">
      <div class="err" id="derr" role="alert"></div><button class="btn" type="submit" style="width:100%">Tạo tài khoản quản trị</button></form></details></div>`;
  $$('[data-lop0]').forEach(b => b.onclick = () => { S.lop = b.dataset.lop0; keep.set('qtl-lop', S.lop); login(); $('.dau').open = true; });
  $('#lf').onsubmit = async e => { e.preventDefault(); const u = $('#lu').value.trim(), p = $('#lp').value; if (!u || !p) return;
    const b = $('#lf button'); b.disabled = true; b.textContent = 'Đang vào…';
    const r = await call('qt_dn', { u, p }); if (!r.ok) { b.disabled = false; b.textContent = 'Vào quản trị'; $('#lerr').textContent = r.err || 'Chưa vào được'; return; }
    setTok(r.tok); S.toi = r.toi; enter(); };
  $('#df').onsubmit = async e => { e.preventDefault(); const er = $('#derr');
    if ($('#dp').value !== $('#dp2').value) { er.textContent = 'Hai lần mật khẩu chưa giống nhau'; return; }
    const r = await call('qt_tk_dau', { pin: $('#dpin').value.trim(), ho_ten: $('#dten').value.trim(), ten_dn: $('#du').value.trim(), p: $('#dp').value });
    if (!r.ok) { er.textContent = r.err || 'Chưa tạo được'; return; } setTok(r.tok); S.toi = r.toi; toast('Đã tạo tài khoản quản trị'); enter(); };
}
async function enter(lan) {
  let r = await load();
  if (!r.ok && r.khong_lop && !lan) { const kh = Object.keys(LOPS).find(l => l !== S.lop); S.lop = kh; keep.set('qtl-lop', kh); return enter(1); }
  if (!r.ok) { S.d = null; if (r.het) setTok(''); return login(r.het ? '' : (r.err || 'Chưa vào được')); }
  if (!khoaCuaToi().includes(S.lop) && khoaCuaToi().length) { S.lop = khoaCuaToi()[0]; keep.set('qtl-lop', S.lop); return enter(1); }
  S.kid = ''; S.dd = null; S.sel = new Set(); S.lhSel = new Set(); S.lhEdit = null; draw();
}

/* =====================================================================
   TỔNG QUAN
   ===================================================================== */
function vTq() {
  const D = derive(), d = S.d, kh = KH(), tong = LOPS[S.lop].tong, exp = expectedDays();
  const last = D.tl.length ? D.tl[D.tl.length - 1] : -1, next = kh.find(s => s.n > last);
  const att = (() => { const v = D.active.map(k => D.info[k.id].att).filter(x => x != null); return v.length ? Math.round(100 * v.reduce((a, b) => a + b, 0) / v.length) : null; })();
  const recent = D.active.filter(k => D.info[k.id].dsc != null && D.info[k.id].dsc <= 3).length;
  const ids = new Set(D.kids.map(k => k.id)), wait = d.orders.filter(o => o.st === 'cho' && ids.has(o.kid)).length, fl = flags(D);
  const lc = lhCur(), head = S.v7 && LH().length ? `<div class="lhhead"><h1>${S.lh === '_none' ? 'Các bạn chưa xếp lớp' : lc ? esc(lc.ten) : 'Cả khoá ' + esc(LOPS[S.lop].ten)}</h1>${lc ? `<span class="muted">${esc([lc.lich, lc.khai_giang ? 'khai giảng ' + dm(lc.khai_giang) + '/' + lc.khai_giang.slice(0, 4) : ''].filter(Boolean).join(' · '))}</span>` : ''}</div>` : '';
  const tiles = head + `<div class="tiles">
    <div class="tile"><b>${D.active.length}</b><span>bạn đang học${D.kids.length > D.active.length ? ` (${D.kids.length - D.active.length} nghỉ)` : ''}</span></div>
    <div class="tile"><b>${D.tl.filter(n => n > 0).length}/48</b><span>buổi đã dạy${last >= 0 ? ` · gần nhất buổi ${last}` : ''}</span></div>
    <div class="tile"><b>${att == null ? '–' : att + '%'}</b><span>chuyên cần trung bình</span></div>
    <div class="tile"><b>${recent}/${D.active.length}</b><span>học web trong 3 ngày qua</span></div>
    <div class="tile ${wait ? 'warn' : ''}"><b>${wait}</b><span>phiếu quà chờ duyệt</span></div></div>`;
  const nextCard = next ? `<div class="card"><h2>Buổi tiếp theo · Buổi ${next.n}</h2><p style="margin:0 0 8px"><b>${esc(next.vai)}</b> · Unit ${esc(next.u)}${next.days && next.days.length ? ` · web ngày ${next.days[0]}–${next.days[next.days.length - 1]}` : ''}<br><span class="muted">${esc(next.t)}</span></p>
    <div class="row">${teachLinks(next.n).map(l => `<a class="btn" href="${l.href}" target="_blank" rel="noopener">${esc(l.t)}</a>`).join('')}<button class="ghost" type="button" data-go-dd="${next.n}">Điểm danh buổi này</button></div></div>` : `<div class="card"><h2>Đã dạy hết 48 buổi</h2></div>`;
  const bars = D.active.length ? `<div class="bars">${D.active.map(k => {
    const i = D.info[k.id], pct = Math.min(100, Math.round(100 * (k.ngay || 0) / tong)), cls = i.dsc == null || i.dsc >= 6 ? 'r' : i.dsc >= 4 ? 'a' : '';
    return `<div class="bar-row" data-kid="${esc(k.id)}" tabindex="0" role="button" aria-label="Mở hồ sơ ${esc(k.ten)}"><span class="nm">${esc(k.ten)}</span>
      <div class="bar"><span class="fill ${cls}" style="width:${pct}%"></span>${exp != null ? `<i class="mark" style="left:${Math.min(100, Math.round(100 * exp / tong))}%"></i>` : ''}</div>
      <span class="vl">${k.ngay || 0}/${tong} ngày · ${i.dsc == null ? 'chưa học' : i.dsc === 0 ? 'hôm nay' : i.dsc + ' ngày trước'}</span></div>`; }).join('')}</div>
    <div class="legend">Thanh xanh: học đều · vàng: 4–5 ngày chưa học · đỏ: từ 6 ngày hoặc chưa học${exp != null ? ' · vạch đen: tiến độ theo lịch (ước tính từ ngày khai giảng)' : ' · điền ngày khai giảng ở mục Điểm danh để hiện vạch tiến độ theo lịch'}</div>`
    : `<div class="empty">Lớp chưa có bạn nào. Vào mục <b>Sao & quà</b> để thêm bạn và lấy link gửi ba mẹ.</div>`;
  const attn = fl.length ? `<ul class="attn">${fl.slice(0, 14).map(x => `<li data-kid="${esc(x.kid)}"><span class="chip ${x.c}">${x.c === 'r' ? 'Cần gọi' : x.c === 'a' ? 'Theo dõi' : 'Việc'}</span><span><b>${esc(x.ten)}</b> · ${esc(x.t)}</span></li>`).join('')}</ul>${fl.length > 14 ? `<p class="muted sm">… và ${fl.length - 14} mục nữa.</p>` : ''}` : `<div class="empty">Chưa có bạn nào cần chú ý. 🎉</div>`;
  return tiles + `<div class="grid g2"><div>${nextCard}<div class="card"><h2>Cần chú ý</h2>${attn}</div></div><div class="card"><h2>Học web của từng bạn</h2>${bars}</div></div>` + heat(D);
}
function heat(D) {
  if (!D.tl.length) return `<div class="card"><h2>Bản đồ các buổi học</h2><div class="empty">Chưa ghi buổi nào. Vào mục <b>Điểm danh & buổi học</b> để ghi buổi đầu tiên; bản đồ sẽ hiện ở đây.</div></div>`;
  const cols = D.tl.slice(-16);
  const head = cols.map(b => `<th>${b}</th>`).join('');
  const rows = D.active.map(k => `<tr><td class="nm">${esc(k.ten)}</td>${cols.map(b => { const r = (D.hsBy[k.id] || {})[b], c = r ? r.cm : '';
    const lv = r && r.tg !== '' && r.tg > 0 ? (r.tg >= 3 ? ' s3' : r.tg <= 1 ? ' s1' : '') : '';
    return `<td><button class="hc ${c}${lv}" type="button" data-go-dd="${b}" title="${esc(k.ten)} · buổi ${b}${r && r.note ? ' · ' + esc(r.note) : ''}" aria-label="${esc(k.ten)} buổi ${b}: ${esc((CM.find(x => x[0] === c) || [0, 0, 'chưa ghi'])[2])}">${c ? (CM.find(x => x[0] === c)[1]) : '·'}</button></td>`; }).join('')}</tr>`).join('');
  const avg = cols.map(b => { const v = D.active.map(k => ((D.hsBy[k.id] || {})[b] || {}).cm).filter(Boolean); return `<td class="muted sm" style="text-align:center">${v.length ? Math.round(100 * v.filter(x => x === 'c' || x === 't').length / v.length) + '%' : ''}</td>`; }).join('');
  return `<div class="card"><h2>Bản đồ các buổi học</h2><div class="hm-wrap"><table class="hm"><thead><tr><th class="nm">Buổi →</th>${head}</tr></thead><tbody>${rows}<tr><td class="nm muted sm">Có mặt</td>${avg}</tr></tbody></table></div>
    <div class="legend">✓ có mặt · T muộn · P vắng có phép · ✗ vắng. Viền xanh: tham gia nổi bật · viền vàng: cần hỗ trợ. Bấm một ô để mở buổi đó.${D.tl.length > 16 ? ' Đang hiện 16 buổi gần nhất.' : ''}</div></div>`;
}
function teachLinks(n) {
  const l = [], sd = S.lop === 'sd';
  if (n === 0) l.push({ t: 'Mở web khai giảng', href: `../khai-giang/?lop=${S.lop}` });
  else {
    if (n <= 7) l.push({ t: `Web dạy buổi ${n}`, href: `../buoi/?lop=${S.lop}&b=${n}` });
    l.push({ t: `Kịch bản buổi ${n} (từng màn, từng phút)`, href: KICHBAN });
    l.push({ t: sd ? `Giáo án & trình chiếu buổi ${n}` : `Học liệu & phiếu in buổi ${n}`, href: dayUrl(n) });
  }
  return l.filter(x => !x.dead);
}

/* =====================================================================
   HỌC SINH
   ===================================================================== */
function vHs() {
  const D = derive(), q = S.q.toLowerCase(), fl = new Set(flags(D).map(x => x.kid));
  const list = D.kids.filter(k => (!q || String(k.ten).toLowerCase().includes(q)) && (S.filt !== 'attn' || fl.has(k.id)) && (S.filt !== 'nghi' ? true : !!k.tt));
  const left = `<div class="card klistcard"><h2>Học sinh (${D.kids.length})</h2>
    <input type="text" id="kq" placeholder="Tìm theo tên…" value="${esc(S.q)}" aria-label="Tìm học sinh">
    <div class="chips" style="margin-top:8px"><button type="button" data-filt="" aria-pressed="${S.filt === ''}">Tất cả</button><button type="button" data-filt="attn" aria-pressed="${S.filt === 'attn'}">Cần chú ý</button><button type="button" data-filt="nghi" aria-pressed="${S.filt === 'nghi'}">Nghỉ học</button></div>
    <div class="klist">${list.map(k => { const i = D.info[k.id]; return `<button type="button" class="kitem ${k.tt ? 'off' : ''}" data-kid="${esc(k.id)}" aria-current="${S.kid === k.id}"><span><b>${esc(k.ten)}</b><br><span class="muted sm">${k.ngay || 0}/${LOPS[S.lop].tong} ngày web</span></span>${fl.has(k.id) ? '<span class="chip a">!</span>' : ''}${k.tt ? '<span class="chip">nghỉ</span>' : ''}${k.nguon === 'tu_nhap' ? '<span class="chip" title="Con tự nhập tên trên web, chưa có PIN">tự nhập</span>' : ''}${!S.lh && S.v7 && lhOf(k.lh) ? `<span class="chip b">${esc(lhName(k.lh))}</span>` : ''}</button>`; }).join('') || '<div class="empty">Không có bạn nào.</div>'}</div></div>`;
  return `<div class="split ${S.kid ? 'has-kid' : ''}">${left}<div class="kdetail">${S.kid && D.kids.some(k => k.id === S.kid) ? kidDetail(D) : '<div class="card"><div class="empty">Chọn một bạn ở danh sách để xem hồ sơ, điểm danh từng buổi và ghi chú.</div></div>'}</div></div>`;
}
function kidDetail(D) {
  const k = D.kids.find(x => x.id === S.kid), i = D.info[k.id], tong = LOPS[S.lop].tong, link = kidLink(k.id);
  const recs = Object.values(D.hsBy[k.id] || {}).sort((a, b) => b.buoi - a.buoi);
  const notes = S.d.gc.filter(g => g.kid === k.id), awards = S.d.awards.filter(a => a.kid === k.id && !a.huy);
  const f = x => x == null ? '–' : x.toFixed(1);
  const lvs = v => v === '' || v == null ? '·' : v;
  const canW = !S.v3;
  return `<div class="card"><button class="ghost back" type="button" data-back>‹ Danh sách</button>
    <div class="row"><h2 class="grow">${esc(k.ten)} <span class="chip">${esc(k.id)}</span> ${k.tt ? '<span class="chip">nghỉ học</span>' : ''}${k.nguon === 'tu_nhap' ? '<span class="chip" title="Con tự nhập tên trên web; cấp PIN để con học từ Unit 2">tự nhập tên</span>' : ''}</h2></div>
    <div class="facts"><div><b>${k.ngay || 0}/${tong}</b><span>ngày web đã học</span></div><div><b>${k.cuoi ? dm(k.cuoi) : '–'}</b><span>học web lần cuối</span></div>
      <div><b>${i.att == null ? '–' : Math.round(i.att * 100) + '%'}</b><span>chuyên cần (${i.nAtt} buổi)</span></div><div><b>${f(i.tg)}</b><span>tham gia (1–3)</span></div>
      <div><b>${f(i.en)} · ${f(i.zh)}</b><span>nói EN · ZH (1–3)</span></div><div><b>${i.stars}</b><span>tổng sao (web + cô)</span></div></div>
    ${S.v7 ? `<div class="row" style="margin-bottom:8px"><label class="sm" for="kmv">Lớp học</label><select id="kmv" data-mv="${esc(k.id)}" style="width:auto">${lhOpts(k.lh)}</select></div>` : ''}
    <div class="row"><button class="ghost" type="button" data-copy="${esc(link)}">🔗 Chép link (kèm PIN ở tab Tài khoản con)</button>
    ${canW ? `<button class="ghost" type="button" data-ren="${esc(k.id)}">✏️ Đổi tên</button><button class="ghost" type="button" data-tt="${esc(k.id)}" data-v="${k.tt ? '' : 'nghi'}">${k.tt ? 'Cho học lại' : 'Đánh dấu nghỉ học'}</button>` : ''}</div></div>
  <div class="card"><h3>Nhật ký từng buổi</h3>${recs.length ? `<div class="att-scroll"><table class="tbl"><thead><tr><th>Buổi</th><th>Có mặt</th><th>Tham gia</th><th>Nói EN</th><th>Nói ZH</th><th>Bài tập</th><th>Ghi chú</th></tr></thead><tbody>${recs.map(r => `<tr><td><a href="#" data-go-dd="${r.buoi}">${r.buoi}</a></td><td>${esc((CM.find(x => x[0] === r.cm) || [0, '·'])[1])}</td><td>${lvs(r.tg)}</td><td>${lvs(r.en)}</td><td>${lvs(r.zh)}</td><td>${lvs(r.bt)}</td><td>${esc(r.note)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Chưa có buổi nào được ghi cho bạn này.</div>'}
    <div class="legend">Mức 1 = cần hỗ trợ · 2 = ổn · 3 = nổi bật. Bài tập: 1 chưa làm · 2 một phần · 3 đủ.</div></div>
  <div class="card"><h3>Ghi chú về ${esc(k.ten)}</h3>
    ${canW ? `<div class="row"><select id="nl" aria-label="Loại ghi chú" style="width:auto">${Object.entries(LOAI).map(([a, b]) => `<option value="${a}">${b}</option>`).join('')}</select><input type="number" id="nb" min="0" max="48" placeholder="Buổi (tuỳ chọn)" style="width:150px"></div>
    ${S.v5 ? '<label class="share"><input type="checkbox" id="ncs" checked> Chia sẻ với con và ba mẹ (hiện trong Bảng của con). Bỏ chọn nếu là ghi chú riêng của cô.</label>' : ''}
    <textarea id="nt" placeholder="Ví dụ: hôm nay dám nói cả câu; ba mẹ hỏi về bài ở nhà…" aria-label="Nội dung ghi chú" style="margin-top:8px"></textarea><div style="margin-top:8px"><button class="btn" type="button" data-addnote="${esc(k.id)}">Lưu ghi chú</button></div>` : '<p class="muted">Cần máy chủ bản 4 để ghi chú.</p>'}
    <div class="timeline">${notes.map(g => `<div class="note ${g.loai}"><div class="meta"><span>${LOAI[g.loai] || LOAI.khac}${g.buoi !== '' ? ' · buổi ' + g.buoi : ''} · ${dmt(g.at)} ${g.cs ? '<span class="chip g">con và ba mẹ thấy</span>' : '<span class="chip">riêng của cô</span>'}</span><span>${S.v5 ? `<button class="ghost sm" type="button" data-share="${esc(g.id)}" data-v="${g.cs ? '0' : '1'}">${g.cs ? 'Ẩn với con' : 'Chia sẻ'}</button> ` : ''}<button class="ghost sm" type="button" data-delnote="${esc(g.id)}" aria-label="Xoá ghi chú">Xoá</button></span></div><p>${esc(g.nd)}</p></div>`).join('') || '<div class="empty">Chưa có ghi chú.</div>'}</div></div>
  <div class="card"><h3>Sao cô đã thưởng</h3>${awards.length ? `<p class="muted sm">${awards.slice(0, 12).map(a => `+${a.n}⭐ ${esc(a.why || '')} (${dmt(a.at)})`).join(' · ')}</p>` : '<div class="empty">Chưa thưởng sao.</div>'}</div>`;
}

/* =====================================================================
   ĐIỂM DANH & BUỔI HỌC
   ===================================================================== */
function ddInit(n) {
  const D = derive(), kh = KH(), last = D.tl.length ? D.tl[D.tl.length - 1] : -1;
  if (n == null) { const nx = kh.find(s => s.n > last); n = nx ? nx.n : last; }
  const bl = D.blBy[n] || {}, rows = {};
  D.active.forEach(k => { const r = (D.hsBy[k.id] || {})[n]; rows[k.id] = r ? { cm: r.cm, tg: r.tg, en: r.en, zh: r.zh, bt: r.bt, note: r.note } : { cm: '', tg: '', en: '', zh: '', bt: '', note: '' }; });
  S.dd = { n, ngay: bl.ngay || today(), da_day: bl.da_day !== undefined ? bl.da_day : true, ghi_chu: bl.ghi_chu || '', rows, dirty: false };
}
function vDd() {
  const D = derive(), kh = KH(); if (!S.dd || !kh.some(s => s.n === S.dd.n)) ddInit();
  const dd = S.dd, ss = kh.find(s => s.n === dd.n) || { vai: '', t: '', u: '' };
  const lc = lhCur(), khai = lc ? lc.khai_giang || '' : (S.d.cfg && S.d.cfg.khai_giang || '');
  const lhNote = S.v7 && LH().length ? (lc ? `<p class="lhnote">Đang ghi cho lớp <b>${esc(lc.ten)}</b>. Ngày dạy, ghi chú buổi và ngày khai giảng lưu riêng cho lớp này.</p>` : `<p class="lhnote warn">Đang xem ${S.lh === '_none' ? 'các bạn chưa xếp lớp' : 'cả khoá'}. Muốn ghi buổi cho đúng một lớp, chọn lớp ở ô <b>Lớp</b> trên đầu trang.</p>`) : '';
  const opt = kh.map(s => `<option value="${s.n}" ${s.n === dd.n ? 'selected' : ''}>Buổi ${s.n} · U${esc(s.u)} · ${esc(s.vai)}${D.tl.includes(s.n) ? ' ✓' : ''}</option>`).join('');
  const lv = (k, f) => { const v = dd.rows[k][f]; return `<button type="button" class="lv ${v ? 'l' + v : ''}" data-lv="${esc(k)}|${f}" aria-label="${f}: ${v || 'chưa ghi'}">${v || '–'}</button>`; };
  const trs = D.active.map(k => { const r = dd.rows[k.id]; return `<tr><td class="nm">${esc(k.ten)}</td>
    <td><div class="seg" role="group" aria-label="Có mặt: ${esc(k.ten)}">${CM.map(([c, sy, tt]) => `<button type="button" class="${c}" aria-pressed="${r.cm === c}" title="${tt}" data-cm="${esc(k.id)}|${c}">${sy}</button>`).join('')}</div></td>
    <td>${lv(k.id, 'tg')}</td><td>${lv(k.id, 'en')}</td><td>${lv(k.id, 'zh')}</td><td>${lv(k.id, 'bt')}</td>
    <td><input type="text" data-nt="${esc(k.id)}" value="${esc(r.note)}" placeholder="Ghi chú nhanh" aria-label="Ghi chú ${esc(k.ten)}"></td></tr>`; }).join('');
  return `<div class="card"><h2>Ghi buổi học</h2>${lhNote}
    <div class="row"><div class="grow"><label class="f" for="ds">Buổi</label><select id="ds">${opt}</select></div>
    <div><label class="f" for="dn">Ngày dạy</label><input type="date" id="dn" value="${esc(dd.ngay)}"></div></div>
    <p class="muted sm" style="margin:6px 0 0">${esc(ss.t)}</p>
    <label class="f" style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="dq" ${dd.da_day ? 'checked' : ''}> Đã dạy buổi này</label>
    <label class="f" for="dg">Ghi chú buổi (cái gì đã dạy, chưa kịp, điều chỉnh lần sau)</label><textarea id="dg" placeholder="Ví dụ: chưa kịp trò Bingo, buổi sau làm trước phần ôn…">${esc(dd.ghi_chu)}</textarea>
    <div class="row" style="margin-top:10px"><a class="ghost" href="${(teachLinks(dd.n)[0] || {}).href || '#'}" target="_blank" rel="noopener" ${teachLinks(dd.n).length ? '' : 'hidden'}>Mở web dạy buổi này</a>
    <span class="muted sm">Ngày khai giảng ${lc ? 'của lớp ' + esc(lc.ten) : 'của khoá'}:</span><input type="date" id="kg" value="${esc(khai)}" style="width:auto" ${S.v3 ? 'disabled' : ''}><button class="ghost sm" type="button" id="kgs" ${S.v3 ? 'disabled' : ''}>Lưu ngày</button></div></div>
  <div class="card"><h2>Điểm danh và ghi nhận từng bạn</h2>
    ${D.active.length ? `<div class="row"><button class="ghost" type="button" id="allc">✓ Tất cả có mặt</button><span class="muted sm">Bấm số để đổi mức: – → 1 → 2 → 3 → bỏ trống.</span></div>
    <div class="att-scroll"><table class="att"><thead><tr><th class="nm" style="text-align:left">Bạn</th><th>Có mặt</th><th>Tham gia</th><th>Nói EN</th><th>Nói ZH</th><th>Bài tập</th><th>Ghi chú</th></tr></thead><tbody>${trs}</tbody></table></div>
    <div class="legend">Tham gia, nói EN, nói ZH: 1 cần hỗ trợ · 2 ổn · 3 nổi bật. Bài tập (sách bài tập, web ở nhà): 1 chưa làm · 2 một phần · 3 đủ. Vắng thì để trống các mức.</div>`
    : '<div class="empty">Lớp chưa có bạn nào. Thêm bạn ở mục Sao & quà.</div>'}
    <div class="savebar"><button class="btn" type="button" id="dsave" ${S.v3 ? 'disabled' : ''}>Lưu buổi ${dd.n}</button><span class="muted sm" id="dstat">${S.v3 ? 'Cần máy chủ bản 4 để lưu.' : (D.tl.includes(dd.n) ? 'Buổi này đã có dữ liệu.' : 'Buổi này chưa ghi.')}</span></div></div>`;
}

/* =====================================================================
   SAO & QUÀ (dùng lại lệnh của Bảng của cô)
   ===================================================================== */
function vSq() {
  const D = derive(), d = S.d, ids = new Set(D.kids.map(k => k.id)), ord = d.orders.filter(o => ids.has(o.kid));
  const chips = D.active.map(k => `<button type="button" data-pick="${esc(k.id)}" aria-pressed="${S.sel.has(k.id)}">${esc(k.ten)}</button>`).join('');
  const aw = d.awards.filter(a => !a.huy && ids.has(a.kid)).slice(0, 12).map(a => { const k = D.kids.find(x => x.id === a.kid); return `<li>${esc(k ? k.ten : a.kid)} · <b>+${a.n}⭐</b> ${esc(a.why || '')} <span class="muted sm">(${dmt(a.at)})</span> <button class="ghost sm" type="button" data-un="${esc(a.id)}">Huỷ</button></li>`; }).join('');
  const ST = { cho: ['a', 'Chờ duyệt'], da_trao: ['g', 'Đã trao'], tu_choi: ['r', 'Không duyệt'] };
  const orows = ord.map(o => `<tr><td>${esc(o.ten)}</td><td>${esc(o.ten_qua)}</td><td>${o.sao}⭐</td><td>${dmt(o.at)}</td><td><span class="chip ${ST[o.st] ? ST[o.st][0] : ''}">${ST[o.st] ? ST[o.st][1] : esc(o.st)}</span>${o.st === 'cho' ? ` <button class="btn sm" type="button" data-o="${esc(o.code)}" data-st="da_trao">Đã trao</button> <button class="ghost sm" type="button" data-o="${esc(o.code)}" data-st="tu_choi">Không duyệt</button>` : ''}</td></tr>`).join('');
  return `<div class="grid g2"><div class="card"><h2>Thưởng sao</h2><div class="chips">${chips || '<span class="muted">Chưa có bạn.</span>'}</div>
    <div class="row" style="margin-top:10px"><button class="ghost sm" type="button" id="pall">Chọn cả lớp</button><button class="ghost sm" type="button" id="pnone">Bỏ chọn</button>
    <label class="sm" for="sn">Số sao</label><input type="number" id="sn" min="1" max="10" value="${S.n}" style="width:70px"></div>
    <label class="f" for="sw">Lý do</label><input type="text" id="sw" list="whys" value="${esc(S.why)}" maxlength="120"><datalist id="whys">${WHY.map(w => `<option value="${esc(w)}">`).join('')}</datalist>
    <div style="margin-top:10px"><button class="btn" type="button" id="give">Thưởng cho ${S.sel.size} bạn</button></div>
    <h3 style="margin-top:16px">Vừa thưởng</h3><ul class="attn" style="gap:4px">${aw || '<li class="muted">Chưa có lượt thưởng.</li>'}</ul></div>
    <div class="card"><h2>Thêm bạn mới</h2><div class="row"><input type="text" id="nk" maxlength="40" placeholder="Tên gọi ở lớp (không ghi họ tên đầy đủ)" aria-label="Tên bạn mới" class="grow"><button class="btn" type="button" id="addk">Thêm</button></div>
    <p class="muted sm">Mỗi bạn có một mã riêng. Sang mục Học sinh, mở hồ sơ rồi bấm “Chép link gửi ba mẹ” để gửi qua Zalo.</p></div></div>
  <div class="card"><h2>Phiếu đổi quà</h2>${ord.length ? `<div class="att-scroll"><table class="tbl"><thead><tr><th>Bạn</th><th>Quà</th><th>Sao</th><th>Ngày</th><th>Trạng thái</th></tr></thead><tbody>${orows}</tbody></table></div>` : '<div class="empty">Chưa có phiếu đổi quà.</div>'}</div>`;
}

/* =====================================================================
   TÀI NGUYÊN
   ===================================================================== */
function builtIn() {
  const L = S.lop, w = LOPS[L].web, g = [];
  const A = (nhom, ten, href, gc) => g.push({ nhom, ten, url: href, ghi_chu: gc || '' });
  A('Dạy trên lớp', 'Kịch bản 48 buổi offline (cả Little Seed và Seedling)', KICHBAN, 'Từng buổi 12–18 màn, đồ dùng, thang gợi ý, việc ở nhà. Chọn lớp và buổi ở thanh đầu trang. Có khung góp ý.');
  A('Dạy trên lớp', 'Buổi 0 · Khai giảng (web trình chiếu)', `../khai-giang/?lop=${L}`, '18 màn, 90 phút, có đồng hồ buổi');
  [1, 2, 3, 4, 5, 6, 7].forEach(n => A('Dạy trên lớp', `Web dạy buổi ${n} (Unit ${n <= 3 ? 1 : 2})`, `../buoi/?lop=${L}&b=${n}`, 'Mỗi unit dựng xong sẽ thêm buổi mới vào đây'));
  if (L === 'sd') { A('Dạy trên lớp', 'Giáo án, trình chiếu, big book, reader, đồ dùng in (48 buổi)', '../seedling/day/', 'Lớp & báo cáo từng buổi'); }
  else { A('Dạy trên lớp', 'Học liệu in và phiếu tô – dán', '../little-seed/day/', 'Phiếu theo buổi, flashcard, thủ công'); }
  A('Web của con', `Web học ${LOPS[L].ten} (link vào học của học viên)`, w, 'Gửi ba mẹ kèm ?con=MÃ: lấy link riêng từng bạn ở tab Tài khoản con hoặc Học sinh');
  A('Web của con', `Bản xem trước cho giáo viên (${LOPS[L].ten}, hiện đủ chữ)`, w + '?gv=1', 'Giáo viên vào kiểm tra nội dung các bài. Đừng thêm ?con=MÃ để khỏi lẫn vào tiến độ của bạn');
  A('Web của con', 'Bản đồ 99 ngày học web (xem trước)', w + '?gv=1#/ban-do', 'Chọn unit, chọn ngày để xem từng bài');
  A('Web của con', 'Hộp ôn, Phòng đổi quà, Hành trình của con (xem trước)', w + '?gv=1#/hop-on', 'Kiểm tra phần ôn và đổi quà');
  A('Web của con', 'Bảng của cô (thưởng sao, duyệt quà, cách cũ)', w + '#/co', 'Cũng dùng PIN lớp');
  return g;
}
function vTn() {
  const own = (S.d.tn || []), all = builtIn().concat(own.map(t => Object.assign({ own: 1 }, t)));
  const groups = []; all.forEach(r => { let g = groups.find(x => x.n === r.nhom); if (!g) groups.push(g = { n: r.nhom, l: [] }); g.l.push(r); });
  const order = ['Quản lý lớp', 'Dạy trên lớp', 'Web của con'], gs = groups.sort((a, b) => { const x = order.indexOf(a.n), y = order.indexOf(b.n); return (x < 0 ? 9 : x) - (y < 0 ? 9 : y); });
  const names = [...new Set(own.map(t => t.nhom).concat(['Quản lý lớp', 'Tài liệu khoá học', 'Bài hát & video', 'Phụ huynh']))];
  const ed = S.tnEdit, e = ed && ed !== 'new' ? own.find(t => t.id === ed) || {} : {};
  const form = ed ? `<div class="card"><h2>${ed === 'new' ? 'Thêm link' : 'Sửa link'}</h2>
    <label class="f" for="tt">Tên hiển thị</label><input type="text" id="tt" value="${esc(e.ten || '')}" maxlength="100">
    <label class="f" for="tu">Link (https://…)</label><input type="url" id="tu" value="${esc(e.url || '')}">
    <div class="row"><div class="grow"><label class="f" for="tg">Nhóm</label><input type="text" id="tg" list="tgs" value="${esc(e.nhom || 'Tài liệu khoá học')}" maxlength="40"><datalist id="tgs">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist></div>
    <div><label class="f" for="to">Thứ tự</label><input type="number" id="to" value="${e.thu_tu || 0}" style="width:90px"></div></div>
    <label class="f" for="tk">Ghi chú</label><input type="text" id="tk" value="${esc(e.ghi_chu || '')}" maxlength="200">
    <div class="row" style="margin-top:10px"><button class="btn" type="button" id="tsave" data-id="${esc(ed === 'new' ? '' : ed)}">Lưu link</button><button class="ghost" type="button" id="tcancel">Huỷ</button></div></div>` : '';
  return `<div class="card"><div class="row"><h2 class="grow">Tài nguyên của lớp ${esc(LOPS[S.lop].ten)}</h2>${S.v3 ? '' : '<button class="btn" type="button" id="tnew">+ Thêm link</button>'}</div>
    <p class="muted sm" style="margin:0 0 12px">Các web của chương trình hiện sẵn. Link riêng (thư mục Drive, Sheet, nhóm Zalo, sách bài tập…) cô thêm ở đây; chúng lưu trong Google Sheet của cô, chỉ hiện sau khi nhập PIN.</p>
    ${gs.map(g => `<div class="rgrp"><h3>${esc(g.n)}</h3><div class="rlist">${g.l.map(r => `<div class="res"><a href="${esc(r.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><b>${esc(r.ten)}</b>${r.ghi_chu ? `<br><small>${esc(r.ghi_chu)}</small>` : ''}</a>${r.own ? `<div class="acts"><button class="ghost" type="button" data-tedit="${esc(r.id)}">Sửa</button><button class="ghost danger" type="button" data-tdel="${esc(r.id)}">Xoá</button></div>` : ''}</div>`).join('')}</div></div>`).join('')}
    <div class="rgrp"><h3>Học liệu từng buổi (48 buổi) và xem trước từng ngày web (99 ngày)</h3><p class="muted sm">Bấm số buổi để mở sách bài tập, giáo án hoặc học liệu in của buổi đó. Kịch bản từng màn: <a href="${KICHBAN}" target="_blank" rel="noopener">mở trang kịch bản</a> rồi chọn đúng lớp và buổi.</p><div class="chips"><b class="muted sm" style="align-self:center">Buổi:</b>${Array.from({ length: 48 }, (_, i) => `<a class="ghost sm" style="padding:6px 10px;text-decoration:none" href="${dayUrl(i + 1)}" target="_blank" rel="noopener">${i + 1}</a>`).join('')}</div><div class="chips" style="margin-top:8px"><b class="muted sm" style="align-self:center">Ngày web:</b>${Array.from({ length: 99 }, (_, i) => `<a class="ghost sm" style="padding:6px 10px;text-decoration:none" href="${LOPS[S.lop].web}?gv=1#/ngay/${i + 1}" target="_blank" rel="noopener">${i + 1}</a>`).join('')}</div></div>
    ${!own.length && !S.v3 ? '<div class="empty" style="margin-top:14px">Chưa có link riêng nào. Bấm “+ Thêm link” để thêm thư mục Drive của khoá học, Google Sheet, nhóm Zalo…</div>' : ''}</div>${form}`;
}

/* =====================================================================
   LỚP HỌC (bản 7): tạo lớp, xếp lớp, chuyển lớp
   ===================================================================== */
const lhKhac = () => S.lhAll.filter(l => l.khoa !== S.lop);   // lớp của khoá kia: chuyển sang = chuyển khoá
function lhOpts(cur) { const kh = lhKhac();
  return `<option value="" ${!cur || !lhOf(cur) ? 'selected' : ''}>Chưa xếp lớp</option><optgroup label="${esc(LOPS[S.lop].ten)}">` + LH().map(l => `<option value="${esc(l.id)}" ${cur === l.id ? 'selected' : ''}>${esc(l.ten)}</option>`).join('') + '</optgroup>'
    + (kh.length ? `<optgroup label="Chuyển khoá → ${esc(LOPS[kh[0].khoa].ten)}">` + kh.map(l => `<option value="${esc(l.id)}">${esc(LOPS[l.khoa].ten)} · ${esc(l.ten)}</option>`).join('') + '</optgroup>' : ''); }
async function moveKids(ids, lh) {
  if (!ids.length) return toast('Chọn ít nhất một bạn');
  const x = lhKhac().find(l => l.id === lh);
  if (x && !confirm(`Chuyển ${ids.length} bạn sang ${LOPS[x.khoa].ten} · ${x.ten}?\n\n• Sao trong ví, thú cưng, quái vật được giữ.\n• Tiến độ ${LOPS[S.lop].ten} cất làm lịch sử; web ${LOPS[x.khoa].ten} học từ ngày 1.\n• Link riêng của con giữ nguyên, tự mở web mới.`)) return;
  const r = await call('qt_chuyen', { ids, lh }); if (!r.ok) return toast(r.err || 'Chưa chuyển được');
  toast(x ? `Đã chuyển ${r.n} bạn sang ${LOPS[x.khoa].ten} · ${x.ten}` : lh ? `Đã xếp ${r.n} bạn vào lớp ${lhName(lh)}` : `Đã đưa ${r.n} bạn về "Chưa xếp lớp"`); S.lhSel = new Set(); refresh(true);
}
function vLh() {
  if (!S.v7) return `<div class="card"><h2>Lớp học</h2><p>Mục này cần máy chủ bản 7. Cô mở Google Sheet quản lý → <b>Tiện ích mở rộng → Apps Script</b>, dán Code.gs mới, rồi <b>Triển khai → Quản lý triển khai → ✏️ → Phiên bản mới → Triển khai</b>. Link máy chủ giữ nguyên.</p></div>`;
  const ls = LH(), all = S.d.kids.filter(k => !k.tt), ed = S.lhEdit, e = ed && ed !== 'new' ? lhOf(ed) || {} : {};
  const cards = ls.map(l => { const ks = all.filter(k => k.lh === l.id), np = ks.filter(k => !k.pin).length;
    return `<div class="lhcard ${S.lh === l.id ? 'on' : ''}"><div class="lhc-t"><b>${esc(l.ten)}</b><span class="chip g">${ks.length} bạn</span></div>
      <div class="muted sm">${esc(l.lich || 'Chưa ghi lịch học')}${l.khai_giang ? ' · khai giảng ' + dm(l.khai_giang) + '/' + l.khai_giang.slice(0, 4) : ''}</div>
      ${l.ghi_chu ? `<div class="sm" style="margin-top:4px">${esc(l.ghi_chu)}</div>` : ''}${np ? `<div class="sm" style="margin-top:4px"><span class="chip a">${np} bạn chưa có PIN</span></div>` : ''}
      <div class="row" style="margin-top:10px"><button class="btn sm" type="button" data-lhview="${esc(l.id)}">Xem lớp này</button><button class="ghost sm" type="button" data-lhedit="${esc(l.id)}">Sửa</button><button class="ghost sm danger" type="button" data-lhdel="${esc(l.id)}">Xoá</button></div></div>`; }).join('');
  const none = all.filter(k => !k.lh || !lhOf(k.lh)).length;
  const form = ed ? `<div class="card"><h2>${ed === 'new' ? 'Tạo lớp mới' : 'Sửa lớp ' + esc(e.ten || '')}</h2>
    <div class="row"><div class="grow"><label class="f" for="lht">Tên lớp</label><input type="text" id="lht" maxlength="60" value="${esc(e.ten || '')}" placeholder="Ví dụ: Little Seed · Thứ 7 sáng · CES Cầu Giấy"></div>
    <div><label class="f" for="lhk">Ngày khai giảng</label><input type="date" id="lhk" value="${esc(e.khai_giang || '')}"></div></div>
    <label class="f" for="lhl">Lịch học</label><input type="text" id="lhl" maxlength="120" value="${esc(e.lich || '')}" placeholder="Ví dụ: Thứ 4 18:00 và Chủ nhật 9:00">
    <label class="f" for="lhg">Ghi chú (giáo viên, phòng học…)</label><input type="text" id="lhg" maxlength="300" value="${esc(e.ghi_chu || '')}">
    <div class="row" style="margin-top:10px"><button class="btn" type="button" id="lhsave" data-id="${esc(ed === 'new' ? '' : ed)}">${ed === 'new' ? 'Tạo lớp' : 'Lưu'}</button><button class="ghost" type="button" id="lhcancel">Huỷ</button></div></div>` : '';
  const F = S.lhFilt, list = all.filter(k => F === 'all' ? true : F === 'none' ? !k.lh || !lhOf(k.lh) : !!k.pin).sort((a, b) => String(a.ten).localeCompare(String(b.ten), 'vi'));
  const sel = list.filter(k => S.lhSel.has(k.id));
  const rows = list.map(k => `<tr><td><input type="checkbox" data-lhpick="${esc(k.id)}" ${S.lhSel.has(k.id) ? 'checked' : ''} aria-label="Chọn ${esc(k.ten)}"></td>
    <td><b>${esc(k.ten)}</b><br><span class="muted sm">${esc(k.id)}</span></td><td>${k.pin ? '<span class="chip g">có PIN</span>' : '<span class="chip a">chưa có PIN</span>'}</td>
    <td><select data-lhmv="${esc(k.id)}" aria-label="Lớp của ${esc(k.ten)}">${lhOpts(k.lh)}</select></td></tr>`).join('');
  return `<div class="card"><div class="row"><h2 class="grow">Lớp học · ${esc(LOPS[S.lop].ten)}</h2><button class="btn" type="button" id="lhnew">+ Tạo lớp mới</button></div>
    <p class="muted sm" style="margin:0 0 12px">Nhiều lớp ở CES dùng chung web ${esc(LOPS[S.lop].ten)}. Mỗi bạn thuộc một lớp; chọn lớp ở ô <b>Lớp</b> trên đầu trang để mọi mục (tổng quan, điểm danh, sao, tài khoản) chỉ hiện các bạn của lớp đó.</p>
    ${ls.length ? `<div class="lhgrid">${cards}</div>` : '<div class="empty">Khoá này chưa có lớp nào. Bấm “+ Tạo lớp mới”.</div>'}
    ${none ? `<p class="sm" style="margin-top:10px"><span class="chip a">${none} bạn chưa xếp lớp</span></p>` : ''}</div>${form}
  <div class="card"><div class="row"><h2 class="grow">Xếp lớp và chuyển lớp</h2>
    <div class="chips"><button type="button" data-lhf="pin" aria-pressed="${F === 'pin'}">Đã có PIN</button><button type="button" data-lhf="none" aria-pressed="${F === 'none'}">Chưa xếp lớp</button><button type="button" data-lhf="all" aria-pressed="${F === 'all'}">Tất cả</button></div></div>
    <p class="muted sm">Đổi lớp của từng bạn ở cột Lớp, hoặc chọn nhiều bạn rồi chuyển một lần. Chuyển lớp không làm mất sao, tiến độ web hay lịch sử điểm danh của con.</p>
    ${LH().length ? `<div class="row lhbulk"><button class="ghost sm" type="button" id="lhall">${sel.length === list.length && list.length ? 'Bỏ chọn hết' : 'Chọn hết'}</button><span class="sm">Chuyển <b>${sel.length}</b> bạn đã chọn sang</span><select id="lhto" style="width:auto">${lhOpts(S.lh && S.lh !== '_none' ? S.lh : (LH()[0] || {}).id)}</select><button class="btn sm" type="button" id="lhgo" ${sel.length ? '' : 'disabled'}>Chuyển</button></div>` : '<p class="muted">Tạo ít nhất một lớp để xếp các bạn vào.</p>'}
    ${list.length ? `<div class="att-scroll"><table class="tbl"><thead><tr><th></th><th>Con</th><th>PIN</th><th>Lớp</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty">Không có bạn nào trong nhóm này. Tạo tài khoản và PIN cho các con ở mục <b>Tài khoản con</b>.</div>'}</div>`;
}
function bindLh(root) {
  if (S.tab !== 'lh' || !S.v7) return;
  const nw = $('#lhnew', root); if (nw) nw.onclick = () => { S.lhEdit = 'new'; draw(); $('#lht').focus(); };
  $$('[data-lhedit]', root).forEach(b => b.onclick = () => { S.lhEdit = b.dataset.lhedit; draw(); $('#lht').focus(); });
  const c = $('#lhcancel', root); if (c) c.onclick = () => { S.lhEdit = null; draw(); };
  const sv = $('#lhsave', root); if (sv) sv.onclick = async () => { const ten = $('#lht').value.trim(); if (!ten) return toast('Nhập tên lớp'); sv.disabled = true;
    const r = await call('qt_lh_luu', { id: sv.dataset.id, ten, lich: $('#lhl').value.trim(), khai_giang: $('#lhk').value, ghi_chu: $('#lhg').value.trim() }); sv.disabled = false;
    if (!r.ok) return toast(r.err || 'Chưa lưu được'); toast(sv.dataset.id ? 'Đã lưu lớp' : 'Đã tạo lớp ' + ten); S.lhEdit = null; refresh(true); };
  $$('[data-lhdel]', root).forEach(b => b.onclick = async () => { const l = lhOf(b.dataset.lhdel); if (!confirm(`Xoá lớp ${l.ten}? Chỉ xoá được khi lớp không còn bạn nào.`)) return;
    const r = await call('qt_lh_xoa', { id: l.id }); if (!r.ok) return toast(r.err || 'Chưa xoá được'); if (S.lh === l.id) { S.lh = ''; store.set('qtl-lh-' + S.lop, ''); } toast('Đã xoá lớp'); refresh(true); });
  $$('[data-lhview]', root).forEach(b => b.onclick = () => { S.lh = b.dataset.lhview; store.set('qtl-lh-' + S.lop, S.lh); S.tab = 'tq'; S.kid = ''; S.dd = null; draw(); scrollTo(0, 0); });
  $$('[data-lhf]', root).forEach(b => b.onclick = () => { S.lhFilt = b.dataset.lhf; S.lhSel = new Set(); draw(); });
  $$('[data-lhpick]', root).forEach(x => x.onchange = () => { x.checked ? S.lhSel.add(x.dataset.lhpick) : S.lhSel.delete(x.dataset.lhpick); keepDraw(); });
  const al = $('#lhall', root); if (al) al.onclick = () => { const ids = $$('[data-lhpick]', root).map(x => x.dataset.lhpick); if (ids.every(i => S.lhSel.has(i))) S.lhSel = new Set(); else ids.forEach(i => S.lhSel.add(i)); keepDraw(); };
  const go = $('#lhgo', root); if (go) go.onclick = () => moveKids([...S.lhSel], $('#lhto').value);
  $$('[data-lhmv]', root).forEach(x => x.onchange = () => moveKids([x.dataset.lhmv], x.value));
}

/* =====================================================================
   SỰ KIỆN
   ===================================================================== */
function bind() {
  const root = $('#main');
  $$('[data-kid]', root).forEach(el => { const go = () => { S.kid = el.dataset.kid; S.tab = 'hs'; draw(); scrollTo(0, 0); }; el.onclick = go; el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
  $$('[data-go-dd]', root).forEach(el => el.onclick = e => { e.preventDefault(); ddInit(+el.dataset.goDd); S.tab = 'dd'; draw(); scrollTo(0, 0); });
  const kq = $('#kq'); if (kq) kq.oninput = () => { S.q = kq.value; const p = kq.selectionStart; draw(); const n = $('#kq'); n.focus(); n.setSelectionRange(p, p); };
  $$('[data-filt]', root).forEach(b => b.onclick = () => { S.filt = b.dataset.filt; draw(); });
  const bk = $('[data-back]', root); if (bk) bk.onclick = () => { S.kid = ''; draw(); };
  $$('[data-copy]', root).forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); toast('Đã chép link. Dán vào Zalo gửi ba mẹ nhé.'); } catch (e) { prompt('Chép link này:', b.dataset.copy); } });
  $$('[data-ren]', root).forEach(b => b.onclick = async () => { const k = S.d.kids.find(x => x.id === b.dataset.ren), t = prompt('Tên gọi ở lớp:', k.ten); if (!t || !t.trim()) return; const r = await call('qt_hs', { id: k.id, ten: t.trim() }); if (!r.ok) return toast(r.err || 'Chưa đổi được'); toast('Đã đổi tên'); refresh(true); });
  $$('[data-tt]', root).forEach(b => b.onclick = async () => { const r = await call('qt_hs', { id: b.dataset.tt, tt: b.dataset.v }); if (!r.ok) return toast(r.err || 'Chưa lưu được'); toast(b.dataset.v ? 'Đã đánh dấu nghỉ học (không tính vào sĩ số và cảnh báo)' : 'Đã cho học lại'); refresh(true); });
  $$('[data-addnote]', root).forEach(b => b.onclick = async () => { const nd = $('#nt').value.trim(); if (!nd) return toast('Chưa có nội dung ghi chú'); b.disabled = true;
    const r = await call('qt_gc_them', { kid: b.dataset.addnote, loai: $('#nl').value, buoi: $('#nb').value, noi_dung: nd, chia_se: $('#ncs') && $('#ncs').checked ? '1' : '' }); b.disabled = false; if (!r.ok) return toast(r.err || 'Chưa lưu được'); toast('Đã lưu ghi chú'); refresh(true); });
  $$('[data-delnote]', root).forEach(b => b.onclick = async () => { if (!confirm('Xoá ghi chú này?')) return; await call('qt_gc_xoa', { id: b.dataset.delnote }); toast('Đã xoá'); refresh(true); });
  $$('[data-share]', root).forEach(b => b.onclick = async () => { const r = await call('qt_gc_chia', { id: b.dataset.share, v: b.dataset.v }); if (!r.ok) return toast(r.err || 'Chưa lưu được'); toast(b.dataset.v === '1' ? 'Con và ba mẹ sẽ thấy nhận xét này' : 'Đã ẩn khỏi Bảng của con'); refresh(true); });
  const mv = $('[data-mv]', root); if (mv) mv.onchange = () => moveKids([mv.dataset.mv], mv.value);
  bindDd(root); bindSq(root); bindTn(root); bindTk(root); bindLh(root);
}
function bindDd(root) {
  const dd = S.dd; if (!dd || S.tab !== 'dd') return;
  const ds = $('#ds'); if (!ds) return;
  ds.onchange = () => { if (dd.dirty && !confirm('Buổi này có thay đổi chưa lưu. Chuyển buổi khác?')) { ds.value = dd.n; return; } ddInit(+ds.value); draw(); };
  $('#dn').onchange = e => { dd.ngay = e.target.value; dd.dirty = true; };
  $('#dq').onchange = e => { dd.da_day = e.target.checked; dd.dirty = true; };
  $('#dg').oninput = e => { dd.ghi_chu = e.target.value; dd.dirty = true; };
  $$('[data-cm]', root).forEach(b => b.onclick = () => { const [k, c] = b.dataset.cm.split('|'), r = dd.rows[k]; r.cm = r.cm === c ? '' : c;
    if (c === 'v' || c === 'p') { if (r.cm === c) { r.tg = r.en = r.zh = r.bt = ''; } } dd.dirty = true; keepDraw(); });
  $$('[data-lv]', root).forEach(b => b.onclick = () => { const [k, f] = b.dataset.lv.split('|'), r = dd.rows[k], v = r[f] === '' ? 1 : r[f] >= 3 ? '' : r[f] + 1; r[f] = v; if (v !== '' && !r.cm) r.cm = 'c'; dd.dirty = true; keepDraw(); });
  $$('[data-nt]', root).forEach(i => i.oninput = () => { dd.rows[i.dataset.nt].note = i.value; dd.dirty = true; });
  const all = $('#allc'); if (all) all.onclick = () => { Object.values(dd.rows).forEach(r => { if (!r.cm) r.cm = 'c'; }); dd.dirty = true; keepDraw(); };
  const kgs = $('#kgs'); if (kgs) kgs.onclick = async () => { const v = $('#kg').value, lc = lhCur(); const r = lc ? await call('qt_lh_luu', { id: lc.id, ten: lc.ten, lich: lc.lich, ghi_chu: lc.ghi_chu, khai_giang: v }) : await call('qt_lop', { khai_giang: v }); if (!r.ok) return toast(r.err || 'Chưa lưu được'); toast('Đã lưu ngày khai giảng'); refresh(true); };
  const sv = $('#dsave'); if (sv) sv.onclick = async () => { sv.disabled = true; sv.textContent = 'Đang lưu…';
    const rows = Object.entries(dd.rows).map(([kid, r]) => Object.assign({ kid }, r)).filter(r => r.cm || r.tg || r.en || r.zh || r.bt || r.note);
    const r = await call('qt_buoi', { buoi: dd.n, ngay: dd.ngay, da_day: dd.da_day, ghi_chu: dd.ghi_chu, rows, lh: (lhCur() || {}).id || '' });
    if (!r.ok) { sv.disabled = false; sv.textContent = `Lưu buổi ${dd.n}`; return toast(r.err || 'Chưa lưu được'); }
    dd.dirty = false; toast(`Đã lưu buổi ${dd.n} (${r.n} bạn)`); const n = dd.n; await load(); ddInit(n); draw(); };
}
function keepDraw() { const y = scrollY, sc = $('.att-scroll'), x = sc ? sc.scrollLeft : 0; draw(); scrollTo(0, y); const s2 = $('.att-scroll'); if (s2) s2.scrollLeft = x; }
function bindSq(root) {
  $$('[data-pick]', root).forEach(b => b.onclick = () => { const id = b.dataset.pick; S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); S.n = +$('#sn').value || 1; S.why = $('#sw').value; keepDraw(); });
  const pa = $('#pall'); if (pa) pa.onclick = () => { derive().active.forEach(k => S.sel.add(k.id)); S.n = +$('#sn').value || 1; S.why = $('#sw').value; draw(); };
  const pn = $('#pnone'); if (pn) pn.onclick = () => { S.sel.clear(); draw(); };
  const gv = $('#give'); if (gv) gv.onclick = async () => { if (!S.sel.size) return toast('Chọn ít nhất một bạn'); const n = Math.max(1, Math.min(10, +$('#sn').value || 1)), why = $('#sw').value.trim();
    gv.disabled = true; const r = await call('award', { ids: [...S.sel].join(','), n, why }); gv.disabled = false; if (!r.ok) return toast(r.err || 'Chưa thưởng được');
    toast(`Đã thưởng ${n}⭐ cho ${r.n} bạn`); S.sel.clear(); S.n = n; S.why = why || WHY[0]; refresh(true); };
  $$('[data-un]', root).forEach(b => b.onclick = async () => { await call('unaward', { aid: b.dataset.un }); toast('Đã huỷ lượt thưởng'); refresh(true); });
  $$('[data-o]', root).forEach(b => b.onclick = async () => { await call('order', { code: b.dataset.o, st: b.dataset.st }); toast(b.dataset.st === 'da_trao' ? 'Đã ghi: cô đã trao quà' : 'Đã ghi: không duyệt, sao hoàn lại cho bạn'); refresh(true); });
  const ak = $('#addk'); if (ak) ak.onclick = async () => { const t = $('#nk').value.trim(); if (!t) return toast('Nhập tên gọi của bạn'); const r = await call('addkid', { ten: t }); if (!r.ok) return toast(r.err || 'Chưa thêm được'); toast('Đã thêm bạn. Mã: ' + r.id); await refresh(true); S.kid = r.id; };
}
function bindTn(root) {
  const nw = $('#tnew'); if (nw) nw.onclick = () => { S.tnEdit = 'new'; draw(); $('#tt').focus(); };
  $$('[data-tedit]', root).forEach(b => b.onclick = () => { S.tnEdit = b.dataset.tedit; draw(); $('#tt').focus(); });
  $$('[data-tdel]', root).forEach(b => b.onclick = async () => { if (!confirm('Xoá link này khỏi kho tài nguyên?')) return; await call('qt_tn_xoa', { id: b.dataset.tdel }); toast('Đã xoá'); refresh(true); });
  const c = $('#tcancel'); if (c) c.onclick = () => { S.tnEdit = null; draw(); };
  const sv = $('#tsave'); if (sv) sv.onclick = async () => { const url = $('#tu').value.trim(); if (!/^https?:\/\//i.test(url)) return toast('Link phải bắt đầu bằng https://');
    const r = await call('qt_tn_luu', { id: sv.dataset.id, ten: $('#tt').value.trim() || url, url, nhom: $('#tg').value.trim() || 'Khác', thu_tu: $('#to').value, ghi_chu: $('#tk').value.trim() });
    if (!r.ok) return toast(r.err || 'Chưa lưu được'); S.tnEdit = null; toast('Đã lưu link'); refresh(true); };
}
document.addEventListener('click', e => {
  const l = e.target.closest('[data-lop]'); if (l) { const v = l.dataset.lop; if (v === S.lop) return; S.lop = v; keep.set('qtl-lop', v); S.d = null; S.kid = ''; S.dd = null; S.sel = new Set(); S.tnEdit = null; enter(1); return; }
  const t = e.target.closest('[data-tab]'); if (t) { S.tab = t.dataset.tab; if (S.tab === 'hs') S.kid = S.kid; draw(); scrollTo(0, 0); }
});
$('#logout').onclick = () => { setTok(''); S.d = null; S.toi = null; login(); };

/* =====================================================================
   MÁY CHỦ GIẢ cho ?demo=1 (localStorage)
   ===================================================================== */
/* =====================================================================
   TÀI KHOẢN CÁC CON: PIN 4 số, máy đã nhớ, in thẻ (có QR)
   ===================================================================== */
const kidLink = id => { const k = (S.d && S.d.kids.find(x => x.id === id)) || {}, base = location.origin + location.pathname.replace(/quan-tri-lop\/.*$/, '');
  return k.link ? base + 'con/?k=' + k.link : base + (S.lop === 'ls' ? 'little-seed/' : 'seedling/') + '?con=' + id; };   // bản 10: link riêng của con
const uaShort = m => (m && m.ua) || 'máy';
const tAgo = t => { if (!t) return ''; const n = Math.round((Date.now() - t) / 864e5); return n <= 0 ? 'hôm nay' : n + ' ngày trước'; };
function vTk() {
  if (!S.v5) return '<div class="card"><h2>Tài khoản các con</h2><p class="muted">Cần máy chủ bản 5. Dán Code.gs bản 5 theo HUONG-DAN.md rồi quay lại đây.</p></div>';
  const kids = S.d.kids.filter(k => !k.tt && inLh(k)), noPin = kids.filter(k => !k.pin), mm = S.d.max_may || 2, lc = lhCur();
  const sel = kids.filter(k => S.tkSel.has(k.id));
  const rows = kids.map(k => { const cho = k.cho || [], may = k.may || [];
    return `<tr class="${cho.length ? 'wait' : ''}"><td><input type="checkbox" data-tksel="${esc(k.id)}" ${S.tkSel.has(k.id) ? 'checked' : ''} aria-label="Chọn ${esc(k.ten)}"></td>
      <td><b>${esc(k.ten)}</b><br><span class="muted sm">${esc(k.id)}</span></td>
      <td>${k.link ? `<code class="lnk">${esc(kidLink(k.id).replace(/^https?:\/\//, ''))}</code><div class="row" style="gap:4px;margin-top:4px"><button class="ghost sm" type="button" data-lkcp="${esc(k.id)}">📋 Chép link</button><button class="ghost sm" type="button" data-lknew="${esc(k.id)}">Đổi link</button></div>` : `<button class="ghost sm" type="button" data-lknew="${esc(k.id)}">Tạo link riêng</button>`}
        ${cho.map(m => `<div class="chip b wrapchip">⏳ ${esc(uaShort(m))} xin vào <button class="ghost sm" type="button" data-mayok="${esc(k.id)}|${esc(m.d)}">Duyệt</button> <button class="ghost sm" type="button" data-mayno="${esc(k.id)}|${esc(m.d)}">Từ chối</button></div>`).join('')}</td>
      <td class="sm muted">${k.cuoi ? 'học web ' + dm(k.cuoi) : 'chưa mở web'}${(k.lich_su || []).length ? `<br>đã học ${k.lich_su.map(x => esc(LOPS[x.lop] ? LOPS[x.lop].ten : x.lop) + ' ' + x.ngay + ' ngày').join(', ')}` : ''}</td></tr>`; }).join('');
  return `<div class="card"><h2>Tài khoản các con · ${LOPS[S.lop].ten}</h2>
    <p class="muted">Mỗi con có <b>một link riêng</b>. Ba mẹ mở link (hoặc quét QR trên thẻ) là vào học ngay, không cần đăng nhập; tiến độ lưu theo con, đổi máy vẫn giữ. Link tự mở đúng web Little Seed hay Seedling, kể cả sau khi con chuyển khoá. Lộ link thì bấm <b>Đổi link</b>: link cũ hết dùng.</p>
    <div class="row"><textarea id="tkNew" rows="3" placeholder="Dán danh sách tên, mỗi dòng một bạn (chỉ tên gọi ở lớp)" style="flex:1;min-width:200px">${esc(S.tkNew)}</textarea><button class="btn" type="button" id="tkAdd">➕ Tạo tài khoản</button></div>
    ${S.v7 && LH().length ? `<p class="muted sm">${lc ? `Các bạn mới sẽ vào lớp <b>${esc(lc.ten)}</b>.` : 'Các bạn mới chưa có lớp. Chọn một lớp ở ô <b>Lớp</b> trên đầu trang trước khi tạo để xếp luôn, hoặc xếp sau ở mục Lớp học.'}</p>` : ''}
    <p class="muted sm">Lưu ý: chỉ nhập tên gọi ở lớp. Cô nên xin ba mẹ đồng ý cho con dùng web và lưu tiến độ học (có thể ghi sẵn vào phiếu đăng ký).</p></div>
  <div class="card"><div class="row"><h3 class="grow">Danh sách (${kids.length})</h3>
    <button class="ghost" type="button" id="tkAll">${sel.length === kids.length && kids.length ? 'Bỏ chọn hết' : 'Chọn hết'}</button>
    ${kids.some(k => !k.link) ? `<button class="ghost" type="button" id="tkLinkAll">Tạo link cho ${kids.filter(k => !k.link).length} bạn chưa có</button>` : ''}
    <button class="btn" type="button" id="tkPrint" ${sel.length ? '' : 'disabled'}>🖨️ In thẻ (${sel.length})</button></div>
    ${kids.length ? `<div class="att-scroll"><table class="tbl tk"><thead><tr><th></th><th>Con</th><th>Link riêng</th><th>Học web</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty">Chưa có bạn nào.</div>'}
    <p class="muted sm">Gửi link riêng cho từng ba mẹ qua Zalo (nhắn riêng) hoặc in thẻ có QR phát tại lớp. Đừng đăng link lên nhóm chung: ai có link là vào được bài của con.</p></div>`;
}
function bindTk(root) {
  if (!S.v5) return;
  const tk = $('#tkNew', root); if (tk) tk.oninput = () => { S.tkNew = tk.value; };
  const add = $('#tkAdd', root); if (add) add.onclick = async () => { const names = S.tkNew.split('\n').map(x => x.trim()).filter(Boolean); if (!names.length) return toast('Chưa có tên nào');
    add.disabled = true; const r = await call('qt_kids_them', { ten: names, lh: (lhCur() || {}).id || '' }); add.disabled = false; if (!r.ok) return toast(r.err || 'Chưa tạo được');
    S.tkNew = ''; (r.kids || []).forEach(k => S.tkSel.add(k.id)); toast(`Đã tạo ${r.kids.length} tài khoản. Các bạn mới đã được chọn sẵn để in thẻ.`); refresh(true); };
  $$('[data-tksel]', root).forEach(c => c.onchange = () => { c.checked ? S.tkSel.add(c.dataset.tksel) : S.tkSel.delete(c.dataset.tksel); draw(); });
  const all = $('#tkAll', root); if (all) all.onclick = () => { const ks = S.d.kids.filter(k => !k.tt && inLh(k)); if (ks.every(k => S.tkSel.has(k.id))) S.tkSel.clear(); else ks.forEach(k => S.tkSel.add(k.id)); draw(); };
  const la = $('#tkLinkAll', root); if (la) la.onclick = async () => { const ids = S.d.kids.filter(k => !k.tt && inLh(k) && !k.link).map(k => k.id); const r = await call('qt_link', { ids }); if (!r.ok) return toast(r.err || 'Chưa tạo được'); toast(`Đã tạo link cho ${r.kids.length} bạn`); refresh(true); };
  $$('[data-lkcp]', root).forEach(b => b.onclick = async () => { const k = S.d.kids.find(x => x.id === b.dataset.lkcp); const t = `Link học web của ${k.ten}: ${kidLink(k.id)}\nBa mẹ mở link này là con vào học ngay, không cần đăng nhập. Xin giữ link riêng cho con nhé.`;
    try { await navigator.clipboard.writeText(t); toast('Đã chép link của ' + k.ten); } catch (e) { prompt('Chép link:', kidLink(k.id)); } });
  $$('[data-lknew]', root).forEach(b => b.onclick = async () => { const k = S.d.kids.find(x => x.id === b.dataset.lknew); if (k.link && !confirm(`Đổi link của ${k.ten}? Link cũ sẽ không vào được nữa, cần gửi link mới cho ba mẹ.`)) return;
    const r = await call('qt_link', { ids: [k.id] }); if (!r.ok) return toast(r.err || 'Chưa đổi được'); toast('Đã tạo link mới cho ' + k.ten); refresh(true); });
  const pa = $('#tkPinAll', root); if (pa) pa.onclick = async () => { const r = await call('qt_pin', { mode: 'moi', tat_ca: '1' }); if (!r.ok) return toast(r.err || 'Chưa cấp được'); (r.kids || []).forEach(k => S.tkSel.add(k.id)); toast(`Đã cấp PIN cho ${r.kids.length} bạn`); refresh(true); };
  $$('[data-pinnew]', root).forEach(b => b.onclick = async () => { const k = S.d.kids.find(x => x.id === b.dataset.pinnew); if (k.pin && !confirm(`Đổi PIN của ${k.ten}? Các máy đã nhớ sẽ bị xoá, con phải nhập PIN mới.`)) return;
    const r = await call('qt_pin', { mode: 'moi', ids: k.id }); if (!r.ok) return toast(r.err || 'Chưa đổi được'); S.tkSel.add(k.id); toast(`PIN mới của ${k.ten}: ${r.kids[0].pin}`); refresh(true); });
  const dev = (sel, act, msg) => $$(sel, root).forEach(b => b.onclick = async () => { const [id, d] = b.dataset[Object.keys(b.dataset).find(x => /^may/.test(x))].split('|'); const r = await call('qt_may', { id, dev: d, act }); if (!r.ok) return toast(r.err || 'Chưa lưu được'); toast(msg); refresh(true); });
  dev('[data-mayok]', 'duyet', 'Đã duyệt máy'); dev('[data-mayno]', 'tu_choi', 'Đã từ chối'); dev('[data-maygo]', 'go', 'Đã gỡ máy');
  const pr = $('#tkPrint', root); if (pr) pr.onclick = () => printCards([...S.tkSel].map(id => S.d.kids.find(k => k.id === id)).filter(Boolean));
}
function qrSvg(text) {
  if (typeof qrcode !== 'function') return '';
  const q = qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(), c = 4; let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x + c},${y + c}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2 * c} ${n + 2 * c}" shape-rendering="crispEdges" role="img" aria-label="Mã QR mở web của con"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
function printCards(kids) {
  if (!kids.length) return;
  const miss = kids.filter(k => !k.link); if (miss.length && !confirm(`${miss.length} bạn chưa có link riêng (thẻ dùng link cũ, phải nhập PIN). Vẫn in?`)) return;
  let box = $('#printarea'); if (!box) { box = document.createElement('div'); box.id = 'printarea'; document.body.appendChild(box); }
  const mm = S.d.max_may || 2;
  box.innerHTML = kids.map(k => `<div class="pcard"><div class="pc-h"><b>${esc(LOPS[S.lop].ten)} · Anh – Trung</b><span>Thẻ học web của ${esc(k.ten)}</span></div>
    <div class="pc-b"><div class="pc-qr">${qrSvg(kidLink(k.id))}</div><div class="pc-t"><div>Con: <b>${esc(k.ten)}</b></div><small>${k.link ? 'Quét mã QR hoặc mở link cô gửi là vào học ngay, không cần đăng nhập.' : 'Quét mã QR rồi nhập PIN ' + esc(k.pin || '') + ' lần đầu ở mỗi máy.'}</small></div></div>
    <p>Xin ba mẹ giữ thẻ và link riêng cho con, đừng chia sẻ cho bạn khác. <b>Báo cáo học tập</b> (ngày học, nhận xét của cô, bài cô giao thêm) ở ô Báo cáo học tập trên trang chủ.</p></div>`).join('');
  document.body.classList.add('printing'); setTimeout(() => { window.print(); }, 80);
}
window.addEventListener('afterprint', () => { document.body.classList.remove('printing'); const b = $('#printarea'); if (b) b.innerHTML = ''; });

function mockDb(L) {
  L = L || S.lop; const key = 'qtl-demo-' + L; let d; try { d = JSON.parse(localStorage.getItem(key)); } catch (e) {}
  if (d) return d;
  let seed = L === 'ls' ? 7 : 19; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const names = L === 'ls' ? ['Minh An', 'Gia Khôi', 'Bảo Linh', 'Tuệ Lâm', 'Hà My', 'Đức Anh', 'Khánh Vy', 'Nhật Minh', 'Bảo Châu', 'Quang Huy'] : ['Phương Anh', 'Hải Đăng', 'Ngọc Mai', 'Tùng Lâm', 'Gia Hân', 'Bảo Nam', 'Diệp Chi', 'Anh Khoa'];
  const now = Date.now(); d = { max_may: 2, lh: [{ id: 'LDEMO' + L, ten: LOPS[L].ten + ' · Thứ 7 sáng (ví dụ)', lich: 'Thứ 4 18:00 và Thứ 7 9:00', khai_giang: '', ghi_chu: '' }], kids: [], awards: [], orders: [], hs: [], bl: [], gc: [], tn: [], cfg: { ten_lop: LOPS[L].ten, khai_giang: ymd(new Date(now - 17 * 864e5)) }, seq: 1 };
  names.forEach((n, i) => { const ngay = Math.max(0, Math.round(5 + rnd() * 8 - (i === 2 ? 5 : 0))); const dsc = i === 2 ? 7 : Math.floor(rnd() * 4);
    d.kids.push({ id: 'DM' + L.toUpperCase() + (i + 1), link: 'demo' + L + (i + 1) + 'xyz', lich_su: [], lop: L, ten: n + ' (ví dụ)', tao: now, web: Math.round(ngay * 14 + rnd() * 20), vi: 0, ngay, cuoi: ymd(new Date(now - dsc * 864e5)), luu: now, tt: '', lh: i < 5 ? 'LDEMO' + L : '', pin: i < 7 ? String(1000 + Math.floor(rnd() * 8999)) : '', may: i < 7 ? [{ d: 'demo' + i, at: now - 3 * 864e5, ua: 'Android' }] : [], cho: i === 1 ? [{ d: 'demoX', at: now - 3600e3, ua: 'iPhone/iPad' }] : [] }); });
  [0, 1, 2, 3, 4].forEach(b => { d.bl.push({ buoi: b, ngay: ymd(new Date(now - (17 - b * 3.5) * 864e5)), da_day: true, ghi_chu: b === 2 ? 'Chưa kịp trò Bingo' : '' });
    d.kids.forEach((k, i) => { const vang = (i === 2 && b >= 3) || (i === 5 && b === 1); const l = () => 1 + Math.floor(rnd() * 3);
      d.hs.push({ buoi: b, kid: k.id, cm: vang ? (i === 5 ? 'p' : 'v') : (rnd() < .1 ? 't' : 'c'), tg: vang ? '' : (i === 4 ? 1 : l()), en: vang ? '' : l(), zh: vang ? '' : l(), bt: vang ? '' : l(), note: '' }); }); });
  d.awards.push({ id: 'A1', kid: d.kids[0].id, n: 5, why: 'Phát biểu hăng hái', at: now - 864e5, huy: false });
  d.orders.push({ code: 'Q1', kid: d.kids[1].id, ten: d.kids[1].ten, qua: 'sticker', ten_qua: 'Bộ sticker hoạt hình', sao: 120, at: now - 3600e3, st: 'cho', note: '' });
  d.gc.push({ id: 'N1', kid: d.kids[2].id, buoi: 3, loai: 'phu_huynh', nd: 'Ba mẹ báo con ốm, sẽ học bù ở nhà.', at: now - 2 * 864e5 });
  d.tn.push({ id: 'T1', nhom: 'Tài liệu khoá học', ten: 'Thư mục sách bài tập (ví dụ)', url: 'https://drive.google.com/', ghi_chu: 'Link ví dụ', thu_tu: 1 });
  return d;
}
function mock(q) {
  const d = mockDb(), save = () => { try { localStorage.setItem('qtl-demo-' + S.lop, JSON.stringify(d)); } catch (e) {} };
  const id = p => p + Math.random().toString(36).slice(2, 8).toUpperCase();
  /* tài khoản xem thử: demo / 2468 (quản trị); tài khoản tạo thêm ở mục Nhân sự dùng mật khẩu đã đặt */
  let T; try { T = JSON.parse(localStorage.getItem('qtl-demo-tk')); } catch (e) {}
  if (!T) T = [{ id: 'UDEMO', ten_dn: 'demo', ho_ten: 'Quản trị CES (ví dụ)', vai: 'qt', lh: [], p: '2468', khoa: false, dn_cuoi: 0 }];
  const saveT = () => { try { localStorage.setItem('qtl-demo-tk', JSON.stringify(T)); } catch (e) {} }, tkO = u => ({ id: u.id, ten_dn: u.ten_dn, ho_ten: u.ho_ten, vai: u.vai, lh: u.lh, khoa: !!u.khoa, dn_cuoi: u.dn_cuoi || 0 });
  if (q.action === 'qt_dn') { const u = T.find(x => x.ten_dn === String(q.u || '').trim().toLowerCase() && !x.khoa); if (!u || u.p !== q.p) return { ok: false, err: 'Sai tên đăng nhập hoặc mật khẩu' }; u.dn_cuoi = Date.now(); saveT(); return { ok: true, tok: 'demo.' + u.id, toi: tkO(u) }; }
  if (q.action === 'qt_tk_dau') return { ok: false, err: 'Bản xem thử đã có tài khoản: demo / 2468' };
  const me = T.find(x => 'demo.' + x.id === q.tok && !x.khoa); if (!me) return { ok: false, het: true, err: 'Phiên đăng nhập đã hết. Đăng nhập lại nhé.' };
  const ad = me.vai === 'qt', lhOk = lh => ad || me.lh.includes(lh), lhAll = () => ['ls', 'sd'].flatMap(L => mockDb(L).lh.map(l => ({ id: l.id, khoa: L, ten: l.ten })));
  if (/^qt_tk_/.test(q.action) && !ad) return { ok: false, err: 'Tài khoản này không làm được việc này' };
  if (!ad) { if (q.tu) q.tu = me.vai; if (q.ten != null || q.action === 'qt_td_them') q.ten = me.ho_ten; if (q.nguoi != null) q.nguoi = me.ho_ten; }
  switch (q.action) {
    case 'qt_tai': { if (!ad && !d.lh.some(l => lhOk(l.id))) return { ok: false, khong_lop: true, err: 'Tài khoản này chưa được giao lớp nào ở khoá này' };
      const o = Object.assign({ ok: true, v: 10, td: [], hl: [], hl_max: 10, toi: tkO(me), lh_all: lhAll().filter(l => lhOk(l.id)) }, JSON.parse(JSON.stringify(d)));
      if (!ad) { o.kids = o.kids.filter(k => lhOk(k.lh)); const ids = new Set(o.kids.map(k => k.id)); o.lh = o.lh.filter(l => lhOk(l.id)); ['hs', 'gc', 'awards', 'orders'].forEach(f => o[f] = (o[f] || []).filter(x => ids.has(x.kid))); o.td = o.td.filter(t => lhOk(t.lh)); o.hl = o.hl.filter(t => lhOk(t.lh)); }
      return o; }
    case 'qt_tk_ds': return { ok: true, tk: T.map(tkO), lh_all: lhAll() };
    case 'qt_tk_luu': { const vai = ['qt', 'gv', 'ql'].includes(q.vai) ? q.vai : 'gv', lh = q.lh || [];
      if (q.id) { const u = T.find(x => x.id === q.id); if (!u) return { ok: false, err: 'Không có tài khoản này' }; if (u.id === me.id && vai !== 'qt') return { ok: false, err: 'Không tự bỏ quyền quản trị của mình được' };
        Object.assign(u, { ho_ten: q.ho_ten || u.ho_ten, vai, lh }); if (q.p) { if (q.p.length < 6) return { ok: false, err: 'Mật khẩu cần ít nhất 6 ký tự' }; u.p = q.p; } saveT(); return { ok: true }; }
      const u = String(q.ten_dn || '').trim().toLowerCase(); if (!/^[a-z0-9._-]{3,30}$/.test(u)) return { ok: false, err: 'Tên đăng nhập 3–30 ký tự, chỉ chữ không dấu, số, dấu chấm, gạch' };
      if (T.some(x => x.ten_dn === u)) return { ok: false, err: 'Tên đăng nhập này đã có người dùng' }; if (String(q.p || '').length < 6) return { ok: false, err: 'Mật khẩu cần ít nhất 6 ký tự' }; if (!String(q.ho_ten || '').trim()) return { ok: false, err: 'Nhập họ tên người dùng' };
      const o = { id: id('U'), ten_dn: u, ho_ten: q.ho_ten.trim(), vai, lh, p: q.p, khoa: false }; T.push(o); saveT(); return { ok: true, id: o.id }; }
    case 'qt_tk_khoa': { if (q.id === me.id) return { ok: false, err: 'Không tự khoá tài khoản của mình được' }; const u = T.find(x => x.id === q.id); if (u) u.khoa = !!+q.khoa; saveT(); return { ok: true }; }
    case 'qt_mk': { if (q.cu !== me.p) return { ok: false, err: 'Mật khẩu cũ chưa đúng' }; if (String(q.moi || '').length < 6) return { ok: false, err: 'Mật khẩu mới cần ít nhất 6 ký tự' }; me.p = q.moi; saveT(); return { ok: true, tok: 'demo.' + me.id }; }
    case 'qt_link': { const out = []; (q.ids || []).forEach(i => { const k = d.kids.find(x => x.id === i); if (k) { k.link = Math.random().toString(36).slice(2, 12); out.push({ id: i, link: k.link }); } }); save(); return { ok: true, kids: out }; }
    case 'qt_hl_them': { d.hl = d.hl || []; if (q.b64 && q.b64.length * 0.75 > 10 * 1048576) return { ok: false, err: 'File lớn', qua_lon: true };
      const kid = (q.kid || []).filter(x => d.kids.some(k => k.id === x)), o = { id: id('H'), lh: q.lh || '', buoi: q.buoi === '' ? '' : +q.buoi, kid, ten: q.ten, file: q.file || '', mime: q.mime || '', co: q.b64 ? Math.round(q.b64.length * 0.75) : 0, url: q.url || '', co_file: !!q.b64, web: !!+q.web, cach: q.cach, gc: q.ghi_chu || '', tu: q.tu, nguoi: q.nguoi || '', at: Date.now(), phat: 0, gui: 0 };
      if (q.b64) (window.__HLF = window.__HLF || {})[o.id] = { b64: q.b64, mime: q.mime, ten: (o.buoi !== '' ? 'Buổi ' + o.buoi + ' – ' : '') + q.file };
      d.hl.unshift(o); save(); return { ok: true, hl: o }; }
    case 'qt_hl_sua': { const t = (d.hl || []).find(x => x.id === q.id); if (!t) return { ok: false, err: 'Không có học liệu này' }; if (q.phat != null) t.phat = +q.phat ? Date.now() : 0; if (q.gui != null) t.gui = +q.gui ? Date.now() : 0; if (q.web != null) t.web = !!+q.web; if (+q.an) d.hl = d.hl.filter(x => x !== t); save(); return { ok: true }; }
    case 'qt_hl_lay': { const f = (window.__HLF || {})[q.id]; return f ? Object.assign({ ok: true }, f) : { ok: false, err: 'Bản xem thử không giữ file sau khi tải lại trang' }; }
    case 'qt_td_them': { d.td = d.td || []; const o = { id: id('T'), lh: q.lh || '', tu: q.tu, den: q.den, loai: q.loai, kid: q.kid || '', buoi: q.buoi, nd: q.noi_dung, han: q.han || '', tt: 'mo', tl: '', ten: q.ten || '', at: Date.now(), xong: 0 }; d.td.unshift(o); save(); return { ok: true, td: o }; }
    case 'qt_td_sua': { const t = (d.td || []).find(x => x.id === q.id); if (!t) return { ok: false, err: 'Không có mục này' }; if (q.tt) { t.tt = q.tt; t.xong = q.tt === 'xong' ? Date.now() : 0; } if (q.tra_loi != null) t.tl = q.tra_loi; d.td = d.td.filter(x => x.tt !== 'xoa'); save(); return { ok: true }; }
    case 'qt_lh_luu': { if (!String(q.ten || '').trim()) return { ok: false, err: 'Chưa có tên lớp' }; if (d.lh.some(x => x.id !== q.id && x.ten.toLowerCase() === String(q.ten).trim().toLowerCase())) return { ok: false, err: 'Khoá này đã có lớp tên như vậy' };
      const o = { id: q.id || id('L'), ten: String(q.ten).trim(), lich: q.lich || '', khai_giang: q.khai_giang || '', ghi_chu: q.ghi_chu || '' }, i = d.lh.findIndex(x => x.id === o.id); i < 0 ? d.lh.push(o) : d.lh[i] = o; save(); return { ok: true, id: o.id }; }
    case 'qt_lh_xoa': { const n = d.kids.filter(k => k.lh === q.id).length; if (n) return { ok: false, err: 'Lớp còn ' + n + ' bạn. Chuyển các bạn sang lớp khác trước khi xoá.' }; d.lh = d.lh.filter(x => x.id !== q.id); save(); return { ok: true }; }
    case 'qt_chuyen': { if (!ad && me.vai === 'gv') return { ok: false, err: 'Tài khoản Giáo viên không làm được việc này' };
      const kh = lhAll().find(l => l.id === q.lh && l.khoa !== S.lop); let n = 0;
      (q.ids || []).forEach(i => { const k = d.kids.find(x => x.id === i); if (!k) return; n++;
        if (kh) { const o = mockDb(kh.khoa); d.kids = d.kids.filter(x => x !== k); (k.lich_su = k.lich_su || []).push({ lop: S.lop, ngay: k.ngay, web: k.web, vi: k.vi, den: Date.now() });
          Object.assign(k, { lop: kh.khoa, lh: kh.id, ngay: 0, web: 0, cuoi: '' }); o.kids.push(k); if (k.vi) o.awards.unshift({ id: id('A'), kid: k.id, n: k.vi, why: 'Sao mang sang từ ' + LOPS[S.lop].ten, at: Date.now(), huy: false });
          try { localStorage.setItem('qtl-demo-' + kh.khoa, JSON.stringify(o)); } catch (e) {} }
        else k.lh = q.lh || ''; }); save(); return { ok: true, n, khoa: kh ? n : 0 }; }
    case 'qt_buoi': { const i = d.bl.findIndex(x => x.buoi === +q.buoi && (x.lh || '') === (q.lh || '')), o = { buoi: +q.buoi, ngay: q.ngay, da_day: !!q.da_day, ghi_chu: q.ghi_chu || '', lh: q.lh || '' }; i < 0 ? d.bl.push(o) : d.bl[i] = o;
      (q.rows || []).forEach(r => { const j = d.hs.findIndex(x => x.buoi === +q.buoi && x.kid === r.kid), o2 = { buoi: +q.buoi, kid: r.kid, cm: r.cm || '', tg: r.tg, en: r.en, zh: r.zh, bt: r.bt, note: r.note || '' }; j < 0 ? d.hs.push(o2) : d.hs[j] = o2; }); save(); return { ok: true, n: (q.rows || []).length }; }
    case 'qt_gc_them': { const o = { id: id('N'), kid: q.kid, buoi: q.buoi === '' ? '' : +q.buoi, loai: q.loai, nd: q.noi_dung, at: Date.now(), cs: !!q.chia_se }; d.gc.unshift(o); save(); return { ok: true, note: o }; }
    case 'qt_gc_chia': { const g = d.gc.find(x => x.id === q.id); if (g) g.cs = q.v === '1'; save(); return { ok: true }; }
    case 'qt_kids_them': { const out = (q.ten || []).map(t => String(t).trim()).filter(Boolean).map(t => { const k = id(''), pin = String(1000 + Math.floor(Math.random() * 8999)); d.kids.push({ id: k, lop: S.lop, ten: t, tao: Date.now(), web: 0, vi: 0, ngay: 0, cuoi: '', luu: 0, tt: '', pin, may: [], cho: [], lh: q.lh || '' }); return { id: k, ten: t, pin }; }); save(); return { ok: true, kids: out }; }
    case 'qt_pin': { const ids = q.tat_ca ? d.kids.filter(k => !k.pin).map(k => k.id) : String(q.ids || '').split(',').filter(Boolean), out = []; ids.forEach(i => { const k = d.kids.find(x => x.id === i); if (k) { k.pin = String(1000 + Math.floor(Math.random() * 8999)); k.may = []; k.cho = []; out.push({ id: i, ten: k.ten, pin: k.pin }); } }); save(); return { ok: true, kids: out }; }
    case 'qt_may': { const k = d.kids.find(x => x.id === q.id); if (!k) return { ok: false, err: 'Không có con này' }; const m = (k.cho || []).find(x => x.d === q.dev);
      if (q.act === 'duyet' && m) k.may.push(m); k.cho = (k.cho || []).filter(x => x.d !== q.dev); if (q.act === 'go') k.may = k.may.filter(x => x.d !== q.dev); save(); return { ok: true }; }
    case 'qt_gc_xoa': d.gc = d.gc.filter(x => x.id !== q.id); save(); return { ok: true };
    case 'qt_hs': { const k = d.kids.find(x => x.id === q.id); if (k) { if (q.ten) k.ten = q.ten; if (q.tt != null) k.tt = q.tt; } save(); return { ok: true }; }
    case 'qt_lop': d.cfg.khai_giang = q.khai_giang; save(); return { ok: true };
    case 'qt_tn_luu': { const o = { id: q.id || id('T'), nhom: q.nhom, ten: q.ten, url: q.url, ghi_chu: q.ghi_chu, thu_tu: +q.thu_tu || 0 }, i = d.tn.findIndex(x => x.id === o.id); i < 0 ? d.tn.push(o) : d.tn[i] = o; save(); return { ok: true, id: o.id }; }
    case 'qt_tn_xoa': d.tn = d.tn.filter(x => x.id !== q.id); save(); return { ok: true };
    case 'award': { const ids = String(q.ids || '').split(',').filter(Boolean); ids.forEach(k => d.awards.unshift({ id: id('A'), kid: k, n: +q.n || 1, why: q.why || '', at: Date.now(), huy: false })); save(); return { ok: true, n: ids.length }; }
    case 'unaward': { const a = d.awards.find(x => x.id === q.aid); if (a) a.huy = true; save(); return { ok: true }; }
    case 'order': { const o = d.orders.find(x => x.code === q.code); if (o) { o.st = q.st; } save(); return { ok: true }; }
    case 'addkid': { const k = id(''); d.kids.push({ id: k, lop: S.lop, ten: q.ten, tao: Date.now(), web: 0, vi: 0, ngay: 0, cuoi: '', luu: 0, tt: '' }); save(); return { ok: true, id: k }; }
  }
  return { ok: false, err: 'Lệnh không rõ' };
}

/* ---------- khởi động ---------- */
S.tok ? enter() : login();
