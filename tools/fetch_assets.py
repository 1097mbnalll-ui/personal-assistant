#!/usr/bin/env python3
"""Download the 3D assets used by game3d/ and convert them to compact web formats.

Sources (all free to redistribute):
  * Poly Haven (https://polyhaven.com) — models, PBR textures, HDRIs. License: CC0.
  * Ready Player Me — human avatar (from the three.js examples) and motion-capture clips (animation-library).
    Free to use in a game, not to redistribute as files, so they are downloaded here and never committed.

Raw downloads are cached in tools/.asset_cache (git-ignored). Outputs go to game3d/public/assets and ARE committed,
so the game builds without network access. Run:  python3 tools/fetch_assets.py   (needs game3d/node_modules).
"""
import json, os, subprocess, sys, urllib.request

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


RPM_ANIMS = {'idle': 'idle/M_Standing_Idle_001', 'idle2': 'idle/M_Standing_Idle_Variations_001', 'walk': 'locomotion/M_Walk_001', 'jog': 'locomotion/M_Jog_001',
             'run': 'locomotion/M_Run_001', 'jump': 'locomotion/M_Jog_Jump_001', 'fall': 'locomotion/M_Falling_Idle_002',
             'talk': 'expression/M_Talking_Variations_001', 'talk2': 'expression/M_Talking_Variations_002'}


def character():
    """Human avatar + motion-capture clips. NOT committed (see .gitignore): the Ready Player Me animation licence allows
    use inside a game but not redistribution of the files, so every checkout fetches them with this script."""
    d = os.path.join(OUT, 'chars')
    get('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/readyplayer.me.glb', os.path.join(d, 'human.glb'))
    for name, path in RPM_ANIMS.items():
        get(f'https://raw.githubusercontent.com/readyplayerme/animation-library/master/masculine/glb/{path}.glb', os.path.join(d, f'anim_{name}.glb'))


if __name__ == '__main__':
    for sub in ('models', 'tex', 'env', 'chars'):
        os.makedirs(os.path.join(OUT, sub), exist_ok=True)
    os.chdir(os.path.join(ROOT, 'game3d'))
    got = {'models': [m for m in MODELS if model(m)], 'textures': [t for t in TEXTURES if texture(t)], 'hdris': [h for h in HDRIS if hdri(h)]}
    character()
    json.dump(got, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
    print({k: len(v) for k, v in got.items()})
