#!/usr/bin/env python3
"""Download the 3D assets used by game3d/ and convert them to compact web formats.

Sources (all free to redistribute):
  * Poly Haven (https://polyhaven.com) — models, PBR textures, HDRIs. License: CC0.
  * Microsoft Rocketbox (https://github.com/microsoft/Microsoft-Rocketbox) — human avatars and animation clips. License: MIT.

Raw downloads are cached in tools/.asset_cache (git-ignored). Outputs go to game3d/public/assets and ARE committed,
so the game builds without network access. Run:  python3 tools/fetch_assets.py   (needs game3d/node_modules).
"""
import json, os, shutil, subprocess, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'tools', '.asset_cache')
OUT = os.path.join(ROOT, 'game3d', 'public', 'assets')
GT = os.path.join(ROOT, 'game3d', 'node_modules', '.bin', 'gltf-transform')
UA = {'User-Agent': 'asset-fetch-script'}

MODELS = """metal_office_desk classic_laptop modern_arm_chair_01 drawer_cabinet steel_frame_shelves_01 steel_frame_shelves_03
old_military_crate wooden_military_crate ammo_box vintage_radio_transceiver mounted_fluorescent_lights security_camera_01
korean_fire_extinguisher_01 projector_screen metal_tool_chest portable_generator modular_airduct_rectangular_01 wall_clock
fire_alarm utility_box_01 power_box_01 office_notepads binder_notebook desk_lamp_arm_01 sofa_02 industrial_coffee_table
metal_trash_can metal_stool_01 clipboard stationery_supplies hanging_industrial_lamp industrial_wall_lamp binoculars
standing_chalkboard_01 metal_jerrycan_green portable_searchlight concrete_road_barrier potted_plant_01 potted_plant_04
book_encyclopedia_set_01 vintage_telephone_wall_clock industrial_storage_cart circuit_board retro_multimeter""".split()
TEXTURES = """concrete_floor_worn_001 smooth_concrete_floor granite_tile painted_concrete concrete_wall_008 painted_plaster_wall
ceiling_interior metal_plate blue_metal_plate dirty_carpet dark_wood rubber_tiles green_metal_rust brushed_concrete
wood_table_001 anti_slip_concrete rusty_metal_sheet white_plaster_02 plastered_wall_04 grey_plaster_02
beige_wall_001 concrete_panels precast_concrete_wall large_grey_tiles terrazzo_tiles laminate_floor_02 floor_tiles_06 concrete_wall_006 plastered_wall_02""".split()
HDRIS = ['empty_warehouse_01', 'missile_launch_facility_01']
TEX_RES, MODEL_RES = '2k', '1k'


