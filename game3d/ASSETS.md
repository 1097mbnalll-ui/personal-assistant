# Third-party assets

| What | Source | License | In git? |
|---|---|---|---|
| Props, furniture, PBR textures, HDRIs (`public/assets/models`, `tex`, `env`) | [Poly Haven](https://polyhaven.com) | CC0 | yes (converted to GLB/WebP) |
| Human characters and animation clips (`public/assets/chars`) | [Microsoft Rocketbox Avatar Library](https://github.com/microsoft/Microsoft-Rocketbox) | MIT (Copyright Microsoft) | yes (converted from FBX) |

The exact asset ids are listed in `tools/fetch_assets.py`; `public/assets/manifest.json` records what was downloaded.
Characters: `officer` = Military_Male_02 (player), `soldier_a/b` = Military_Male_05/06, `soldier_f` = Military_Female_01,
`commander` = Pilot_Male_01. All share the Rocketbox "Bip01" skeleton, so any clip from its animation folder can be added
to `RB_ANIMS` in the script and used by name.
