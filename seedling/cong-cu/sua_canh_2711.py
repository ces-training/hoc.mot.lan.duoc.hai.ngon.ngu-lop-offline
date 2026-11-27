"""Ghép lại các cảnh canh/ bị lệch nghĩa so với câu (tester báo, rà 27/11/2026).
Chỉ ghi đè tệp ảnh cùng tên (tai-nguyen/canh/u<n>/p<k>_<i>.webp), không đổi dữ liệu.
Chạy ở gốc repo: python3 -I seedling/cong-cu/sua_canh_2711.py [id ...]   (không có id = làm tất cả)
Tài nguyên mới: tai-nguyen/tranh-moi/*.webp (chó bông, bút chì, bút sáp, máy tính, chuột, bé 3 tuổi, nha sĩ, khung ảnh), trang/ls_park_snow.webp.
"""
import json, os, re, subprocess, sys, importlib.util, colorsys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); os.chdir(ROOT)
sp = importlib.util.spec_from_file_location('sd48', 'chuong-trinh/cong-cu/khung/grid/mang/sd48_mang.py'); MG = importlib.util.module_from_spec(sp); sp.loader.exec_module(MG)
SD = json.loads(subprocess.run(['node', '-e', 'global.window=global;require(process.argv[1]);process.stdout.write(JSON.stringify(SD))',
                                os.path.abspath('seedling/seedling-data.js')], capture_output=True, text=True, check=True).stdout)
S = 'seedling/'; T = S + 'tai-nguyen/'; NV = T + 'nhan-vat/'; TRG = T + 'trang/'; PIC = T + 'tranh/'; NEW = T + 'tranh-moi/'
WFILE = {k: S + v[1] for k, v in SD['who'].items() if k not in ('narr', 'kids')}
ADULT = {'lan', 'ong', 'ba', 'bo_leo', 'bo_anna', 'me_bong', 'bo_bong', 'me_leo', 'me_xm', 'man'}
NAMES = [('Mrs Lan', 'lan'), ('Bông', 'bong'), ('Leo', 'leo'), ('Anna', 'anna'), ('Xiaomei', 'xiaomei'), ('Vũ', 'nhan'), ('Grandma', 'ba'), ('Grandpa', 'ong'), ('kids', 'kids')]
STOP = {'big', 'small', 'little', 'long', 'new', 'young', 'white', 'black', 'blue', 'green', 'red', 'pink', 'yellow', 'orange', 'purple', 'grey', 'colour', 'play', 'love',
        'fun', 'happy', 'water', 'game', 'song', 'number', 'hand', 'open', 'close', 'touch', 'under', 'look', 'see', 'animal', 'cool', 'hot', 'cold', 'tall', 'sad', 'tired'}
KEYS = sorted([f[:-5] for f in os.listdir(PIC) if f.endswith('.webp') and not f.startswith('de_')], key=lambda k: -len(k))