def get(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r, open(path + '.part', 'wb') as f:
        f.write(r.read())
    os.replace(path + '.part', path)


def api(path):
    cp = os.path.join(CACHE, 'api', path.replace('/', '_') + '.json')
    get('https://api.polyhaven.com/' + path, cp)
    return json.load(open(cp))


def run(*a):
    r = subprocess.run(a, capture_output=True, text=True)
    if r.returncode:
        print('FAILED', ' '.join(a), r.stderr[-600:], file=sys.stderr)
    return r.returncode == 0


def model(name):
    dst = os.path.join(OUT, 'models', name + '.glb')
    if os.path.exists(dst):
        return True
    try:
        f = api('files/' + name)['gltf'][MODEL_RES]['gltf']
    except Exception as e:
        print('skip model', name, e); return False
    d = os.path.join(CACHE, 'models', name)
    src = os.path.join(d, name + '.gltf')
    get(f['url'], src)
    for rel, inc in f['include'].items():
        get(inc['url'], os.path.join(d, rel))
    return run(GT, 'optimize', src, dst, '--compress', 'quantize', '--texture-compress', 'webp', '--texture-size', '1024')


def texture(name):
    ok = True
    files = None
    for kind, key in (('diff', 'Diffuse'), ('nor', 'nor_dx'), ('arm', 'arm')):
        dst = os.path.join(OUT, 'tex', f'{name}_{kind}.webp')
        if os.path.exists(dst):
            continue
        try:
            files = files or api('files/' + name)
            url = files[key][TEX_RES]['jpg']['url']
        except Exception as e:
            print('skip texture', name, kind, e); ok = False; continue
        src = os.path.join(CACHE, 'tex', f'{name}_{kind}.jpg')
        get(url, src)
        # sharp ships with gltf-transform; quality 82 keeps normals clean enough at 2k
        js = ("import('sharp').then(m=>m.default(process.argv[1]).resize(%d).webp({quality:%d}).toFile(process.argv[2]))"
              % (1024 if kind == 'arm' else 2048, 88 if kind == 'nor' else 80))
        ok = run('node', '-e', js, src, dst) and ok
    return ok


def hdri(name):
    dst = os.path.join(OUT, 'env', name + '.hdr')
    if os.path.exists(dst):
        return True
    try:
        url = api('files/' + name)['hdri']['1k']['hdr']['url']
    except Exception as e:
        print('skip hdri', name, e); return False
    get(url, dst); return True


# ---- characters: Microsoft Rocketbox avatar library (MIT). Human soldiers/officers + animation clips on one skeleton.
RB_REPO = 'https://github.com/microsoft/Microsoft-Rocketbox.git'
RB_AVATARS = {'officer': 'Professions/Military_Male_02', 'soldier_a': 'Professions/Military_Male_05', 'soldier_b': 'Professions/Military_Male_06',
              'commander': 'Professions/Pilot_Male_01', 'soldier_f': 'Professions/Military_Female_01'}
RB_ANIMS = {'idle': 'static/m_idle_neutral_01', 'idle2': 'static/m_idle_breathe_01', 'look': 'static/m_idle_look_around_01', 'walk': 'xy/m_walk_neutral_01',
            'jog': 'xy/m_run_neutral_01', 'run': 'xy/m_run_fast_01', 'talk': 'static/m_gestic_talk_neutral_01', 'talk2': 'static/m_gestic_talk_neutral_02',
            'present': 'static/m_gestic_presentation_right_01', 'listen': 'static/m_gestic_listen_neutral_01', 'nod': 'static/m_gestic_listen_accept_01',
            'sit': 'static/m_sit_table_idle_neutral_01', 'work': 'static/m_work_table', 'docs': 'static/m_documents_idle'}
FBX2GLTF = os.path.join(ROOT, 'game3d', 'node_modules', 'fbx2gltf', 'bin', 'Linux', 'FBX2glTF')


def rb_git(*a):
    return subprocess.run(['git', '-C', os.path.join(CACHE, 'rocketbox'), *a], capture_output=True)


def rb_file(path, dst):
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        return True
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    r = rb_git('show', 'HEAD:' + path)
    if r.returncode:
        print('missing in rocketbox:', path, file=sys.stderr); return False
    open(dst, 'wb').write(r.stdout); return True


def character():
    """Avatars and clips are converted FBX -> GLB (FBX2glTF), textures TGA -> PNG -> WebP. MIT licensed, so the results are committed."""
    from PIL import Image
    d = os.path.join(OUT, 'chars')
    want = [os.path.join(d, k + '.glb') for k in RB_AVATARS] + [os.path.join(d, 'anim_' + k + '.glb') for k in RB_ANIMS]
    if all(os.path.exists(p) for p in want):
        return
    repo = os.path.join(CACHE, 'rocketbox')
    if not os.path.exists(repo):
        subprocess.run(['git', 'clone', '-q', '--depth', '1', '--filter=blob:none', '--no-checkout', RB_REPO, repo], check=True)
    listing = rb_git('ls-tree', '-r', 'HEAD', '--name-only').stdout.decode().split('\n')
    for key, rel in RB_AVATARS.items():
        dst = os.path.join(d, key + '.glb')
        if os.path.exists(dst):
            continue
        name = rel.split('/')[-1]; work = os.path.join(CACHE, 'rb', name); tex = os.path.join(work, 'png')
        os.makedirs(tex, exist_ok=True)
        rb_file(f'Assets/Avatars/{rel}/Export/{name}.fbx', os.path.join(work, name + '.fbx'))
        for p in listing:
            if p.startswith(f'Assets/Avatars/{rel}/Textures/') and ('_color' in p or '_normal' in p) and p.endswith('.tga'):
                tga = os.path.join(work, os.path.basename(p)); png = os.path.join(tex, os.path.basename(p)[:-4] + '.png')
                if not os.path.exists(png) and rb_file(p, tga):
                    im = Image.open(tga).convert('RGB')
                    if '_normal' in p:      # 3ds Max normal maps are DirectX style; glTF wants OpenGL (green up)
                        r_, g_, b_ = im.split(); im = Image.merge('RGB', (r_, g_.point(lambda v: 255 - v), b_))
                    im.save(png)
        raw = os.path.join(work, 'raw.glb'); tx = os.path.join(work, 'tex.glb')
        run(FBX2GLTF, '--binary', '--input', os.path.join(work, name + '.fbx'), '--output', raw)
        run('node', os.path.join(ROOT, 'game3d', 'scripts', 'rb_textures.mjs'), raw, tx, tex)
        run(GT, 'optimize', tx, dst, '--compress', 'false', '--texture-compress', 'webp', '--texture-size', '2048', '--simplify', 'false', '--join', 'false', '--flatten', 'false', '--prune', 'false', '--weld', 'false', '--instance', 'false', '--palette', 'false', '--resample', 'false')
    for key, rel in RB_ANIMS.items():
        dst = os.path.join(d, 'anim_' + key + '.glb')
        if os.path.exists(dst):
            continue
        folder, clip = rel.split('/'); src = os.path.join(CACHE, 'rb', 'anims', clip + '.fbx')
        if rb_file(f'Assets/Animations/all_animations_max_motextr_{folder}/{clip}.max.fbx', src):
            tmp = src[:-4] + '.glb'
            run(FBX2GLTF, '--binary', '--input', src, '--output', tmp)
            run(GT, 'resample', tmp, dst) or shutil.copy(tmp, dst)


def tiers():
    """Lower-resolution copies for weaker GPUs and phones (GPU memory, not download size, is what crashes them):
    models_lo/ (512 px textures), chars at 1024 + chars_lo/ (512), tex/1k/ and tex/512/."""
    for src_dir, lo_dir, size in (('models', 'models_lo', 512), ('chars', 'chars_lo', 512)):
        os.makedirs(os.path.join(OUT, lo_dir), exist_ok=True)
        for f in sorted(os.listdir(os.path.join(OUT, src_dir))):
            src, dst = os.path.join(OUT, src_dir, f), os.path.join(OUT, lo_dir, f)
            if f.endswith('.glb') and not f.startswith('anim_') and not os.path.exists(dst):
                run(GT, 'resize', src, dst, '--width', str(size), '--height', str(size))
    for f in sorted(os.listdir(os.path.join(OUT, 'chars'))):        # characters: 1024 is plenty at third-person distance
        p = os.path.join(OUT, 'chars', f)
        if f.endswith('.glb') and not f.startswith('anim_') and os.path.getsize(p) > 1_500_000:
            run(GT, 'resize', p, p + '.tmp.glb', '--width', '1024', '--height', '1024') and os.replace(p + '.tmp.glb', p)
    for sub, size in (('1k', 1024), ('512', 512)):
        d = os.path.join(OUT, 'tex', sub); os.makedirs(d, exist_ok=True)
        for f in sorted(os.listdir(os.path.join(OUT, 'tex'))):
            src, dst = os.path.join(OUT, 'tex', f), os.path.join(d, f)
            if f.endswith('.webp') and not os.path.exists(dst):
                q = 88 if '_nor' in f else 80
                run('node', '-e', "import('sharp').then(m=>m.default(process.argv[1]).resize(%d).webp({quality:%d}).toFile(process.argv[2]))" % (min(size, 1024 if '_arm' in f else size), q), src, dst)


if __name__ == '__main__':
    for sub in ('models', 'tex', 'env', 'chars'):
        os.makedirs(os.path.join(OUT, sub), exist_ok=True)
    os.chdir(os.path.join(ROOT, 'game3d'))
    got = {'models': [m for m in MODELS if model(m)], 'textures': [t for t in TEXTURES if texture(t)], 'hdris': [h for h in HDRIS if hdri(h)]}
    character()
    tiers()
    json.dump(got, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
    print({k: len(v) for k, v in got.items()})
