# Third-party assets

| What | Source | License | In git? |
|---|---|---|---|
| Props, furniture, PBR textures, HDRIs (`public/assets/models`, `tex`, `env`) | [Poly Haven](https://polyhaven.com) | CC0 | yes (converted to GLB/WebP) |
| Human avatar `chars/human.glb` | Ready Player Me avatar from the three.js examples | Ready Player Me avatar terms | no — fetched by `tools/fetch_assets.py` |
| Motion capture `chars/anim_*.glb` | [readyplayerme/animation-library](https://github.com/readyplayerme/animation-library) | RPM Animation Library License: free for personal and commercial use **with RPM avatars**, no redistribution of the files | no — fetched by the script |

The full list of asset ids is in `tools/fetch_assets.py`; `public/assets/manifest.json` records what was downloaded.
Replacing the character: put any glTF humanoid with the same joint names in `public/assets/chars/human.glb`.
