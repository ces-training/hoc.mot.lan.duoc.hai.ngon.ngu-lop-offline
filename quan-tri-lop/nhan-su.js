/* =====================================================================
   NHÂN SỰ · tài khoản đăng nhập trang quản trị (máy chủ bản 10). Nạp sau vai-tro.js.
   - Mục "Nhân sự" (chỉ tài khoản Quản trị): tạo tài khoản cho giáo viên, quản lý học tập, quản trị;
     giao lớp (của cả Little Seed và Seedling), đặt lại mật khẩu, khoá / mở tài khoản.
   - Đầu trang: tên người đang đăng nhập + nút Đổi mật khẩu (ai cũng tự đổi được).
   Mật khẩu chỉ gửi lên máy chủ để băm, không lưu trên máy này; máy chỉ nhớ "phiên đăng nhập" 30 ngày.
   ===================================================================== */
(function () {
  const VAI_TK = { qt: '🛡️ Quản trị', gv: '👩‍🏫 Giáo viên', ql: '🗂️ Quản lý học tập' };
  S.nv = null; S.nvEdit = null;

  async function taiNv() { const r = await call('qt_tk_ds'); if (!r.ok) { toast(r.err || 'Chưa tải được danh sách tài khoản'); return; } S.nv = r; draw(); }
  const tenLop = id => { const l = ((S.nv && S.nv.lh_all) || S.lhAll).find(x => x.id === id); return l ? LOPS[l.khoa].ten + ' · ' + l.ten : '(lớp đã xoá)'; };

  window.vNv = function () {
    if (!S.toi || S.toi.vai !== 'qt') return '<div class="card"><p>Chỉ tài khoản Quản trị mới vào được mục này.</p></div>';
    if (!S.nv) { setTimeout(taiNv, 0); return '<div class="card"><p class="muted">Đang tải danh sách tài khoản…</p></div>'; }
    const T = S.nv.tk, L = S.nv.lh_all, e = S.nvEdit && S.nvEdit !== 'new' ? T.find(x => x.id === S.nvEdit) : null, moi = S.nvEdit === 'new';
    const form = (moi || e) ? `<div class="card nvform"><h2>${moi ? 'Tạo tài khoản mới' : 'Sửa tài khoản ' + esc(e.ten_dn)}</h2>
      <div class="grid g2"><div><label class="f" for="nvten">Họ tên</label><input id="nvten" value="${esc(e ? e.ho_ten : '')}" autocomplete="off"></div>
        <div><label class="f" for="nvdn">Tên đăng nhập</label><input id="nvdn" value="${esc(e ? e.ten_dn : '')}" ${e ? 'disabled' : ''} autocapitalize="none" spellcheck="false" placeholder="vd: co.lan"></div></div>
      <label class="f">Vai</label><div class="chips">${Object.keys(VAI_TK).map(v => `<label class="nvv"><input type="radio" name="nvvai" value="${v}" ${(e ? e.vai : 'gv') === v ? 'checked' : ''}> ${VAI_TK[v]}</label>`).join('')}</div>
      <p class="sm muted">Quản trị thấy mọi lớp và quản lý tài khoản. Giáo viên, quản lý học tập chỉ thấy các lớp được giao dưới đây.</p>
      <label class="f">Lớp được giao</label>${L.length ? Object.keys(LOPS).map(k => { const ls = L.filter(l => l.khoa === k); return ls.length ? `<div class="nvlop"><b class="sm">${esc(LOPS[k].ten)}</b><div class="chips">${ls.map(l => `<label class="hlk"><input type="checkbox" value="${esc(l.id)}" ${e && e.lh.includes(l.id) ? 'checked' : ''}> ${esc(l.ten)}</label>`).join('')}</div></div>` : ''; }).join('') : '<p class="sm muted">Chưa có lớp nào. Tạo lớp ở mục Lớp học trước.</p>'}
      <label class="f" for="nvp">${e ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu tạm (ít nhất 6 ký tự)'}</label><div class="row"><input id="nvp" type="text" autocomplete="off" style="max-width:260px"><button class="ghost sm" type="button" id="nvgen">Tạo ngẫu nhiên</button></div>
      <div class="row" style="margin-top:10px"><button class="btn" type="button" id="nvsave">${e ? 'Lưu' : 'Tạo tài khoản'}</button><button class="ghost" type="button" id="nvhuy">Huỷ</button></div></div>` : '';
    const rows = T.map(u => `<tr class="${u.khoa ? 'off' : ''}"><td><b>${esc(u.ho_ten)}</b><br><span class="muted sm">${esc(u.ten_dn)}</span>${u.id === S.toi.id ? ' <span class="chip b">bạn</span>' : ''}</td>
      <td>${VAI_TK[u.vai] || u.vai}</td><td class="sm">${u.vai === 'qt' ? '<span class="muted">mọi lớp</span>' : u.lh.length ? u.lh.map(tenLop).map(esc).join('<br>') : '<span class="chip a">chưa giao lớp</span>'}</td>
      <td class="sm muted">${u.khoa ? '<span class="chip r">đã khoá</span>' : u.dn_cuoi ? 'vào ' + dmt(u.dn_cuoi) : 'chưa vào lần nào'}</td>
      <td><button class="ghost sm" type="button" data-nved="${esc(u.id)}">Sửa</button>${u.id !== S.toi.id ? ` <button class="ghost sm" type="button" data-nvkh="${esc(u.id)}|${u.khoa ? 0 : 1}">${u.khoa ? 'Mở khoá' : 'Khoá'}</button>` : ''}</td></tr>`).join('');
    return form + `<div class="card"><div class="row"><h2 class="grow">Nhân sự · tài khoản trang quản trị</h2><button class="btn" type="button" id="nvnew">+ Tạo tài khoản</button></div>
      <p class="muted sm">Gửi riêng cho từng người tên đăng nhập và mật khẩu tạm; họ tự đổi mật khẩu ở nút 🔑 trên đầu trang. Người nghỉ việc: bấm <b>Khoá</b>, máy của họ bị đăng xuất ngay.</p>
      <div class="att-scroll"><table class="tbl"><thead><tr><th>Người dùng</th><th>Vai</th><th>Lớp</th><th>Lần vào</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  function bindNv(root) {
    const nw = $('#nvnew', root); if (nw) nw.onclick = () => { S.nvEdit = 'new'; draw(); scrollTo(0, 0); $('#nvten').focus(); };
    $$('[data-nved]', root).forEach(b => b.onclick = () => { S.nvEdit = b.dataset.nved; draw(); scrollTo(0, 0); });
    $$('[data-nvkh]', root).forEach(b => b.onclick = async () => { const [id, k] = b.dataset.nvkh.split('|'), u = S.nv.tk.find(x => x.id === id);
      if (+k && !confirm(`Khoá tài khoản ${u.ho_ten}? Người này sẽ bị đăng xuất và không vào được nữa.`)) return;
      const r = await call('qt_tk_khoa', { id, khoa: +k }); if (!r.ok) return toast(r.err || 'Chưa lưu được'); toast(+k ? 'Đã khoá' : 'Đã mở khoá'); taiNv(); });
    const huy = $('#nvhuy', root); if (huy) huy.onclick = () => { S.nvEdit = null; draw(); };
    const gen = $('#nvgen', root); if (gen) gen.onclick = () => { const A = 'abcdefghjkmnpqrstuvwxyz23456789'; let p = ''; for (let i = 0; i < 8; i++) p += A[Math.floor(Math.random() * A.length)]; $('#nvp').value = p; };
    const sv = $('#nvsave', root); if (sv) sv.onclick = async () => {
      const e = S.nvEdit !== 'new' ? S.nvEdit : '', o = { ho_ten: $('#nvten').value.trim(), vai: ($('input[name=nvvai]:checked') || {}).value || 'gv', lh: $$('.nvlop input:checked').map(i => i.value), p: $('#nvp').value.trim() };
      if (e) o.id = e; else o.ten_dn = $('#nvdn').value.trim();
      if (!e && o.p.length < 6) return toast('Mật khẩu tạm cần ít nhất 6 ký tự');
      sv.disabled = true; const r = await call('qt_tk_luu', o); sv.disabled = false; if (!r.ok) return toast(r.err || 'Chưa lưu được');
      if (!e) { const t = `Tài khoản trang quản trị lớp offline\nLink: ${location.origin + location.pathname}\nTên đăng nhập: ${o.ten_dn.toLowerCase()}\nMật khẩu tạm: ${o.p}\nVào rồi đổi mật khẩu ở nút 🔑 trên đầu trang nhé.`;
        try { await navigator.clipboard.writeText(t); toast('Đã tạo. Thông tin đăng nhập đã chép, dán gửi riêng cho người dùng.'); } catch (x) { toast('Đã tạo tài khoản'); } }
      else toast('Đã lưu'); S.nvEdit = null; taiNv(); };
  }

  /* ---------- đầu trang: người đang đăng nhập + đổi mật khẩu ---------- */
  function chipToi() {
    if (!S.toi) return; let el = $('#toi'); const lo = $('#logout');
    if (!el && lo) { el = document.createElement('span'); el.id = 'toi'; el.className = 'toi'; lo.before(el); }
    if (el) { el.innerHTML = `<span class="sm">👤 <b>${esc(S.toi.ho_ten || S.toi.ten_dn)}</b></span> <button class="ghost sm" type="button" id="doimk" title="Đổi mật khẩu">🔑</button>`; $('#doimk').onclick = doiMk; }
  }
  function doiMk() {
    const o = document.createElement('div'); o.className = 'mkov'; o.innerHTML = `<form class="card mkbox" role="dialog" aria-modal="true" aria-label="Đổi mật khẩu"><h2>Đổi mật khẩu</h2>
      <label class="f" for="mk0">Mật khẩu hiện tại</label><input id="mk0" type="password" autocomplete="current-password">
      <label class="f" for="mk1">Mật khẩu mới (ít nhất 6 ký tự)</label><input id="mk1" type="password" autocomplete="new-password">
      <label class="f" for="mk2">Nhập lại mật khẩu mới</label><input id="mk2" type="password" autocomplete="new-password">
      <div class="err" id="mkerr" role="alert"></div><div class="row"><button class="btn" type="submit">Lưu</button><button class="ghost" type="button" id="mkhuy">Huỷ</button></div></form>`;
    document.body.appendChild(o); $('#mk0').focus();
    $('#mkhuy').onclick = () => o.remove();
    o.querySelector('form').onsubmit = async ev => { ev.preventDefault(); const er = $('#mkerr');
      if ($('#mk1').value !== $('#mk2').value) { er.textContent = 'Hai lần mật khẩu mới chưa giống nhau'; return; }
      const r = await call('qt_mk', { cu: $('#mk0').value, moi: $('#mk1').value }); if (!r.ok) { er.textContent = r.err || 'Chưa đổi được'; return; }
      setTok(r.tok); o.remove(); toast('Đã đổi mật khẩu. Các máy khác đang đăng nhập sẽ phải đăng nhập lại.'); };
  }

  const draw1 = draw;
  draw = function () { draw1.apply(this, arguments); if (!S.d) return; chipToi(); if (S.tab === 'nv') bindNv($('#main')); };
})();
