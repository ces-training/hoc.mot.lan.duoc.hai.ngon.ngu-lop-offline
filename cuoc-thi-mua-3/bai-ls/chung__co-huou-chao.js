/* Cô Hươu nói khi con vừa vào trang chủ (chị chốt 26/11/2026).
   - Đọc câu "Hôm nay con học: …" của ngày con sắp học (giọng đã thu, lấy trong SD.vi_tx).
   - Ngày đó chưa có giọng thu (Little Seed hiện chưa thu các câu này) thì đọc câu bản đồ đã thu:
     "Con chạm vào ngày học đang nhấp nháy để bắt đầu nhé!". Không dùng giọng máy cho tiếng Việt.
   - Mỗi lần mở trang chỉ nói một lần, và chỉ sau khi con đã chạm màn hình (trình duyệt chặn tiếng trước đó).
   Nạp SAU <khoá>-bai-moi.js (nơi có viewHome bản 99 ngày). */
(function () {
  if (typeof viewHome !== 'function') return;
  let daNoi = false;
  const daCham = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;
  function chao() {
    if (daNoi || !daCham() || !/^(#\/?)?$/.test(location.hash)) return;
    if (document.querySelector('.splash, .mu-ov')) return;   // còn màn "Chạm để bắt đầu" hoặc hộp đăng nhập
    daNoi = true;
    try {
      const n = nextDay(), d = SD.days[n];
      const t = d && d.goal ? ('Hôm nay con học: ' + d.goal).trim() : '';
      const coGiong = t && (SD.vi_tx || {})[t];
      setTimeout(() => { if (!/^(#\/?)?$/.test(location.hash)) return; coGiong ? say({ t, l: 'vi' }) : hd('map'); }, 450);
    } catch (e) {}
  }
  const goc = viewHome;
  viewHome = function () { const r = goc.apply(this, arguments); chao(); return r; };
  /* hộp đăng nhập đóng lại sau khi trang chủ đã vẽ: thử nói lại một lần */
  document.addEventListener('click', () => setTimeout(chao, 300), true);
})();
