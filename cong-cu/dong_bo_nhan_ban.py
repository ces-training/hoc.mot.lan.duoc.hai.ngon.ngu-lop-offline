#!/usr/bin/env python3
"""Đồng bộ MỘT CHIỀU, GIỮ PHẦN RIÊNG: web gốc (kho này) → các web nhân bản (chị Duyên chốt 27/11/2026, sửa lúc 23:40).

    python3 cong-cu/dong_bo_nhan_ban.py --thu                       # chỉ báo sẽ làm gì
    python3 cong-cu/dong_bo_nhan_ban.py                             # trộn thật vào các kho nhân bản đã clone cạnh kho này
    python3 cong-cu/dong_bo_nhan_ban.py --tu-hoc DIR --cuoc-thi DIR
    python3 cong-cu/dong_bo_nhan_ban.py --dat-moc 685a42d           # chỉ ghi "lần đồng bộ cuối" cho nhân bản, không chép gì

Cách làm (trộn 3 bên, từng tệp, chỉ xét tệp web gốc ĐÃ ĐỔI từ lần đồng bộ cuối):
  gốc cũ  = tệp ở web gốc tại commit ghi trong `.dong-bo-goc` của nhân bản
  gốc mới = tệp ở web gốc hiện tại
  nhân bản = tệp đang có ở nhân bản (có thể đã được chỉnh riêng cho dự án)
  - nhân bản == gốc cũ  → lấy gốc mới (nhân bản chưa chỉnh gì)
  - nhân bản có chỉnh riêng, gốc mới đổi chỗ khác → TRỘN, giữ cả hai (git merge-file)
  - cùng một chỗ bị sửa ở cả hai (xung đột) → GIỮ BẢN NHÂN BẢN, ghi vào danh sách xung đột cho chị quyết, không chèn dấu xung đột vào mã
  - tệp riêng của nhân bản (không có ở gốc) không bao giờ bị xoá
  - thư mục/tệp trong DANH_SACH_RIENG (bảng điều khiển, quản trị, máy chủ, trang giới thiệu…) KHÔNG BAO GIỜ bị đụng: mỗi dự án có bảng điều khiển riêng theo nhu cầu admin của web đó
Không có chiều ngược lại: sửa ở nhân bản không bao giờ chép về gốc.
Công cụ chỉ ghi tệp, KHÔNG commit hay đẩy; người chạy kiểm bằng trình duyệt rồi mới commit, đẩy và báo chị.
Bản sao cuộc thi dựng tự động `cuoc-thi-mua-3/` trong kho nhân bản cuộc thi do công cụ riêng của nó dựng; công cụ này gọi nó rồi trả lại các tệp riêng.
"""
import argparse, fnmatch, os, shutil, subprocess, sys, tempfile

GOC = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
MOC = '.dong-bo-goc'      # tệp trong mỗi nhân bản: commit web gốc đã đồng bộ lần cuối

# Chỉ trộn các thư mục chung này (đường dẫn giống nhau ở gốc và nhân bản)
THU_MUC_CHUNG = ['little-seed', 'seedling', 'chung', 'xem-truoc', 'chuong-trinh', 'lop-zoom']

# Tệp/thư mục RIÊNG của từng nhân bản: không đụng (kiểu fnmatch, so với đường dẫn từ gốc kho)
CHUNG_RIENG = ['quan-tri/*', 'apps-script/*', 'cong-cu/*', 'index.html', 'README.md', 'CLAUDE.md', '.dong-bo-goc',
               '*/quan-tri/*', '*/apps-script/*', '*/bang-dieu-khien*', '*/dashboard*']
RIENG = {
    'tu-hoc': CHUNG_RIENG + ['chung/mo-unit-dau.js', 'seedling/cong-cu/*', 'chung/qua/*'],
    'cuoc-thi': CHUNG_RIENG + ['cuoc-thi-mua-3/*', 'xem-truoc/tai-nguyen/qua/*', 'chang-*/*'],
}
NHAN_BAN = [
    ('tu-hoc', 'ces-training/anh-trung-kids-tu-hoc', os.path.join(GOC, '..', 'anh-trung-kids-tu-hoc')),
    ('cuoc-thi', 'ces-training/anh-trung-kids-cuoc-thi-7-chang', os.path.join(GOC, '..', 'anh-trung-kids-cuoc-thi-7-chang')),
]
# Thư mục đồ nghề lấy riêng của từng nhân bản (không trộn bằng công cụ này)


def git(args, cwd, **kw):
    return subprocess.run(['git'] + args, cwd=cwd, capture_output=True, **kw)


def riêng(ten, rel):
    return any(fnmatch.fnmatch(rel, p) for p in RIENG[ten])


def goc_tai(commit, rel):
    r = git(['show', f'{commit}:{rel}'], GOC)
    return r.stdout if r.returncode == 0 else None


def doc(path):
    try:
        with open(path, 'rb') as f: return f.read()
    except FileNotFoundError:
        return None


