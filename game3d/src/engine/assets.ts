// Asset loading and placement. All files live in public/assets (see tools/fetch_assets.py and ASSETS.md).
import {
  AbstractMesh, AssetContainer, Color3, LoadAssetContainerAsync, Mesh, MeshBuilder, PBRMaterial, Scene,
  ShadowGenerator, Texture, TransformNode, Vector3, VertexBuffer,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

const BASE = import.meta.env.BASE_URL + 'assets/';

export interface PropOptions { rotY?: number; scale?: number; collide?: boolean; shadow?: boolean; y?: number }
export interface Placed { node: TransformNode; size: Vector3; meshes: AbstractMesh[] }

export class Assets {
  private containers = new Map<string, AssetContainer>();
  private mats = new Map<string, PBRMaterial>();
  shadow: ShadowGenerator | null = null;
  constructor(readonly scene: Scene) {}

  async preload(models: string[], chars: string[], onProgress: (done: number, total: number) => void) {
    const jobs = [...models.map(m => ['models/' + m, m] as const), ...chars.map(c => ['chars/' + c, c] as const)];
    let done = 0;
    await Promise.all(jobs.map(async ([path, key]) => {
      try {
        const c = await LoadAssetContainerAsync(BASE + path + '.glb', this.scene);
        c.materials.forEach(m => { if (m instanceof PBRMaterial) { m.maxSimultaneousLights = 8; } });
        c.meshes.forEach(m => { m.receiveShadows = true; });
        this.containers.set(key, c);
      } catch (e) { console.warn('asset failed', key, e); }
      onProgress(++done, jobs.length);
    }));
  }
  has(name: string) { return this.containers.has(name); }
  container(name: string) { return this.containers.get(name)!; }

  /** Instantiate a static prop. x/z are the centre on the floor, rotY in degrees. */
  prop(name: string, x: number, z: number, o: PropOptions = {}): Placed | null {
    const c = this.containers.get(name);
    if (!c) return null;
    const inst = c.instantiateModelsToScene(n => name + ':' + n, false, { doNotInstantiate: false });
    const node = new TransformNode('prop:' + name, this.scene);
    inst.rootNodes.forEach(r => { r.parent = node; });
    const { min, max } = node.getHierarchyBoundingVectors(true);
    const size = max.subtract(min);
    const meshes = node.getChildMeshes(false);
    if (o.collide !== false) {
      const col = MeshBuilder.CreateBox('col:' + name, { width: Math.max(size.x, .05), height: Math.max(size.y, .05), depth: Math.max(size.z, .05) }, this.scene);
      col.position = min.add(max).scale(.5); col.parent = node; col.isVisible = false; col.checkCollisions = true; col.isPickable = true;
      col.metadata = { cameraBlock: size.y > 1.2 };
    }
    const s = o.scale ?? 1;
    node.scaling.setAll(s); node.position.set(x, o.y ?? 0, z); node.rotation.y = (o.rotY ?? 0) * Math.PI / 180;
    if (o.shadow !== false && this.shadow) meshes.forEach(m => this.shadow!.addShadowCaster(m, false));
    node.computeWorldMatrix(true);
    meshes.forEach(m => { m.computeWorldMatrix(true); m.freezeWorldMatrix(); m.isPickable = false; m.alwaysSelectAsActiveMesh = false; });
    return { node, size: size.scale(s), meshes };
  }

  /** Tiling PBR material from a Poly Haven texture set (diffuse + DirectX normal + AO/rough/metal). */
  mat(tex: string, tint?: Color3, opts: { rough?: number; metal?: number; bump?: number } = {}): PBRMaterial {
    const key = tex + (tint ? tint.toHexString() : '') + JSON.stringify(opts);
    let m = this.mats.get(key);
    if (m) return m;
    m = new PBRMaterial('m:' + key, this.scene);
    const t = (k: string) => { const x = new Texture(`${BASE}tex/${tex}_${k}.webp`, this.scene, false, true); x.anisotropicFilteringLevel = 8; return x; };
    m.albedoTexture = t('diff'); m.bumpTexture = t('nor'); m.bumpTexture.level = opts.bump ?? 1; m.metallicTexture = t('arm');
    m.useAmbientOcclusionFromMetallicTextureRed = true; m.useRoughnessFromMetallicTextureGreen = true; m.useMetallnessFromMetallicTextureBlue = true;
    m.metallic = opts.metal ?? 1; m.roughness = opts.rough ?? 1;
    if (tint) m.albedoColor = tint;
    m.maxSimultaneousLights = 8; m.backFaceCulling = true;
    this.mats.set(key, m);
    return m;
  }
  flat(name: string, color: Color3, rough = .6, metal = 0, emissive?: Color3): PBRMaterial {
    let m = this.mats.get('flat:' + name);
    if (m) return m;
    m = new PBRMaterial('flat:' + name, this.scene);
    m.albedoColor = color; m.roughness = rough; m.metallic = metal; m.maxSimultaneousLights = 8;
    if (emissive) { m.emissiveColor = emissive; }
    this.mats.set('flat:' + name, m);
    return m;
  }
}

/** Box whose UVs follow world size (tile metres per texture repeat), so one material tiles consistently everywhere. */
export function tiledBox(scene: Scene, name: string, w: number, h: number, d: number, tile: number): Mesh {
  const box = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
  const pos = box.getVerticesData(VertexBuffer.PositionKind)!, nor = box.getVerticesData(VertexBuffer.NormalKind)!, uv = box.getVerticesData(VertexBuffer.UVKind)!;
  for (let i = 0; i < pos.length / 3; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], nx = Math.abs(nor[i * 3]), ny = Math.abs(nor[i * 3 + 1]);
    let u: number, v: number;
    if (ny > .5) { u = x; v = z; } else if (nx > .5) { u = z; v = y; } else { u = x; v = y; }
    uv[i * 2] = u / tile; uv[i * 2 + 1] = v / tile;
  }
  box.setVerticesData(VertexBuffer.UVKind, uv);
  return box;
}
