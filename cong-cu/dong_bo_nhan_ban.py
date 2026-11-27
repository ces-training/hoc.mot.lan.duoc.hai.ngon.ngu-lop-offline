#!/usr/bin/env python3
"""Đồng bộ MỘT CHIỀU: web gốc (kho này) → các web nhân bản (chị Duyên chốt 27/11/2026).

    python3 cong-cu/dong_bo_nhan_ban.py --thu                     # chỉ báo sẽ đổi gì
    python3 cong-cu/dong_bo_nhan_ban.py                           # chép thật vào các kho nhân bản đã clone
    python3 cong-cu/dong_bo_nhan_ban.py --tu-hoc DIR --cuoc-thi DIR   # chỉ đường dẫn clone (mặc định: cạnh kho này)

Quy tắc:
- Sửa nội dung (bài, tranh, giọng, dữ liệu) Ở KHO GỐC NÀY, rồi chạy công cụ này: các nhân bản tự theo.
- KHÔNG có chiều ngược lại: sửa ở nhân bản không được chép về gốc (lần đồng bộ sau sẽ ghi đè).
- Phần riêng của từng nhân bản (đăng nhập, gói, máy chủ, xếp hạng, quản trị…) do công cụ lấy bài của chính kho đó giữ nguyên.
- Công cụ chỉ chép tệp và kiểm cú pháp, KHÔNG commit hay đẩy: người chạy xem kết quả, kiểm bằng trình duyệt rồi mới commit/đẩy.
"""
import argparse, os, subprocess, sys

GOC = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
NHAN_BAN = [
    # (tên, kho GitHub, thư mục clone mặc định, lệnh chạy trong thư mục đó; {nguon} = kho gốc)
    ('tu-hoc', 'ces-training/anh-trung-kids-tu-hoc', os.path.join(GOC, '..', 'anh-trung-kids-tu-hoc'),
     ['python3', 'cong-cu/lay_bai_tu_web_offline.py', '{nguon}']),
    ('cuoc-thi', 'ces-training/anh-trung-kids-cuoc-thi-7-chang', os.path.join(GOC, '..', 'anh-trung-kids-cuoc-thi-7-chang'),
     ['python3', 'cuoc-thi-mua-3/cong-cu/lay_bai_tu_web_offline.py', '{nguon}']),
]


# Thư mục RIÊNG của nhân bản, không có ở gốc: công cụ lấy bài của kho đó có thể xoá chúng, nên khôi phục sau khi chép
GIU_RIENG = {'cuoc-thi': ['xem-truoc/tai-nguyen/qua'],      # phòng đổi quà của cuộc thi
             'tu-hoc': []}


def run(cmd, cwd):
    print('$', ' '.join(cmd), '   (trong', cwd + ')')
    return subprocess.run(cmd, cwd=cwd).returncode


def kiem_cu_phap(d):
    out = subprocess.run(['git', 'status', '--short'], cwd=d, capture_output=True, text=True).stdout.splitlines()
    js = [l[3:].strip().strip('"') for l in out if l[3:].strip().strip('"').endswith('.js')]
    bad = [f for f in js if subprocess.run(['node', '--check', os.path.join(d, f)], capture_output=True).returncode]
    print(f'  node --check: {len(js)} tệp .js đã đổi, lỗi {len(bad)}', bad if bad else '')
    return not bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--thu', action='store_true'); ap.add_argument('--tu-hoc'); ap.add_argument('--cuoc-thi')
    a = ap.parse_args(); ok = True
    # 1) bản sao cuộc thi nằm ngay trong kho gốc (cuoc-thi-mua-3/): dựng lại bằng công cụ của nó
    if not a.thu: ok &= run(['python3', 'cuoc-thi-mua-3/cong-cu/dung_bai_offline.py'], GOC) == 0
    # 2) các kho nhân bản
    dirs = {'tu-hoc': a.tu_hoc, 'cuoc-thi': a.cuoc_thi}
    for ten, repo, mac_dinh, cmd in NHAN_BAN:
        d = os.path.abspath(dirs[ten] or mac_dinh)
        print(f'\n== {ten} ({repo}) ==')
        if not os.path.isdir(os.path.join(d, '.git')):
            print(f'  CHƯA CLONE: git clone --depth 1 https://github.com/{repo} {d}'); ok = False; continue
        c = [x.replace('{nguon}', GOC) for x in cmd] + (['--thu'] if a.thu else [])
        if run(c, d): ok = False; continue
        if not a.thu:
            for rp in GIU_RIENG.get(ten, []):
                subprocess.run(['git', 'checkout', '--', rp], cwd=d, capture_output=True)
                print('  giữ nguyên thư mục riêng:', rp)
        if not a.thu: ok &= kiem_cu_phap(d)
    print('\nXong. Việc tiếp theo: mở trang thử bằng trình duyệt, rồi commit và đẩy từng kho nhân bản.' if not a.thu else '\n(--thu: chưa ghi gì)')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