def ghi(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f: f.write(data)


def tron(base, ours, theirs):
    """Trộn văn bản 3 bên. Trả (nội dung, có_xung_đột)."""
    with tempfile.TemporaryDirectory() as t:
        for n, d in (('o', ours), ('b', base), ('t', theirs)):
            ghi(os.path.join(t, n), d)
        r = subprocess.run(['git', 'merge-file', '-p', os.path.join(t, 'o'), os.path.join(t, 'b'), os.path.join(t, 't')], capture_output=True)
        return r.stdout, r.returncode != 0


def la_van_ban(b):
    return b is not None and b'\0' not in b[:8000]


def dong_bo_mot(ten, repo, d, thu):
    print(f'\n== {ten} ({repo}) ==')
    if not os.path.isdir(os.path.join(d, '.git')):
        print(f'  CHƯA CLONE: git clone https://github.com/{repo} {d}'); return False
    moc = (doc(os.path.join(d, MOC)) or b'').decode().strip()
    if not moc:
        print(f'  CHƯA CÓ {MOC}: chạy --dat-moc <commit gốc đã đồng bộ lần cuối> (vd. 685a42d) rồi chạy lại'); return False
    head = git(['rev-parse', 'HEAD'], GOC).stdout.decode().strip()
    ds = git(['diff', '--name-status', '--no-renames', moc, head, '--'] + THU_MUC_CHUNG, GOC).stdout.decode().splitlines()
    dem = {'lay-moi': 0, 'tron': 0, 'giu-rieng': 0, 'them': 0, 'xoa': 0, 'xung-dot': []}
    for l in ds:
        tt, rel = l.split('\t', 1)
        if riêng(ten, rel): dem['giu-rieng'] += 1; continue
        p = os.path.join(d, rel)
        cu, moi, nb = goc_tai(moc, rel), goc_tai(head, rel), doc(p)
        if tt == 'D':
            if nb is None: continue
            if nb == cu:
                dem['xoa'] += 1
                if not thu: os.remove(p)
            else: dem['xung-dot'].append(rel + ' (gốc xoá, nhân bản có chỉnh riêng: giữ)')
            continue
        if nb is None:
            dem['them'] += 1
            if not thu: ghi(p, moi)
        elif nb == moi: continue
        elif cu is None or nb == cu:
            dem['lay-moi'] += 1
            if not thu: ghi(p, moi)
        elif la_van_ban(nb) and la_van_ban(moi) and la_van_ban(cu):
            kq, xd = tron(cu, nb, moi)
            if xd: dem['xung-dot'].append(rel)
            elif kq != nb:
                dem['tron'] += 1
                if not thu: ghi(p, kq)
        else: dem['xung-dot'].append(rel + ' (ảnh/âm thanh nhân bản đã thay riêng: giữ)')
    print(f"  lấy mới {dem['lay-moi']} · trộn giữ phần riêng {dem['tron']} · thêm {dem['them']} · xoá {dem['xoa']} · bỏ qua vì là phần riêng {dem['giu-rieng']}")
    if dem['xung-dot']:
        print(f"  XUNG ĐỘT {len(dem['xung-dot'])} tệp (đã GIỮ bản nhân bản, chị/Claude xem từng tệp):")
        for x in dem['xung-dot'][:40]: print('    -', x)
    if thu: return True
    ghi(os.path.join(d, MOC), (head + '\n').encode())
    out = git(['status', '--short'], d).stdout.decode().splitlines()
    js = [l[3:].strip().strip('"') for l in out if l[3:].strip().strip('"').endswith('.js') and not l.startswith(' D') and not l.startswith('D')]
    bad = [f for f in js if subprocess.run(['node', '--check', os.path.join(d, f)], capture_output=True).returncode]
    print(f'  node --check: {len(js)} tệp .js đã đổi, lỗi {len(bad)}', bad if bad else '')
    return not bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--thu', action='store_true'); ap.add_argument('--tu-hoc'); ap.add_argument('--cuoc-thi')
    ap.add_argument('--dat-moc', metavar='COMMIT')
    a = ap.parse_args(); ok = True
    dirs = {'tu-hoc': a.tu_hoc, 'cuoc-thi': a.cuoc_thi}
    if a.dat_moc:
        c = git(['rev-parse', a.dat_moc], GOC).stdout.decode().strip()
        for ten, repo, md in NHAN_BAN:
            ghi(os.path.join(os.path.abspath(dirs[ten] or md), MOC), (c + '\n').encode()); print('đặt mốc', ten, c[:7])
        return
    if not a.thu:
        # bản sao cuộc thi sinh tự động nằm trong kho gốc: dựng lại
        ok &= subprocess.run(['python3', 'cuoc-thi-mua-3/cong-cu/dung_bai_offline.py'], cwd=GOC).returncode == 0
    for ten, repo, md in NHAN_BAN:
        ok &= dong_bo_mot(ten, repo, os.path.abspath(dirs[ten] or md), a.thu)
    if not a.thu:
        print('\nNếu nhân bản cuộc thi cần dựng lại bai-ls/bai-sd: chạy cuoc-thi-mua-3/cong-cu/lay_bai_tu_web_offline.py trong kho đó, rồi KIỂM các tệp riêng (index.html, *-may-chu.js, *-thuong.js, chung__tai-khoan-con.js) còn đúng bản riêng.')
    print('\nXong. Việc tiếp theo: mở trang thử bằng trình duyệt, rồi commit và đẩy từng kho nhân bản.' if not a.thu else '\n(--thu: chưa ghi gì)')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
