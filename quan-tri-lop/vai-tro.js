/* =====================================================================
   VAI TRÒ · GIÁO ÁN 48 BUỔI · CON CẦN HỖ TRỢ (chị Duyên chốt 27/11/2026)
   Theo "Quy trình vận hành lớp tại CES" (phần 2 lớp offline, phần 4 phân công):
   - Giáo viên và Quản lý lớp mỗi người một khu vực làm việc (chọn vai ở đầu trang, nhớ trên máy).
   - Trang "Việc của tôi": việc trước / trong / sau buổi theo đúng vai; việc nào web đã có số liệu thì tự đánh dấu.
   - Thẻ buổi học lấy từ kịch bản 48 buổi (giao-an.js): buổi vừa học con đã học gì, buổi tới học gì,
     con cần chuẩn bị gì; ai chưa làm xong web cho buổi tới; tin Zalo mẫu để chép.
   - Con cần hỗ trợ: tự phát hiện từ điểm danh, chấm buổi, tiến độ web; mỗi vấn đề có giải pháp để chọn.
     Chọn giải pháp = lưu một ghi chú loại "Cần hỗ trợ" vào hồ sơ con (không cần đổi máy chủ).
   Nạp SAU app.js.
   ===================================================================== */
(function () {
  const VAI = { gv: { ten: 'Giáo viên', ic: '👩‍🏫' }, ql: { ten: 'Quản lý lớp', ic: '🗂️' } };
  const TAB_VAI = {
    gv: [['tq', 'Việc của tôi'], ['dd', 'Điểm danh & chấm buổi'], ['hs', 'Học sinh'], ['ga', 'Giáo án 48 buổi'], ['hl', 'Học liệu gửi thêm'], ['tn', 'Tài nguyên']],
    ql: [['tq', 'Việc của tôi'], ['lh', 'Lớp học'], ['hs', 'Học sinh'], ['dd', 'Điểm danh'], ['hl', 'Học liệu gửi thêm'], ['tk', 'Tài khoản con'], ['sq', 'Sao & quà'], ['ga', 'Giáo án 48 buổi'], ['tn', 'Tài nguyên']]
  };
  S.vai = store.get('qtl-vai') || '';
  const GA = () => ((window.GIAO_AN || {})[S.lop]) || {};
  const ga = n => GA()[n] || GA()[String(n)] || null;
  const noiDung = n => ((KH().find(s => s.n === n) || {}).t) || ((ga(n) || {}).tieu) || '';   // tên bài dễ hiểu (khung chương trình)
  const vaiTen = v => VAI[v] ? VAI[v].ic + ' ' + VAI[v].ten : '';
  const setTabs = () => { const t = TAB_VAI[S.vai] || TAB_VAI.ql; TABS.length = 0; t.forEach(x => TABS.push(x)); if (!t.some(x => x[0] === S.tab)) S.tab = 'tq'; };

  /* ---------- vỏ trang: nút chọn vai ---------- */
  const shell0 = shell;
  shell = function () {
    setTabs(); shell0.apply(this, arguments);
    let el = $('#vaisw'); if (!el) { el = document.createElement('div'); el.id = 'vaisw'; el.className = 'vaisw'; el.setAttribute('role', 'tablist'); el.setAttribute('aria-label', 'Vai trò'); $('#top .brand').after(el); }
    el.innerHTML = Object.keys(VAI).map(v => `<button class="pill vai ${v}" role="tab" type="button" aria-selected="${S.vai === v}" data-vai="${v}">${vaiTen(v)}</button>`).join('');
    $$('[data-vai]', el).forEach(b => b.onclick = () => chonVai(b.dataset.vai));
    const n = tdCuaToi().filter(t => t.tt === 'mo').length, tq = $('#nav [data-tab=tq]'); if (n && tq) tq.insertAdjacentHTML('beforeend', `<span class="dot">${n}</span>`);
    const nh = S.vai === 'ql' ? hlLop().filter(hlCho).length : 0, th = $('#nav [data-tab=hl]'); if (nh && th) th.insertAdjacentHTML('beforeend', `<span class="dot">${nh}</span>`);
  };
  function chonVai(v) { S.vai = v; store.set('qtl-vai', v); S.tab = 'tq'; draw(); scrollTo(0, 0); }

  /* ---------- buổi vừa học, buổi tới ---------- */
  function moc(D) {
    const kh = KH(), tl = D.tl.filter(n => n >= 0), L = tl.length ? tl[tl.length - 1] : null;
    const N = (kh.find(s => s.n > (L == null ? -1 : L)) || {}).n;
    const sN = kh.find(s => s.n === N) || null, sL = L == null ? null : kh.find(s => s.n === L) || null;
    const ngayN = N != null && D.blBy[N] ? D.blBy[N].ngay : '';
    const need = sN && sN.days && sN.days.length ? Math.max(...sN.days) : 0;     // web cần xong trước buổi tới
    const chua = need ? D.active.filter(k => (k.ngay || 0) < need) : [];
    return { L, N, sL, sN, ngayN, need, chua, kh };
  }
  const lopTen = () => { const c = lhCur(); return c ? c.ten : LOPS[S.lop].ten; };
  const ngayVN = s => s ? dm(s) + '/' + s.slice(0, 4) : '';

  /* ---------- tin nhắn mẫu ---------- */
  function tinNhacLich(M) {
    const c = lhCur(), g = ga(M.N) || {}, gL = M.L != null ? ga(M.L) || {} : {};
    return `📣 Nhắc lịch lớp ${lopTen()}: Buổi ${M.N}${M.ngayN ? ' ngày ' + ngayVN(M.ngayN) : ''}${c && c.lich ? ' (' + c.lich + ')' : ''}.\n` +
      `Nội dung: ${noiDung(M.N)}.\n` +
      (M.need ? `Trước buổi học, ba mẹ cho con làm xong web đến ngày ${M.need} nhé.\n` : '') +
      (gL.dan ? `Ba mẹ nhớ: ${gL.dan}\n` : '') + `Hẹn gặp các con ở lớp! 💚`;
  }
  function tinBtvn(M) { const g = M.L != null ? ga(M.L) || {} : {}; return g.zalo || (g.nha ? `Bài về nhà sau buổi ${M.L}: ${g.nha}.` : ''); }
  function tinNhacCon(k, M) {
    return `Chào ba mẹ bạn ${k.ten}! Buổi ${M.N}${M.ngayN ? ' (' + ngayVN(M.ngayN) + ')' : ''} lớp mình học: ${noiDung(M.N)}. ` +
      `Con đang làm web đến ngày ${k.ngay || 0}; ba mẹ cho con làm tiếp đến ngày ${M.need} trước buổi học, mỗi ngày khoảng 10 phút nhé. Cảm ơn ba mẹ!`;
  }
  function tinVang(k, b) { return `Chào ba mẹ bạn ${k.ten}! Hôm nay (buổi ${b}) cô chưa thấy con đến lớp. Ba mẹ báo giúp cô con có ổn không ạ? Cô gửi lại nội dung buổi để con học bù ở nhà nhé.`; }
  function tinNoiDung(M) { const g = ga(M.N) || {}; return `Buổi ${M.N} · ${lopTen()}\n${noiDung(M.N)} (${g.tieu || ''})\n${g.mo || ''}\nSau buổi, con: ${g.sau || ''}${g.loi ? '\nLời lớp học: ' + g.loi : ''}`; }

  /* ---------- con cần hỗ trợ ---------- */
  const GIAI_PHAP = {
    web0: { t: 'Chưa mở web lần nào', c: 'r', gp: [['ql', 'Gọi ba mẹ hướng dẫn mở web, gửi lại link + PIN'], ['ql', 'Hẹn ba mẹ đến sớm 10 phút để cài web cùng cô'], ['gv', 'Cho con mở web 3 phút cuối buổi để quen']] },
    webbo: { t: 'Nhiều ngày chưa học web', c: 'r', gp: [['ql', 'Nhắn ba mẹ nhắc nhẹ, gợi ý giờ học web cố định 10 phút'], ['ql', 'Hỏi ba mẹ con có vướng gì (máy, giờ giấc, con ngại)'], ['gv', 'Khen con trước lớp ngay khi con học web trở lại']] },
    cham: { t: 'Học web chậm hơn lịch', c: 'a', gp: [['ql', 'Gửi ba mẹ danh sách ngày web cần bù trong tuần'], ['gv', 'Ôn nhanh 5 phút đầu giờ các từ con còn thiếu'], ['ql', 'Tặng sao khi con bù xong (tab Sao & quà)']] },
    vang: { t: 'Vắng 2 buổi gần nhất', c: 'r', gp: [['ql', 'Gọi ba mẹ hỏi thăm, ghi lý do'], ['gv', 'Gửi tóm tắt buổi và việc ở nhà để con học bù'], ['ql', 'Xếp học bù hoặc chuyển sang lớp có lịch phù hợp (mục Lớp học)']] },
    muon: { t: 'Đi muộn nhiều', c: 'a', gp: [['ql', 'Trao đổi với ba mẹ về giờ đưa đón'], ['gv', 'Giao con việc đầu giờ (phát thẻ, chào lớp) để con muốn đến sớm']] },
    tg: { t: 'Tham gia thấp', c: 'a', gp: [['gv', 'Xếp đôi bạn với một bạn lớn, vững'], ['gv', 'Giao vai nhỏ: cầm rối, phát thẻ, làm "cô giáo nhí"'], ['gv', 'Dùng thang gợi ý ở các màn có thang (xem giáo án)'], ['ql', 'Hỏi ba mẹ tình hình của con ở nhà']] },
    noi: { t: 'Nói tiếng Anh/Trung còn ít', c: 'a', gp: [['gv', 'Cho con nói cùng bạn trước, rồi nói một mình'], ['gv', 'Đọc chậm + cử chỉ, cho con nhắc lại câu ngắn'], ['ql', 'Nhắn ba mẹ bật audio truyện unit lúc con chơi']] },
    bt: { t: 'Bài tập (phiếu, web) chưa đều', c: 'a', gp: [['ql', 'Nhắn ba mẹ nhắc phiếu tô – dán và ngày web'], ['gv', 'Kiểm tra phiếu đầu giờ, khen con làm đủ'], ['ql', 'Tặng sao khi con làm đủ 2 buổi liền']] }
  };
  function vanDe(D) {
    const out = [], exp = expectedDays(), tl = D.tl.filter(n => n > 0).slice(-3);
    D.active.forEach(k => {
      const i = D.info[k.id], rs = tl.map(b => (D.hsBy[k.id] || {})[b]).filter(Boolean), co = rs.filter(r => r.cm && r.cm !== 'v' && r.cm !== 'p');
      const low = f => co.filter(r => r[f] !== '' && r[f] != null && +r[f] > 0 && +r[f] <= 1).length;
      const add = (key, chi) => out.push({ k, key, chi, v: GIAI_PHAP[key] });
      if (i.dsc == null) add('web0', 'Con chưa mở web học lần nào');
      else if (i.dsc >= 4) add('webbo', `${i.dsc} ngày chưa học web (lần cuối ${dm(k.cuoi)})`);
      if (i.dsc != null && exp != null && exp - (k.ngay || 0) >= 3) add('cham', `Đang ngày ${k.ngay || 0}, theo lịch phải tới ngày ${exp}`);
      if (i.lastCm.length === 2 && i.lastCm.every(x => x === 'v' || x === 'p')) add('vang', 'Vắng 2 buổi dạy gần nhất');
      if (rs.filter(r => r.cm === 't').length >= 2) add('muon', `Đi muộn ${rs.filter(r => r.cm === 't').length}/${rs.length} buổi gần nhất`);
      if (low('tg') >= 2) add('tg', 'Mức tham gia 1/3 ở ≥2 trong 3 buổi gần nhất');
      if (low('en') >= 2 || low('zh') >= 2) add('noi', [low('en') >= 2 ? 'tiếng Anh' : '', low('zh') >= 2 ? 'tiếng Trung' : ''].filter(Boolean).join(' và ') + ' mức 1 ở ≥2 buổi gần nhất');
      if (low('bt') >= 2) add('bt', 'Bài tập mức 1 (chưa làm) ở ≥2 buổi gần nhất');
    });
    const now = Date.now();
    out.forEach(x => { x.dang = S.d.gc.filter(g => g.kid === x.k.id && g.loai === 'ho_tro' && String(g.nd).startsWith('Hỗ trợ · ' + x.v.t) && now - g.at < 14 * 864e5); });
    return out.sort((a, b) => (a.dang.length - b.dang.length) || (a.v.c === 'r' ? -1 : 1) - (b.v.c === 'r' ? -1 : 1));
  }

  /* ---------- các khối giao diện ---------- */
  function theBuoi(M, vai) {
    const gL = M.L != null ? ga(M.L) : null, gN = M.N != null ? ga(M.N) : null;
    const c1 = `<div class="gb"><h3>✅ Buổi vừa học${M.L != null ? ' · Buổi ' + M.L : ''}</h3>${gL ? `<p class="gb-t">${esc(noiDung(M.L))}</p><p class="sm muted">${esc(gL.tieu)}</p><p class="sm"><b>Con đã học:</b> ${esc(gL.sau || '')}</p>` : '<p class="muted sm">Chưa ghi buổi nào. Điểm danh buổi đầu tiên để thẻ này tự cập nhật.</p>'}</div>`;
    const c2 = M.N != null ? `<div class="gb"><h3>➡️ Buổi tới · Buổi ${M.N}${M.ngayN ? ' · ' + ngayVN(M.ngayN) : ''}</h3><p class="gb-t">${esc(noiDung(M.N))}</p>${gN ? `<p class="sm muted">${esc(gN.tieu)}</p>` : ''}${gN && gN.mo ? `<p class="sm muted">${esc(gN.mo)}</p>` : ''}
      ${gN && gN.sau ? `<p class="sm"><b>Sau buổi, con sẽ:</b> ${esc(gN.sau)}</p>` : ''}
      ${vai === 'gv' && gN ? `${gN.loi ? `<p class="sm"><b>Lời lớp học:</b> ${esc(gN.loi)}</p>` : ''}<details class="sm"><summary><b>Đồ dùng cô chuẩn bị</b></summary><p>${esc(gN.do || '')}</p></details>${gN.cham ? `<p class="sm"><b>Chấm 4 đầu ra ở màn:</b> ${esc(gN.cham)}</p>` : ''}` : ''}
      ${(() => { const h = hlLop().filter(x => x.buoi === M.N); return h.length ? `<p class="sm"><b>📎 ${h.length} học liệu gửi thêm cho buổi này:</b> ${h.map(x => esc(x.ten) + (hlCho(x) ? '' : ' ✓')).join(', ')} <button class="ghost xs" type="button" data-gotab="hl">Xem</button></p>` : ''; })()}
      <div class="row" style="margin-top:6px">${teachLinks(M.N).slice(0, vai === 'gv' ? 3 : 1).map(l => `<a class="ghost sm btnlink" href="${l.href}" target="_blank" rel="noopener">${esc(l.t)}</a>`).join('')}</div></div>` : '<div class="gb"><h3>🎉 Đã dạy hết 48 buổi</h3></div>';
    const prep = gL ? [gL.nha, gL.dan].filter(Boolean) : (M.need ? [`Ngày web ${(M.sN.days || []).join(', ')}`] : []);
    const chua = M.chua.length ? `<p class="sm"><b>${M.chua.length} bạn chưa làm xong web đến ngày ${M.need}:</b></p><ul class="ready">${M.chua.map(k => `<li><span data-kid="${esc(k.id)}" role="button" tabindex="0">${esc(k.ten)}</span> <span class="muted">· đang ngày ${k.ngay || 0}</span>${vai === 'ql' ? ` <button class="ghost xs" type="button" data-cp="${esc(tinNhacCon(k, M))}">Chép tin nhắc</button>` : ''}</li>`).join('')}</ul>`
      : (M.need ? `<p class="sm ok">✓ Cả lớp đã làm xong web đến ngày ${M.need}.</p>` : '');
    const c3 = `<div class="gb"><h3>🎒 Con cần chuẩn bị cho buổi ${M.N != null ? M.N : ''}</h3>${prep.length ? `<ul class="sm">${prep.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="muted sm">Chưa có việc ở nhà.</p>'}${chua}</div>`;
    return `<div class="card"><h2>Buổi học · ${esc(lopTen())}</h2><div class="gbs">${c1}${c2}${c3}</div></div>`;
  }
  function viec(items) {
    return `<ul class="viec">${items.map(x => `<li class="${x.ok ? 'xong' : x.gap ? 'gap' : ''}"><span class="vi-ic" aria-hidden="true">${x.ok ? '✅' : x.gap ? '⚠️' : '⬜'}</span><div><b>${x.t}</b>${x.s ? `<div class="sm muted">${x.s}</div>` : ''}${x.btn ? `<div class="row vi-btn">${x.btn}</div>` : ''}</div></li>`).join('')}</ul>`;
  }
  const btnCp = (t, nhan) => `<button class="ghost sm" type="button" data-cp="${esc(t)}">${nhan}</button>`;
  const btnTab = (tab, nhan) => `<button class="ghost sm" type="button" data-gotab="${tab}">${nhan}</button>`;
  function viecGv(D, M) {
    const gN = M.N != null ? ga(M.N) || {} : {}, L = M.L;
    const coMat = L != null ? D.active.filter(k => { const r = (D.hsBy[k.id] || {})[L]; return r && r.cm && r.cm !== 'v' && r.cm !== 'p'; }) : [];
    const chuaCham = coMat.filter(k => { const r = D.hsBy[k.id][L]; return r.tg === '' || r.tg == null; });
    const nx = L != null ? new Set(S.d.gc.filter(g => +g.buoi === L && g.loai !== 'ho_tro').map(g => g.kid)) : new Set();
    const chuaNx = coMat.filter(k => !nx.has(k.id));
    return `<div class="card"><h2>${vaiTen('gv')} · việc của tôi</h2>
      <h3 class="pha">Trước buổi ${M.N != null ? M.N : ''}</h3>${viec([
        { t: 'Xem kịch bản, học liệu và chuẩn bị đồ dùng', s: 'Đồ dùng ghi trong thẻ "Buổi tới" ở trên.', btn: M.N != null ? teachLinks(M.N).slice(0, 2).map(l => `<a class="ghost sm btnlink" href="${l.href}" target="_blank" rel="noopener">${esc(l.t)}</a>`).join('') : '' },
        { t: 'Giao BTVN trước giờ học ít nhất 6 tiếng', s: M.need ? `Web ngày ${(M.sN.days || []).join(', ')} tự mở cho con; phiếu in theo học liệu buổi.` : '' },
        { t: 'Gửi nội dung bài học cho Quản lý lớp (muộn nhất sáng ngày học)', btn: M.N != null ? btnCp(tinNoiDung(M), '📋 Chép nội dung buổi ' + M.N) : '' },
        { t: 'Kiểm tra BTVN buổi trước', ok: M.need && !M.chua.length, gap: M.chua.length > 0, s: M.chua.length ? `${M.chua.length} bạn chưa làm xong web (danh sách ở thẻ "Con cần chuẩn bị").` : '' }])}
      <h3 class="pha">Trong buổi</h3>${viec([
        { t: 'Điểm danh, ghi con đi muộn hoặc vắng', btn: M.N != null ? `<button class="btn sm" type="button" data-go-dd="${M.N}">Điểm danh buổi ${M.N}</button>` : '' },
        { t: 'Ghi mức tham gia, phát biểu, nói tiếng Anh, tiếng Trung của từng con', s: 'Ghi ngay trong bảng điểm danh (mức 1–3).' }])}
      <h3 class="pha">Sau buổi ${L != null ? L : ''}</h3>${viec([
        { t: 'Hoàn thành bảng chấm buổi của từng con', ok: L != null && coMat.length && !chuaCham.length, gap: chuaCham.length > 0, s: chuaCham.length ? 'Chưa chấm: ' + chuaCham.map(k => esc(k.ten)).join(', ') : '', btn: L != null && chuaCham.length ? `<button class="ghost sm" type="button" data-go-dd="${L}">Chấm buổi ${L}</button>` : '' },
        { t: 'Gửi nhận xét riêng từng con cho Quản lý lớp (ngay sau buổi)', ok: L != null && coMat.length && !chuaNx.length, gap: chuaNx.length > 0, s: chuaNx.length ? `Chưa có nhận xét buổi ${L}: ` + chuaNx.map(k => `<span class="lk" data-kid="${esc(k.id)}" role="button" tabindex="0">${esc(k.ten)}</span>`).join(', ') + '. Bấm tên con → ghi chú, chọn buổi ' + L + '.' : '' }])}
    </div>`;
  }
  function viecQl(D, M) {
    const c = lhCur(), L = M.L, wait = S.d.orders.filter(o => o.st === 'cho' && D.kids.some(k => k.id === o.kid)).length, cho = S.v5 ? D.active.filter(k => (k.cho || []).length).length : 0;
    const vang = L != null ? D.active.filter(k => { const r = (D.hsBy[k.id] || {})[L]; return r && (r.cm === 'v' || r.cm === 'p'); }) : [];
    const nxL = L != null ? S.d.gc.filter(g => +g.buoi === L && g.loai !== 'ho_tro' && D.kids.some(k => k.id === g.kid)) : [];
    const kt = M.kh.filter(s => M.N != null && s.n >= M.N && s.n <= M.N + 2).find(s => /kiểm tra|thi thử|ôn chặng|Produce cả khoá/i.test(s.t + ' ' + s.vai + ' ' + ((ga(s.n) || {}).tieu || '')));
    return `<div class="card"><h2>${vaiTen('ql')} · việc của tôi</h2>
      <h3 class="pha">Trước buổi ${M.N != null ? M.N : ''}</h3>${viec([
        { t: 'Xác nhận lịch học, lịch nghỉ, lịch dạy của GV (trước 1–2 ngày)', s: c ? esc([c.lich, c.ghi_chu].filter(Boolean).join(' · ') || 'Lớp chưa ghi lịch học.') : 'Chọn một lớp ở ô Lớp để xem lịch của lớp.', btn: btnTab('lh', 'Sửa lịch lớp') },
        { t: 'Nhắc lịch học cho phụ huynh, báo thay đổi lịch hoặc phòng', btn: M.N != null ? btnCp(tinNhacLich(M), '📋 Chép tin nhắc lịch') : '' },
        { t: 'Nhắc các con chưa làm xong BTVN', ok: M.need && !M.chua.length, gap: M.chua.length > 0, s: M.chua.length ? `${M.chua.length} bạn chưa xong: chép tin nhắc riêng từng bạn ở thẻ "Con cần chuẩn bị".` : '' }])}
      <h3 class="pha">Trong buổi</h3>${viec([
        { t: 'Theo dõi lớp, hỗ trợ GV, xử lý việc phát sinh' },
        { t: 'Con vắng: nhắn hoặc gọi phụ huynh', gap: vang.length > 0, s: vang.length ? `Buổi ${L} vắng: ` + vang.map(k => esc(k.ten)).join(', ') : 'Theo bảng điểm danh của GV.', btn: vang.map(k => btnCp(tinVang(k, L), '📋 Tin hỏi thăm ' + esc(k.ten))).join('') }])}
      <h3 class="pha">Sau buổi ${L != null ? L : ''}</h3>${viec([
        { t: 'Tổng hợp, biên tập, gửi nhận xét riêng cho từng phụ huynh', s: L != null ? `GV đã ghi ${new Set(nxL.map(g => g.kid)).size}/${D.active.length - vang.length} nhận xét buổi ${L}. Mở hồ sơ con để đọc, tick "Ba mẹ xem được" khi ghi bản đã biên tập.` : '', btn: btnTab('hs', 'Mở danh sách học sinh') },
        { t: 'Gửi BTVN của buổi cho phụ huynh', btn: tinBtvn(M) ? btnCp(tinBtvn(M), '📋 Chép tin BTVN buổi ' + L) : '' },
        { t: 'Kiểm tra bài con nộp, tặng sao; duyệt đổi quà', gap: wait > 0, s: wait ? `${wait} phiếu quà chờ duyệt.` : '', btn: btnTab('sq', 'Sao & quà') },
        { t: 'Duyệt máy mới của các con', gap: cho > 0, ok: S.v5 && !cho, s: cho ? `${cho} bạn có máy mới chờ duyệt.` : '', btn: cho ? btnTab('tk', 'Tài khoản con') : '' }])}
      ${kt ? `<h3 class="pha">Kiểm tra định kỳ</h3>${viec([{ t: `Buổi ${kt.n} sắp tới là buổi ôn / kiểm tra`, gap: true, s: 'Chuẩn bị bài test, lập lịch kiểm tra từng con với GV và gửi phụ huynh; sau đó tổng hợp báo cáo và bảng vinh danh.' }])}` : ''}
    </div>`;
  }
  /* ---------- trao đổi, nhờ việc giữa hai vai (máy chủ bản 8) ---------- */
  const vaiKia = v => v === 'gv' ? 'ql' : 'gv';
  const tdLop = () => ((S.d && S.d.td) || []).filter(t => !S.lh || S.lh === '_none' || !t.lh || t.lh === S.lh);
  const tdCuaToi = () => S.vai ? tdLop().filter(t => t.den === S.vai) : [];
  const MAU = {
    gv: ['Nhờ nhắn ba mẹ bạn {con} về việc: ', 'Nhờ in và chuẩn bị học liệu buổi {buoi}', 'Nhờ báo phụ huynh lớp: ', 'Nhờ xếp học bù cho bạn {con}', 'Nhận xét buổi {buoi} của các con đã ghi xong, nhờ chị biên tập và gửi ba mẹ'],
    ql: ['Nhờ cô gửi nhận xét buổi {buoi} của bạn {con}', 'Nhờ cô chấm bảng buổi {buoi}', 'Nhờ cô kèm thêm 5 phút cho bạn {con} ở buổi tới', 'Nhờ cô gửi nội dung buổi {buoi}', 'Phụ huynh bạn {con} nhắn cô: ']
  };
  function theTraoDoi(D, M) {
    if (!S.v8) return `<div class="card"><h2>Trao đổi với ${VAI[vaiKia(S.vai)].ten.toLowerCase()}</h2><p class="sm muted">Cần cập nhật máy chủ lên bản 8 để giáo viên và quản lý lớp nhắn tin, nhờ việc cho nhau (dán Code.gs mới → Triển khai → Quản lý triển khai → ✏️ → Phiên bản mới).</p></div>`;
    const v = S.vai, k2 = vaiKia(v), all = tdLop(), den = all.filter(t => t.den === v && t.tt === 'mo'), gui = all.filter(t => t.tu === v).slice(0, 8), xong = all.filter(t => t.den === v && t.tt === 'xong').slice(0, 6);
    const kName = id => { const k = S.d.kids.find(x => x.id === id); return k ? k.ten : ''; };
    const quaHan = t => t.han && t.tt === 'mo' && t.han < new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);
    const one = (t, mine) => `<li class="td ${t.loai} ${t.tt} ${quaHan(t) ? 'qh' : ''}"><div class="td-h"><span class="chip ${t.loai === 'viec' ? 'a' : 'b'}">${t.loai === 'viec' ? '📌 Nhờ việc' : '💬 Tin'}</span>
      <span class="sm muted">${mine ? 'gửi ' + VAI[t.den].ten : 'từ ' + VAI[t.tu].ten}${t.ten ? ' (' + esc(t.ten) + ')' : ''} · ${dmt(t.at)}${t.kid ? ' · bạn <b class="lk" data-kid="' + esc(t.kid) + '" role="button" tabindex="0">' + esc(kName(t.kid)) + '</b>' : ''}${t.buoi !== '' && t.buoi != null ? ' · buổi ' + t.buoi : ''}${t.han ? ' · hạn ' + dm(t.han) : ''}</span>${t.tt === 'xong' ? ' <span class="chip g">✓ xong ' + dmt(t.xong) + '</span>' : quaHan(t) ? ' <span class="chip r">sắp hết hạn</span>' : ''}</div>
      <div class="td-nd">${esc(t.nd)}</div>${t.tl ? `<div class="td-tl sm">↪ ${esc(t.tl)}</div>` : ''}
      <div class="row td-b">${!mine && t.tt === 'mo' ? `<button class="btn sm" type="button" data-tdx="${esc(t.id)}">✓ ${t.loai === 'viec' ? 'Đã làm xong' : 'Đã đọc'}</button>` : ''}${!mine ? `<button class="ghost sm" type="button" data-tdtl="${esc(t.id)}">Trả lời</button>` : ''}${mine ? `<button class="ghost sm" type="button" data-tdxoa="${esc(t.id)}">Xoá</button>` : ''}${!mine && t.tt === 'xong' ? `<button class="ghost sm" type="button" data-tdmo="${esc(t.id)}">Mở lại</button>` : ''}</div></li>`;
    const kids = D.active.slice().sort((a, b) => String(a.ten).localeCompare(String(b.ten), 'vi'));
    const L = M.L != null ? M.L : '', N = M.N != null ? M.N : '';
    return `<div class="card tdcard"><h2>Trao đổi với ${VAI[k2].ten.toLowerCase()} ${den.length ? `<span class="chip r">${den.length} mới</span>` : ''}</h2>
      <h3 class="pha">${VAI[k2].ic} ${VAI[k2].ten} gửi tôi</h3>${den.length ? `<ul class="tds">${den.map(t => one(t, false)).join('')}</ul>` : '<p class="sm muted">Không có việc nào đang chờ.</p>'}
      <details class="tdgui" ${den.length ? '' : 'open'}><summary><b>✉️ Gửi tin / nhờ ${VAI[k2].ten.toLowerCase()}</b></summary>
        <div class="row" style="margin:8px 0"><div class="chips"><button type="button" data-tdloai="viec" aria-pressed="${S.tdLoai !== 'tin'}">📌 Nhờ việc</button><button type="button" data-tdloai="tin" aria-pressed="${S.tdLoai === 'tin'}">💬 Tin nhắn</button></div></div>
        <div class="row"><select id="tdk" aria-label="Về bạn nào" style="width:auto"><option value="">Cả lớp / không về bạn nào</option>${kids.map(k => `<option value="${esc(k.id)}">${esc(k.ten)}</option>`).join('')}</select>
          <label class="sm">Buổi <input type="number" id="tdb" min="0" max="48" value="${N !== '' ? N : L}" style="width:70px"></label>
          ${S.tdLoai !== 'tin' ? `<label class="sm">Hạn <input type="date" id="tdh"></label>` : ''}</div>
        <div class="chips tdmau">${MAU[v].map((m, i) => `<button type="button" data-tdmau="${i}">${esc(m.replace(/\{con\}/g, '…').replace(/\{buoi\}/g, N !== '' ? N : '…'))}</button>`).join('')}</div>
        <textarea id="tdn" rows="3" maxlength="1000" placeholder="Nội dung…"></textarea>
        <div class="row"><input type="text" id="tdten" maxlength="40" placeholder="Tên người gửi (tuỳ chọn)" value="${esc(store.get('qtl-ten') || '')}" style="max-width:220px"><button class="btn" type="button" id="tdsend">Gửi ${VAI[k2].ten}</button></div>
      </details>
      ${gui.length ? `<details><summary class="sm"><b>Tôi đã gửi (${gui.length})</b> · ${gui.filter(t => t.tt === 'xong').length} đã xong</summary><ul class="tds">${gui.map(t => one(t, true)).join('')}</ul></details>` : ''}
      ${xong.length ? `<details><summary class="sm"><b>Đã xong gần đây (${xong.length})</b></summary><ul class="tds">${xong.map(t => one(t, false)).join('')}</ul></details>` : ''}</div>`;
  }
  async function guiTd(o) {
    const r = await call('qt_td_them', Object.assign({ lh: (lhCur() || {}).id || '', tu: S.vai, den: vaiKia(S.vai), ten: store.get('qtl-ten') || '' }, o));
    if (!r.ok) { toast(r.err || 'Chưa gửi được'); return false; } toast('Đã gửi ' + VAI[vaiKia(S.vai)].ten); refresh(true); return true;
  }

  function theHoTro(D, vai) {
    const ds = vanDe(D); if (!ds.length) return `<div class="card"><h2>Con cần hỗ trợ</h2><p class="ok">✓ Chưa thấy bạn nào có dấu hiệu cần hỗ trợ.</p></div>`;
    const li = ds.slice(0, 20).map(x => { const gp = x.v.gp.map((g, i) => [g, i]).filter(([g]) => g[0] === vai), khac = x.v.gp.filter(g => g[0] !== vai);
      return `<li class="ht ${x.dang.length ? 'dang' : ''}"><div class="ht-h"><span class="chip ${x.v.c}">${x.v.c === 'r' ? 'Cần xử lý' : 'Theo dõi'}</span> <b data-kid="${esc(x.k.id)}" role="button" tabindex="0" class="lk">${esc(x.k.ten)}</b> · ${esc(x.v.t)} <span class="muted sm">(${esc(x.chi)})</span></div>
        ${x.dang.length ? `<div class="sm dang-t">🤝 Đang hỗ trợ: ${x.dang.slice(0, 2).map(g => esc(String(g.nd).replace('Hỗ trợ · ' + x.v.t + ': ', '')) + ' · ' + dmt(g.at)).join('; ')}</div>` : ''}
        <div class="row ht-gp">${gp.map(([g, i]) => `<button class="ghost sm" type="button" data-gp="${esc(x.k.id)}|${x.key}|${i}">${esc(g[1])}</button>`).join('')}</div>
        ${khac.length ? (S.v8 ? `<div class="row ht-nho"><span class="sm muted">Nhờ ${VAI[vaiKia(vai)].ten.toLowerCase()}:</span>${x.v.gp.map((g, i) => [g, i]).filter(([g]) => g[0] !== vai).map(([g, i]) => `<button class="ghost xs" type="button" data-nho="${esc(x.k.id)}|${x.key}|${i}">📌 ${esc(g[1])}</button>`).join('')}</div>` : `<div class="sm muted">Việc của ${VAI[vaiKia(vai)].ten.toLowerCase()}: ${khac.map(g => esc(g[1])).join(' · ')}</div>`) : ''}</li>`; }).join('');
    return `<div class="card"><h2>Con cần hỗ trợ <span class="chip">${ds.length}</span></h2><p class="sm muted">Bấm một giải pháp để ghi vào hồ sơ con (ghi chú "Cần hỗ trợ"); bạn đã có giải pháp trong 14 ngày được xếp xuống dưới.</p><ul class="hts">${li}</ul>${ds.length > 20 ? `<p class="muted sm">… và ${ds.length - 20} việc nữa.</p>` : ''}</div>`;
  }
  function chonVaiView() {
    return `<div class="card vaichon"><h1>Chị/anh làm việc với vai nào?</h1><p class="muted">Mỗi vai có khu vực việc riêng theo quy trình vận hành lớp CES. Đổi vai bất cứ lúc nào ở nút trên đầu trang.</p>
      <div class="vaichon-b"><button class="vc gv" type="button" data-vai="gv"><span>👩‍🏫</span><b>Giáo viên</b><small>Chuẩn bị bài, điểm danh, chấm buổi, nhận xét từng con</small></button>
      <button class="vc ql" type="button" data-vai="ql"><span>🗂️</span><b>Quản lý lớp</b><small>Lịch học, nhắc phụ huynh, gửi nhận xét, BTVN, sao & quà, tài khoản, lớp học</small></button></div></div>`;
  }
  const vTq0 = vTq;
  vTq = function () {
    if (!S.vai) return chonVaiView();
    const D = derive(), M = moc(D), tong = LOPS[S.lop].tong, exp = expectedDays();
    const bars = D.active.length ? `<div class="bars">${D.active.map(k => { const i = D.info[k.id], pct = Math.min(100, Math.round(100 * (k.ngay || 0) / tong)), cls = i.dsc == null || i.dsc >= 6 ? 'r' : i.dsc >= 4 ? 'a' : '';
      return `<div class="bar-row" data-kid="${esc(k.id)}" tabindex="0" role="button"><span class="nm">${esc(k.ten)}</span><div class="bar"><span class="fill ${cls}" style="width:${pct}%"></span>${exp != null ? `<i class="mark" style="left:${Math.min(100, Math.round(100 * exp / tong))}%"></i>` : ''}${M.need ? `<i class="mark need" style="left:${Math.min(100, Math.round(100 * M.need / tong))}%" title="cần xong trước buổi tới"></i>` : ''}</div><span class="vl">${k.ngay || 0}/${tong} ngày · ${i.dsc == null ? 'chưa học' : i.dsc === 0 ? 'hôm nay' : i.dsc + ' ngày trước'}</span></div>`; }).join('')}</div>` : '<div class="empty">Chưa có bạn nào.</div>';
    return `<div class="vaihead ${S.vai}"><b>${vaiTen(S.vai)}</b> · khu vực làm việc của ${S.vai === 'gv' ? 'giáo viên' : 'quản lý lớp'} · ${esc(lopTen())}</div>` +
      theBuoi(M, S.vai) + `<div class="grid g2"><div>${theHocLieu(M)}${theTraoDoi(D, M)}${S.vai === 'gv' ? viecGv(D, M) : viecQl(D, M)}</div><div>${theHoTro(D, S.vai)}<div class="card"><h2>Học web của từng bạn</h2>${bars}<div class="legend">Vạch xanh dương: web cần xong trước buổi tới${exp != null ? ' · vạch đen: tiến độ theo lịch' : ''}.</div></div></div></div>` + heat(D);
  };

  /* ---------- Giáo án 48 buổi ---------- */
  window.vGa = function () {
    const D = derive(), M = moc(D), kh = KH(), done = new Set(D.tl);
    const rows = kh.map(s => { const g = ga(s.n) || {}, cur = s.n === M.N;
      return `<details class="gab ${cur ? 'cur' : ''}" ${cur ? 'open' : ''}><summary><span class="gab-n">${done.has(s.n) ? '✓' : s.n}</span><b>Buổi ${s.n}</b> · ${esc(s.t)}<span class="muted sm"> · ${esc(g.tieu || s.vai)}</span>${cur ? ' <span class="chip b">buổi tới</span>' : ''}</summary>
        <div class="gab-b">${g.mo ? `<p>${esc(g.mo)}</p>` : ''}${g.sau ? `<p><b>Sau buổi, con:</b> ${esc(g.sau)}</p>` : ''}${g.loi ? `<p><b>Lời lớp học:</b> ${esc(g.loi)}</p>` : ''}
        ${S.vai !== 'ql' && g.do ? `<p><b>Đồ dùng:</b> ${esc(g.do)}</p>` : ''}${g.nha ? `<p><b>Việc ở nhà:</b> ${esc(g.nha)}</p>` : ''}${g.dan ? `<p><b>Dặn cho buổi sau:</b> ${esc(g.dan)}</p>` : ''}
        <div class="row">${g.zalo ? btnCp(g.zalo, '📋 Chép tin Zalo mẫu') : ''}${s.n > 0 ? teachLinks(s.n).slice(0, 2).map(l => `<a class="ghost sm btnlink" href="${l.href}" target="_blank" rel="noopener">${esc(l.t)}</a>`).join('') : ''}</div></div></details>`; }).join('');
    return `<div class="card"><h2>Giáo án 48 buổi · ${esc(LOPS[S.lop].ten)}</h2><p class="sm muted">Lấy từ kịch bản buổi offline. ✓ là buổi lớp đã dạy; buổi tới mở sẵn.</p>${rows}</div>`;
  };

  /* ---------- học liệu gửi thêm (máy chủ bản 9): GV tải bài lên, QL lấy về in phát / gửi phụ huynh ---------- */
  const CACH = { in: '🖨️ In phát trên lớp', zalo: '📱 Gửi phụ huynh', ca_hai: '🖨️ In phát + 📱 gửi phụ huynh' };
  const hlLop = () => ((S.d && S.d.hl) || []).filter(h => !S.lh || S.lh === '_none' || !h.lh || h.lh === S.lh);
  const hlCho = h => (h.cach !== 'zalo' && !h.phat) || (h.cach !== 'in' && !h.gui);   // còn việc cho quản lý lớp
  const hlMax = () => (S.d && S.d.hl_max) || 10;
  const MB = n => n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1).replace('.', ',') + ' MB';
  const choAi = h => { if (!h.kid.length) return 'cả lớp'; const t = h.kid.map(id => (S.d.kids.find(k => k.id === id) || {}).ten).filter(Boolean); return t.length ? 'bạn ' + t.join(', ') : 'cả lớp'; };
  const tinHl = h => `Ba mẹ ơi, cô gửi thêm "${h.ten}"${h.buoi !== '' ? ' cho buổi ' + h.buoi : ''}${h.kid.length ? ' dành cho ' + choAi(h) : ''}.${h.gc ? ' ' + h.gc + '.' : ''} Ba mẹ tải về/in cho con giúp cô nhé. Cảm ơn ba mẹ!`;
  function theHocLieu(M) {
    if (!S.v9) return '';
    const all = hlLop(), cho = all.filter(hlCho);
    if (S.vai === 'ql') return cho.length ? `<div class="card"><h2>📎 Học liệu gửi thêm cần lấy <span class="chip r">${cho.length}</span></h2><ul class="hls">${cho.slice(0, 5).map(h => `<li><b>${esc(h.ten)}</b> <span class="sm muted">· buổi ${h.buoi === '' ? '?' : h.buoi} · ${esc(choAi(h))} · ${esc(CACH[h.cach])}</span></li>`).join('')}</ul>${btnTab('hl', 'Mở mục Học liệu gửi thêm')}</div>` : '';
    const mine = all.filter(h => h.tu === 'gv').slice(0, 4);
    return `<div class="card"><h2>📎 Gửi thêm học liệu cho các con</h2><p class="sm muted">Sửa phiếu, thêm bài cho buổi ${M.N != null ? M.N : 'tới'}? Tải file lên đây, quản lý lớp sẽ lấy về in phát hoặc gửi phụ huynh.</p>
      ${mine.length ? `<ul class="hls sm">${mine.map(h => `<li>${esc(h.ten)} · buổi ${h.buoi === '' ? '?' : h.buoi} ${hlCho(h) ? '<span class="chip a">chờ quản lý lớp</span>' : '<span class="chip g">✓ đã đưa cho con</span>'}</li>`).join('')}</ul>` : ''}
      <div class="row">${btnTab('hl', '📎 Gửi thêm học liệu')}</div></div>`;
  }
  window.vHl = function () {
    if (!S.v9) return `<div class="card"><h2>Học liệu gửi thêm</h2><p class="sm muted">Cần cập nhật máy chủ lên bản 9 (dán Code.gs mới → chạy caiDat, cho phép quyền Drive → Triển khai → Quản lý triển khai → ✏️ → Phiên bản mới).</p></div>`;
    const D = derive(), M = moc(D), all = hlLop(), kids = D.active.slice().sort((a, b) => String(a.ten).localeCompare(String(b.ten), 'vi'));
    const gv = S.vai !== 'ql', N = M.N != null ? M.N : '';
    const form = `<details class="card hlgui" ${gv ? 'open' : ''}><summary><h2 style="display:inline">📎 Gửi thêm học liệu</h2></summary>
      <p class="sm muted">File tối đa ${hlMax()} MB (PDF, ảnh, Word, PowerPoint…) được cất vào thư mục Drive "Học liệu gửi thêm" của lớp. File lớn hơn: thả vào Google Drive của mình rồi dán link.</p>
      <label class="f" for="hlten">Tên bài</label><input type="text" id="hlten" maxlength="120" placeholder="VD: Phiếu tô màu buổi ${N} (bản sửa)">
      <div class="row"><label class="sm">Buổi <input type="number" id="hlb" min="0" max="48" value="${N}" style="width:70px"></label>
        <label class="sm">Cách đưa cho con <select id="hlc" style="width:auto">${Object.keys(CACH).map(k => `<option value="${k}">${CACH[k]}</option>`).join('')}</select></label></div>
      <details class="hlkid"><summary class="sm"><b>Cho ai:</b> <span id="hlai">cả lớp</span> (bấm để chọn riêng vài bạn)</summary><div class="chips">${kids.map(k => `<label class="sm hlk"><input type="checkbox" value="${esc(k.id)}"> ${esc(k.ten)}</label>`).join('')}</div></details>
      <label class="f" for="hlf">File</label><input type="file" id="hlf">
      <div id="hlto" class="hlto" hidden></div>
      <label class="f" for="hlu">…hoặc link (Google Drive, YouTube…)</label><input type="url" id="hlu" placeholder="https://drive.google.com/…">
      <label class="f" for="hlg">Ghi chú cho quản lý lớp</label><input type="text" id="hlg" maxlength="500" placeholder="VD: in màu, mỗi con 1 tờ; phát đầu buổi">
      <div class="row" style="margin-top:8px"><input type="text" id="hlng" maxlength="40" placeholder="Tên người gửi (tuỳ chọn)" value="${esc(store.get('qtl-ten') || '')}" style="max-width:220px"><button class="btn" type="button" id="hlsend">Gửi quản lý lớp</button></div></details>`;
    const by = {}; all.forEach(h => { const k = h.buoi === '' ? -1 : h.buoi; (by[k] = by[k] || []).push(h); });
    const one = h => `<li class="hl ${hlCho(h) ? 'cho' : 'xong'}"><div class="td-h"><b>${esc(h.ten)}</b>${hlCho(h) ? ' <span class="chip a">chờ lấy</span>' : ' <span class="chip g">✓ đã đưa cho con</span>'}</div>
      <div class="sm muted">${esc(choAi(h))} · ${esc(CACH[h.cach])} · ${h.tu === 'ql' ? 'Quản lý lớp' : 'Giáo viên'}${h.nguoi ? ' (' + esc(h.nguoi) + ')' : ''} gửi ${dmt(h.at)}${h.co_file ? ' · ' + esc(h.file) + ' · ' + MB(h.co) : ' · 🔗 link'}</div>${h.gc ? `<div class="td-nd">${esc(h.gc)}</div>` : ''}
      <div class="row td-b">${h.co_file ? `<button class="btn sm" type="button" data-hlget="${esc(h.id)}">⬇️ Tải về</button>` : `<a class="btn sm btnlink" href="${esc(h.url)}" target="_blank" rel="noopener">🔗 Mở link</a>`}
        ${h.cach !== 'zalo' ? `<button class="${h.phat ? 'ghost' : 'ghost'} sm" type="button" data-hlphat="${esc(h.id)}" aria-pressed="${!!h.phat}">${h.phat ? '✅ Đã in phát ' + dmt(h.phat) : '🖨️ Đánh dấu đã in phát'}</button>` : ''}
        ${h.cach !== 'in' ? `<button class="ghost sm" type="button" data-hlgui="${esc(h.id)}" aria-pressed="${!!h.gui}">${h.gui ? '✅ Đã gửi phụ huynh ' + dmt(h.gui) : '📱 Đánh dấu đã gửi phụ huynh'}</button>${btnCp(tinHl(h), '📋 Chép tin kèm')}` : ''}
        <button class="ghost sm" type="button" data-hlan="${esc(h.id)}">Ẩn</button></div></li>`;
    const ks = Object.keys(by).map(Number).sort((a, b) => b - a);
    const list = all.length ? ks.map(k => `<h3 class="pha">${k < 0 ? 'Không ghi buổi' : 'Buổi ' + k}${k === M.N ? ' · buổi tới' : ''}</h3><ul class="tds">${by[k].map(one).join('')}</ul>`).join('') : '<p class="muted sm">Chưa có học liệu gửi thêm nào.</p>';
    return (gv ? form : '') + `<div class="card"><h2>Học liệu gửi thêm · ${esc(lopTen())} ${all.filter(hlCho).length ? `<span class="chip r">${all.filter(hlCho).length} chờ lấy</span>` : ''}</h2>
      <p class="sm muted">${gv ? 'Theo dõi quản lý lớp đã in phát / gửi phụ huynh chưa.' : 'Tải bài về, in phát hoặc gửi phụ huynh, rồi đánh dấu để giáo viên biết.'} "Ẩn" chỉ bỏ khỏi danh sách, file vẫn còn trong Drive.</p>${list}</div>` + (gv ? '' : form.replace(' open', ''));
  }
  function bindHl(root) {
    const f = $('#hlf', root); if (!f) return;
    const box = $('#hlto', root), ai = () => { const c = $$('.hlk input:checked', root).map(x => x.parentNode.textContent.trim()); $('#hlai', root).textContent = c.length ? c.join(', ') : 'cả lớp'; };
    $$('.hlk input', root).forEach(x => x.onchange = ai);
    const qua = (mb) => { box.hidden = false; box.innerHTML = `<b>File ${mb} lớn hơn ${hlMax()} MB nên không tải thẳng lên đây được.</b><ol class="sm"><li>Thả file vào Google Drive của cô.</li><li>Bấm chuột phải vào file → <b>Chia sẻ</b> → mục "Quyền truy cập chung" chọn <b>Bất kỳ ai có đường liên kết</b> → <b>Sao chép đường liên kết</b>.</li><li>Dán link vào ô bên dưới rồi bấm "Gửi quản lý lớp". Link sẽ được gửi cho quản lý lớp.</li></ol>`; f.value = ''; $('#hlu', root).focus(); };
    f.onchange = () => { const x = f.files[0]; box.hidden = true; if (!x) return; if (x.size > hlMax() * 1048576) return qua(MB(x.size)); if (!$('#hlten', root).value.trim()) $('#hlten', root).value = x.name.replace(/\.[^.]+$/, ''); };
    $('#hlsend', root).onclick = async () => {
      const b = $('#hlsend', root), x = f.files[0], url = $('#hlu', root).value.trim(), ten = $('#hlten', root).value.trim();
      if (!ten) return toast('Đặt tên bài trước nhé'); if (!x && !url) return toast('Chọn file hoặc dán link'); if (!x && !/^https:\/\//.test(url)) return toast('Link phải bắt đầu bằng https://');
      store.set('qtl-ten', $('#hlng', root).value.trim());
      const o = { ten, buoi: $('#hlb', root).value, cach: $('#hlc', root).value, ghi_chu: $('#hlg', root).value.trim(), kid: $$('.hlk input:checked', root).map(i => i.value), lh: (lhCur() || {}).id || '', tu: S.vai === 'ql' ? 'ql' : 'gv', nguoi: store.get('qtl-ten') || '' };
      b.disabled = true; b.textContent = x ? 'Đang tải lên…' : 'Đang gửi…';
      if (x) { o.file = x.name; o.mime = x.type || 'application/octet-stream'; o.b64 = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = no; r.readAsDataURL(x); }); } else o.url = url;
      const r = await call('qt_hl_them', o);
      if (!r.ok) { b.disabled = false; b.textContent = 'Gửi quản lý lớp'; if (r.qua_lon) return qua(MB(x.size)); return toast(r.err || 'Chưa gửi được'); }
      toast('Đã gửi quản lý lớp'); refresh(true);
    };
  }
  async function taiHl(id, b) {
    b.disabled = true; const t = b.textContent; b.textContent = 'Đang tải…';
    const r = await call('qt_hl_lay', { id }); b.disabled = false; b.textContent = t; if (!r.ok) return toast(r.err || 'Chưa tải được');
    const bin = atob(r.b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([u8], { type: r.mime })); a.download = r.ten || 'hoc-lieu'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  /* ---------- sự kiện ---------- */
  const draw0 = draw;
  draw = function () {
    draw0.apply(this, arguments); const root = $('#main'); if (!root || !S.d) return;
    $$('[data-vai]', root).forEach(b => b.onclick = () => chonVai(b.dataset.vai));
    $$('[data-cp]', root).forEach(b => b.onclick = async () => { const t = b.dataset.cp; try { await navigator.clipboard.writeText(t); toast('Đã chép. Dán vào Zalo nhé.'); } catch (e) { prompt('Chép nội dung này:', t); } });
    $$('[data-gotab]', root).forEach(b => b.onclick = () => { S.tab = b.dataset.gotab; draw(); scrollTo(0, 0); });
    bindHl(root);
    const hsua = async (id, o, msg) => { const r = await call('qt_hl_sua', Object.assign({ id }, o)); if (!r.ok) return toast(r.err || 'Chưa lưu được'); toast(msg); refresh(true); };
    $$('[data-hlget]', root).forEach(b => b.onclick = () => taiHl(b.dataset.hlget, b));
    $$('[data-hlphat]', root).forEach(b => b.onclick = () => { const on = b.getAttribute('aria-pressed') !== 'true'; hsua(b.dataset.hlphat, { phat: on ? 1 : 0 }, on ? 'Đã đánh dấu in phát' : 'Đã bỏ đánh dấu'); });
    $$('[data-hlgui]', root).forEach(b => b.onclick = () => { const on = b.getAttribute('aria-pressed') !== 'true'; hsua(b.dataset.hlgui, { gui: on ? 1 : 0 }, on ? 'Đã đánh dấu gửi phụ huynh' : 'Đã bỏ đánh dấu'); });
    $$('[data-hlan]', root).forEach(b => b.onclick = () => { if (confirm('Ẩn học liệu này khỏi danh sách? (File trong Drive vẫn giữ.)')) hsua(b.dataset.hlan, { an: 1 }, 'Đã ẩn'); });
    $$('[data-tdloai]', root).forEach(b => b.onclick = () => { S.tdLoai = b.dataset.tdloai; const n = $('#tdn').value; keepDraw(); $('.tdgui').open = true; $('#tdn').value = n; });
    $$('[data-tdmau]', root).forEach(b => b.onclick = () => { const M = moc(derive()), k = S.d.kids.find(x => x.id === $('#tdk').value);
      $('#tdn').value = MAU[S.vai][+b.dataset.tdmau].replace(/\{con\}/g, k ? k.ten : '…').replace(/\{buoi\}/g, $('#tdb').value || (M.N != null ? M.N : '')); $('#tdn').focus(); });
    const send = $('#tdsend', root); if (send) send.onclick = async () => { const nd = $('#tdn').value.trim(); if (!nd) return toast('Nhập nội dung');
      store.set('qtl-ten', $('#tdten').value.trim()); send.disabled = true;
      const ok = await guiTd({ loai: S.tdLoai === 'tin' ? 'tin' : 'viec', kid: $('#tdk').value, buoi: $('#tdb').value, han: $('#tdh') ? $('#tdh').value : '', noi_dung: nd }); if (!ok) send.disabled = false; };
    const sua = async (id, o, msg) => { const r = await call('qt_td_sua', Object.assign({ id }, o)); if (!r.ok) return toast(r.err || 'Chưa lưu được'); toast(msg); refresh(true); };
    $$('[data-tdx]', root).forEach(b => b.onclick = () => sua(b.dataset.tdx, { tt: 'xong' }, 'Đã đánh dấu xong'));
    $$('[data-tdmo]', root).forEach(b => b.onclick = () => sua(b.dataset.tdmo, { tt: 'mo' }, 'Đã mở lại'));
    $$('[data-tdxoa]', root).forEach(b => b.onclick = () => { if (confirm('Xoá mục này?')) sua(b.dataset.tdxoa, { tt: 'xoa' }, 'Đã xoá'); });
    $$('[data-tdtl]', root).forEach(b => b.onclick = () => { const t = S.d.td.find(x => x.id === b.dataset.tdtl), a = prompt('Trả lời:', t.tl || ''); if (a == null) return; sua(t.id, { tra_loi: a }, 'Đã gửi trả lời'); });
    $$('[data-nho]', root).forEach(b => b.onclick = async () => { const [kid, key, i] = b.dataset.nho.split('|'), v = GIAI_PHAP[key], g = v.gp[+i], M = moc(derive());
      b.disabled = true; const ok = await guiTd({ loai: 'viec', kid, buoi: M.L == null ? '' : M.L, noi_dung: `${v.t}: ${g[1]}` }); if (!ok) b.disabled = false; });
    $$('[data-gp]', root).forEach(b => b.onclick = async () => {
      const [kid, key, i] = b.dataset.gp.split('|'), v = GIAI_PHAP[key], g = v.gp[+i], M = moc(derive());
      b.disabled = true; const r = await call('qt_gc_them', { kid, loai: 'ho_tro', buoi: M.L == null ? '' : M.L, noi_dung: `Hỗ trợ · ${v.t}: ${g[1]} (${VAI[g[0]].ten})`, chia_se: '' });
      if (!r.ok) { b.disabled = false; return toast(r.err || 'Chưa lưu được'); }
      toast('Đã ghi giải pháp vào hồ sơ con'); refresh(true);
    });
  };
  /* trang đã vẽ trước khi tệp này nạp (chế độ xem thử): vẽ lại theo vai */
  if (S.d) draw();
})();