# ---------- vẽ tay phần dùng chung (copy từ ap_mang_sd48.py) ----------
def card_img(im, size):
    if abs(im.width - im.height) > 4:
        if im.getbbox(): im = im.crop(im.getbbox())
        if im.height > 1.3 * im.width: im = im.crop((0, 0, im.width, int(im.width * 1.25)))
        h = size - 8; w = max(1, int(im.width * h / im.height))
        if w > size - 8: w = size - 8; h = max(1, int(im.height * w / im.width))
        sq = Image.new('RGBA', (size, size), (0, 0, 0, 0)); sq.alpha_composite(im.resize((w, h), Image.LANCZOS), ((size - w) // 2, size - h - 4)); im = sq
    else: im = im.resize((size, size), Image.LANCZOS)
    pad = 10
    c = Image.new('RGBA', (size + 2 * pad, size + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(c).rounded_rectangle([0, 0, size + 2 * pad - 1, size + 2 * pad - 1], 26, fill=(255, 255, 255, 255), outline=(240, 200, 80, 255), width=6)
    mk = Image.new('L', (size, size), 0); ImageDraw.Draw(mk).rounded_rectangle([0, 0, size - 1, size - 1], 20, fill=255)
    c.paste(im, (pad, pad), mk); return c

def tint(im, mul):
    a = np.array(im.convert('RGBA')).astype(float)
    a[:, :, :3] *= np.array(mul)
    return Image.fromarray(np.clip(a, 0, 255).astype('uint8'), 'RGBA')

def recolor(im, kind):
    """Đổi màu vật trong ô tranh: shorts→white, skirt→pink, glasses→gold (theo câu)."""
    a = np.array(im.convert('RGBA')).astype(float) / 255
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mx = a[:, :, :3].max(2); mn = a[:, :, :3].min(2); sat = (mx - mn) / np.maximum(mx, 1e-6)
    h = np.zeros_like(mx)
    d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    warm = ((h < 45) | (h > 335)) & (sat > 0.4) & (mx > 0.35)
    out = a.copy()
    for i in range(a.shape[0]):
        pass
    if kind == 'white':     # cam → trắng, giữ bóng theo độ sáng
        v = np.clip(mx * 0.35 + 0.72, 0, 1); out[:, :, 0] = np.where(warm, v, r); out[:, :, 1] = np.where(warm, v, g); out[:, :, 2] = np.where(warm, v * 0.99, b)
    elif kind == 'pink':    # đỏ → hồng
        v = np.clip(mx * 0.2 + 0.85, 0, 1); out[:, :, 0] = np.where(warm, v, r); out[:, :, 1] = np.where(warm, v * (0.55 + 0.25 * (1 - sat)), g); out[:, :, 2] = np.where(warm, v * 0.75, b)
    elif kind == 'gold':    # đỏ → vàng kim
        v = np.clip(mx * 0.25 + 0.80, 0, 1); out[:, :, 0] = np.where(warm, v, r); out[:, :, 1] = np.where(warm, v * 0.78, g); out[:, :, 2] = np.where(warm, v * 0.18, b)
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype('uint8'), 'RGBA')

def photo_inset(sheet, w=520):
    """Khung ảnh gỗ chứa tranh gia đình (không có chữ)."""
    fam = Image.open(NV + sheet).convert('RGBA'); fam = fam.crop(fam.getbbox()) if fam.getbbox() else fam
    h = int(w * 0.62); fr = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(fr)
    d.rounded_rectangle([0, 0, w - 1, h - 1], 18, fill=(150, 98, 52, 255), outline=(92, 58, 28, 255), width=5)
    d.rectangle([20, 20, w - 21, h - 21], fill=(255, 252, 244, 255), outline=(92, 58, 28, 255), width=3)
    iw, ih = w - 56, h - 56; k = min(iw / fam.width, ih / fam.height)
    f2 = fam.resize((int(fam.width * k), int(fam.height * k)), Image.LANCZOS)
    fr.alpha_composite(f2, ((w - f2.width) // 2, (h - f2.height) // 2)); return fr

# ---------- phân giải tham chiếu ----------
def pic(ref):
    """ref: khoá tranh | 'new:x' | 'nv:x' | 'photo:bong' | 'rc:<kind>:<khoá tranh>' -> ảnh RGBA hoặc (ảnh, đã là khung)"""
    if isinstance(ref, Image.Image): return ref
    if ref.startswith('new:'): return Image.open(NEW + ref[4:] + '.webp').convert('RGBA')
    if ref.startswith('nv:'): return Image.open(NV + ref[3:] + '.webp').convert('RGBA')
    if ref.startswith('photo:'): return photo_inset('bang_fam_' + ref[6:] + '.webp')
    if ref.startswith('rc:'):
        _, kind, key = ref.split(':'); return recolor(Image.open(PIC + key + '.webp'), kind)
    for p in (PIC + ref + '.webp', NV + ref + '_a.webp', NV + ref + '.webp'):
        if os.path.exists(p): return Image.open(p).convert('RGBA')
    raise FileNotFoundError(ref)

def person(w, h, night=False):
    sc = 1.0
    if isinstance(w, tuple): w, sc = w
    if w.startswith('f:'): im = Image.open(NV + w[2:] + '_a.webp').convert('RGBA'); base = 1.25 if re.search(r'_(me|bo|ong|ba)$', w) else 1.0
    elif w.startswith('new:'): im = Image.open(NEW + w[4:] + '.webp').convert('RGBA'); base = 1.0
    elif w == 'kids':
        ims = [Image.open(WFILE[k]).convert('RGBA') for k in ('leo', 'anna', 'xiaomei')]
        hh = int(h * 0.85); ims = [i.resize((int(i.width * hh / i.height), hh), Image.LANCZOS) for i in ims]
        c = Image.new('RGBA', (sum(i.width for i in ims) - 60, hh), (0, 0, 0, 0)); x = 0
        for i in ims: c.alpha_composite(i, (x, 0)); x += i.width - 30
        return c
    else: im = Image.open(WFILE.get(w, WFILE['bong'])).convert('RGBA'); base = 1.25 if w in ADULT else (1.1 if w == 'anh_nhan' else 1.0)
    hh = max(1, int(h * base * sc)); im = im.resize((max(1, int(im.width * hh / im.height)), hh), Image.LANCZOS)
    return tint(im, (0.78, 0.82, 1.0)) if night else im

def scene(out, bg, ppl, items, night=False, props=()):
    base = Image.open(TRG + bg + '.webp').convert('RGBA').resize((900, 900))
    if night: base = tint(base, (0.36, 0.44, 0.78))
    n = len(ppl)
    for i, w in enumerate(ppl):
        im = person(w, 470 if n < 3 else 400, night)
        cx = int(900 * (i + 1) / (n + 1)); base.alpha_composite(im, (max(0, min(900 - im.width, cx - im.width // 2)), 885 - im.height))
    for j, f in enumerate(items[:2]):
        im = pic(f); sz = (300 if not ppl else 220) if len(items) == 1 else 190
        c = im if (isinstance(f, str) and f.startswith('photo:')) else card_img(im, sz)
        if isinstance(f, str) and f.startswith('photo:'):
            c = c.resize((int(c.width * (sz + 140) / c.width), int(c.height * (sz + 140) / c.width)), Image.LANCZOS)
        x = (900 - c.width) // 2 if len(items) == 1 else (180 + j * 330); base.alpha_composite(c, (x, 40 if ppl else 250))
    for (ref, x, hgt) in props:      # vật đặt dưới đất / chồng lên: (tham chiếu, tâm x, cao)
        im = pic(ref); im = im.resize((max(1, int(im.width * hgt / im.height)), hgt), Image.LANCZOS)
        base.alpha_composite(im, (max(0, min(900 - im.width, x - im.width // 2)), 885 - im.height))
    os.makedirs(os.path.dirname(out), exist_ok=True); base.convert('RGB').save(out, quality=84)

def named(text, parent):
    hits = []
    for nm, c in NAMES + list(parent.items()):
        for mt in re.finditer(r'(?<![A-Za-zÀ-ỹ])' + re.escape(nm) + r'(?![a-zà-ỹ])', text): hits.append((mt.start(), c))
    out = []
    for _, c in sorted(hits):
        if c not in out: out.append(c)
    return out[:3]

def words_in(text, pref):
    t = ' ' + re.sub(r"[^a-z' ]", ' ', text.lower().replace('-', ' ')) + ' '; out = []
    for k in pref + KEYS:
        if (k in STOP and k not in pref) or k in out: continue
        w = k.replace('_', ' ')
        if re.search(r'(?<![a-z])' + re.escape(w) + r'(s|es)?(?![a-z])', t): out.append(k)
        if len(out) == 2: break
    return out

DAYS = SD['days']
def unit_days(n, kind):
    return sorted(int(k) for k, d in DAYS.items() if str(d.get('unit')) == str(n) and d.get('kind') == kind)

# ---------- bảng sửa: id -> {ppl, items, bg, night, props}; không ghi khoá nào thì tự suy như bản dựng cũ ----------
FIX = {
    'u2/p5_1': dict(ppl=[('anh_nhan', 1.1)], items=['table']),
    'u3/p1_1': dict(ppl=['lan'], items=['photo:bong']),
    'u3/p1_2': dict(ppl=['lan', 'bong'], items=['photo:bong']),
    'u3/p1_3': dict(ppl=['bong', 'leo'], items=['photo:bong']),
    'u3/p1_4': dict(ppl=['leo', 'bong'], items=['photo:bong']),
    'u3/p1_5': dict(ppl=['bong', 'leo'], items=['nv:fam_bong_me_a']),
    'u3/p2_1': dict(ppl=['leo', 'bong'], items=['photo:bong']),
    'u3/p2_2': dict(ppl=['bong', 'leo'], items=['nv:fam_bong_anh_trai_a']),
    'u3/p2_3': dict(ppl=['anna', 'bong'], items=['photo:bong']),
    'u3/p2_4': dict(ppl=['bong', 'leo'], items=['nv:fam_bong_em_gai_a']),
    'u3/p2_5': dict(ppl=['leo', 'bong'], items=['young']),
    'u3/p2_6': dict(ppl=['bong', 'leo'], items=['young']),
    'u3/p3_1': dict(ppl=['me_xm'], items=['door']),
    'u3/p3_3': dict(ppl=['xiaomei', 'me_xm'], items=[]),
    'u3/p3_4': dict(ppl=['lan', 'me_xm'], items=[]),
    'u3/p4_5': dict(ppl=['xiaomei', ('new:boy3', 0.70)], items=[]),
    'u3/p5_2': dict(ppl=['anna', 'f:fam_anna_ong', 'f:fam_anna_ba'], items=[]),
    'u3/p5_4': dict(ppl=['anna', 'bo_anna', 'f:fam_anna_me'], items=[]),
    'u3/p6_5': dict(ppl=['xiaomei', 'me_xm'], items=['aunt']),
    'u3/p6_6': dict(ppl=['lan', 'bong'], items=[]),
    'u4/p2_1': dict(ppl=['bong', ('man', 1.55)], items=[]),
    'u5/p1_4': dict(ppl=['me_leo', 'bong', 'anna'], items=[]),
    'u5/p2_3': dict(ppl=['leo', 'ba'], items=['new:dog_sit']),
    'u5/p2_4': dict(ppl=['leo', 'ba'], items=['new:dog_sit']),
    'u5/p4_1': dict(ppl=['leo'], items=['new:dog_sit']),
    'u5/p4_2': dict(ppl=['bong', 'leo'], items=['new:dog_jump']),
    'u5/p5_5': dict(ppl=['leo'], items=['table'], props=[('nv:pets_meo_dung_a', 450, 200)]),
    'u5/p5_6': dict(ppl=['leo'], items=['water'], props=[('nv:pets_meo_dung_a', 700, 230)]),
    'u5/p6_1': dict(ppl=['leo'], items=['sleepy'], night=True),
    'u5/p6_5': dict(ppl=['leo'], items=[], night=True),
    'u5/p6_6': dict(ppl=['me_leo', 'leo'], items=[], night=True),
    'u6/p1_3': dict(ppl=['me_bong', 'bong'], items=['new:pencil', 'new:crayon']),
    'u6/p1_4': dict(ppl=['bong', 'me_bong'], items=['new:crayon']),
    'u6/p1_5': dict(ppl=['me_bong', 'bong'], items=['new:crayon']),
    'u6/p1_6': dict(ppl=['bong'], items=['new:pencil', 'new:crayon']),
    'u6/p6_1': dict(ppl=['leo', 'bong', 'anna'], items=['new:computer']),
    'u8/p4_2': dict(ppl=[], items=[], props=[('new:mouse', 450, 560)]),
    'u8/p4_3': dict(ppl=['leo'], items=[], props=[('new:mouse', 680, 330)]),
    'u11/p4_4': dict(items=['rc:white:shorts']), 'u11/p4_6': dict(items=['rc:white:shorts']),
    'u11/p5_2': dict(items=['rc:pink:skirt', 'sock']), 'u11/p5_5': dict(items=['rc:pink:skirt']),
    'u11/p6_1': dict(items=['rc:gold:glasses']), 'u11/p6_2': dict(items=['rc:gold:glasses']), 'u11/p6_6': dict(items=['rc:gold:glasses']),
    'u12/p6_5': dict(ppl=['leo', 'ba'], items=['photo:leo']),
    'u12/p6_6': dict(ppl=['leo', 'ba'], items=['photo:leo', 'ten']),
}
for k in ('p5_1', 'p5_2', 'p5_3', 'p5_4', 'p5_5', 'p5_6', 'p6_1', 'p6_2', 'p6_3'):
    FIX.setdefault('u10/' + k, {})['bg'] = 'ls_park_snow'

def run(ids):
    done = []
    for sid in ids:
        u, pk = sid.split('/'); n = int(u[1:]); k = int(pk[1:pk.index('_')]) - 1; i = int(pk[pk.index('_') + 1:]) - 1
        M = MG.U[n]
        if 'phan' in M: P = M['phan'][k][2]
        else:
            tr = next(x for x in DAYS[str(unit_days(n, 'Phần')[k])]['steps'] if x['type'] == 'truyen' and not x.get('lab'))
            P = [(x['who'], x['en'], x['zh']) for x in tr['scenes']]
        w, e, z = P[i]
        bgs = M['bg'] if isinstance(M['bg'], list) else [M['bg']] * 6
        M = dict(M, parent=M.get('parent') or {'Grandpa': 'ong'})
        f = FIX[sid]
        if 'ppl' in f: ppl = f['ppl']
        elif w == 'narr': ppl = named(e, M.get('parent', {}))
        else:
            nxt = next((x[0] for x in P[i + 1:] + P[:i][::-1] if x[0] not in ('narr', w)), None)
            ppl = [w] + ([nxt] if nxt and nxt != 'kids' or (nxt == 'kids' and w != 'kids') else [])
            ppl = [x for j, x in enumerate(ppl) if x not in ppl[:j]][:2]
        if 'items' in f: items = f['items']
        else:
            ph = unit_days(n, 'Phần')
            pref = [os.path.basename(cd.get('img', ''))[:-5] for c in sum([DAYS[str(x)]['steps'] for x in ph], []) if c['type'] == 'the'
                    for cd in c['cards'] if cd.get('img', '').startswith('tai-nguyen/tranh/')]
            items = words_in(e, pref)
        if 'ppl' not in f and not ppl and not items:
            spk = [x[0] for x in P if x[0] not in ('narr', 'kids')]; ppl = spk[:1] or ['bong']
        # đổi màu cho cảnh tự suy: khoá tranh shorts/skirt/glasses được thay bằng bản đổi màu
        scene(T + f'canh/{sid}.webp', f.get('bg', bgs[k]), ppl, items, f.get('night', False), f.get('props', ()))
        done.append(sid)
    return done

if __name__ == '__main__':
    ids = sys.argv[1:] or list(FIX)
    print(len(run(ids)), 'cảnh')
