// Attach Rocketbox textures to a converted avatar. FBX2glTF cannot resolve the Windows texture paths stored in the
// FBX files, so materials are matched to texture files by part name (body / head / equipment / helmet ...).
// usage: node game3d/scripts/rb_textures.mjs in.glb out.glb <dir with *_color*.png and *_normal.png>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'fs'; import path from 'path';
const [, , src, dst, dir] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(src); const root = doc.getRoot();
root.listTextures().forEach(t => t.dispose());
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
for (const m of root.listMaterials()) {
  const part = m.getName().replace(/^[a-z]+\d+_/i, '').toLowerCase();          // sm024_body -> body
  const pick = kind => files.find(f => f.toLowerCase().includes('_' + part + '_' + kind)) ;
  const color = pick('color'), normal = pick('normal');
  if (color) m.setBaseColorTexture(doc.createTexture(part + '_color').setImage(fs.readFileSync(path.join(dir, color))).setMimeType('image/png'));
  if (normal) m.setNormalTexture(doc.createTexture(part + '_normal').setImage(fs.readFileSync(path.join(dir, normal))).setMimeType('image/png'));
  m.setBaseColorFactor([1, 1, 1, 1]).setMetallicFactor(0).setRoughnessFactor(part === 'head' ? .62 : .85).setEmissiveFactor([0, 0, 0]).setAlphaMode(/opacity|hair|lash/.test(part) ? 'MASK' : 'OPAQUE').setDoubleSided(false);
  console.log(' material', m.getName(), '->', color || 'NO COLOR', normal || '');
}
root.listAnimations().forEach(a => a.dispose());
await io.write(dst, doc);
