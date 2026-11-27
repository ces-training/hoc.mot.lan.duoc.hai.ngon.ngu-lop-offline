"""Sinh quan-tri-lop/giao-an.js từ hai file kịch bản 48 buổi (Project "Lớp Offline tại CES"):
   KichBan_Offline_LS48.md và KichBan_Offline_SD48.md.
Chạy: python3 quan-tri-lop/cong-cu/tao_giao_an.py <KichBan_LS48.md> <KichBan_SD48.md>
Mỗi buổi lấy: tiêu đề, đoạn mô tả, "Sau buổi, con", "Đồ dùng", "Lời lớp học", "Chấm 4 đầu ra ở màn",
"Dặn cho buổi sau", "Việc ở nhà" và tin Zalo mẫu. Trang quản trị dùng để nhắc GV và quản lý lớp
buổi vừa học / buổi tới / con cần chuẩn bị gì. Sửa kịch bản thì chạy lại, đừng sửa tay giao-an.js."""
import json, re, sys, pathlib

KEYS = {'Sau buổi, con': 'sau', 'Đồ dùng': 'do', 'Lời lớp học': 'loi', 'Chấm 4 đầu ra ở màn': 'cham',
        'Dặn cho buổi sau': 'dan', 'Việc ở nhà': 'nha', 'Nếp lớp': 'nep', 'Đôi bạn': 'doi'}

def clean(t):
    t = re.sub(r'\*\*(.+?)\*\*', r'\1', t)
    t = re.sub(r'`([^`]*)`', r'\1', t)
    return re.sub(r'\s+', ' ', t).strip()

def parse(path):
    out, cur, para = {}, None, False
    for line in pathlib.Path(path).read_text(encoding='utf8').splitlines():
        m = re.match(r'^### Buổi (\d+) · (.+)$', line)
        if m:
            n = int(m.group(1)); cur = out[n] = {'tieu': clean(m.group(2))}; para = True; continue
        if line.startswith('## ') or line.startswith('# '):
            cur = None; continue
        if cur is None:
            continue
        if para and line.strip() and not line.startswith(('-', '|')):
            cur['mo'] = clean(line); para = False; continue
        m = re.match(r'^- \*\*([^*]+):\*\*\s*(.*)$', line)
        if m and m.group(1) in KEYS:
            k, v = KEYS[m.group(1)], clean(m.group(2)); para = False
            if k == 'nha':
                z = re.search(r'Zalo mẫu:\s*"(.+)"\s*$', v) or re.search(r'Zalo mẫu:\s*"(.+)', v)
                if z: cur['zalo'] = z.group(1).rstrip('"').strip()
                v = re.split(r'\s*·\s*Zalo mẫu:', v)[0].strip()
            cur[k] = v
    return out

def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    data = {'ls': parse(sys.argv[1]), 'sd': parse(sys.argv[2])}
    for k, v in data.items():
        print(k, len(v), 'buổi; có Zalo mẫu:', sum(1 for b in v.values() if b.get('zalo')), '; có Đồ dùng:', sum(1 for b in v.values() if b.get('do')))
    dst = pathlib.Path(__file__).resolve().parent.parent / 'giao-an.js'
    dst.write_text('/* sinh bởi quan-tri-lop/cong-cu/tao_giao_an.py từ KichBan_Offline_LS48.md và KichBan_Offline_SD48.md; đừng sửa tay */\n'
                   'window.GIAO_AN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf8')
    print(dst, dst.stat().st_size, 'bytes')

main()
