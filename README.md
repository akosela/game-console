# game-console

Classic PC Game Console and Display Reference

GameConsole.cc is a technical reference for classic PC games and their
original engines.

The project collects practical command references for game consoles and
developer modes, together with notes on removing the HUD/crosshair,
disabling texture filtering for a sharp, pixelated look, and configuring
widescreen resolutions and field of view.

The focus is on the original games and their original engines whenever
possible. Remaster-only commands and settings are intentionally avoided.

## Console references

Each file documents console access, useful commands, cheats, debugging
facilities, engine-specific behavior, and important version/build caveats.

- [Duke Nukem 3D / EDuke32](duke-nukem-3d-eduke32-console.txt)
- [Quake / Mark V](quake-console.txt)
- [Quake II / Yamagi Quake II](quake-2-console.txt)
- [Unreal](unreal-console.txt)
- [Unreal Tournament 1999](unreal-tournament-1999-console.txt)
- [Half-Life](half-life-console.txt)
- [Deus Ex](deus-ex-console.txt)
- [Gothic](gothic-1-console.txt)
- [Gothic II](gothic-2-console.txt)
- [Gothic 3](gothic-3-console.txt)
- [Morrowind](morrowind-console.txt)
- [Oblivion](oblivion-console.txt)
- [Skyrim 2011](skyrim-2011-console.txt)
- [Vietcong 2003](vietcong-2003-console.txt)
- [Red Faction 2001](red-faction-2001-console.txt)
- [Thief: The Dark Project](thief-console.txt)
- [System Shock 2](ss2-console.txt)

EDuke32 is used for Duke Nukem 3D and Yamagi Quake II is used for Quake II
because they provide the requested runtime environments. These are source-port
exceptions, not remaster references.

Console command availability can depend on the exact executable, patch level,
renderer, source port, editor, or developer build. Where a game provides its
own command-listing mechanism, the output from the executable being used
should be treated as the final authority.

## No HUD / crosshair

[nohud.txt](nohud.txt) documents ways to remove or hide the HUD and crosshair.

It covers:

- Duke Nukem 3D / EDuke32
- Quake / Mark V
- Quake II / Yamagi Quake II
- Unreal
- Unreal Tournament
- Half-Life
- Deus Ex
- Gothic
- Gothic II
- Gothic 3
- Morrowind
- Oblivion
- Skyrim
- Vietcong
- Red Faction
- Thief: The Dark Project
- System Shock 2

The file distinguishes between proper console/configuration switches and
games where complete HUD removal instead requires a resource replacement or
another original-engine workaround.

## No texture filtering

[notexturefiltering.txt](notexturefiltering.txt) documents how to disable
texture smoothing and obtain sharp, visibly pixelated textures.

It covers:

- Duke Nukem 3D / EDuke32
- Quake / Mark V
- Quake II / Yamagi Quake II
- Unreal
- Unreal Tournament
- Half-Life
- Deus Ex
- Gothic
- Gothic II
- Gothic 3
- Morrowind
- Oblivion
- Skyrim
- Vietcong
- Red Faction
- MechWarrior 3
- Thief: The Dark Project / NewDark
- System Shock 2 / NewDark

The guide distinguishes nearest-neighbor or point sampling from merely
disabling anisotropic filtering. Disabling anisotropic filtering alone does
not make textures unfiltered if bilinear filtering remains active.

For Quake, the guide uses the normal Windows Mark V DirectX 9 build.
Mark V retains its GLQuake-style hardware-renderer cvars through MH's
Direct3D wrapper, so `gl_texturemode` works in the DX9 executable despite
the `gl_` prefix. The strict point-sampled setup is:

```text
gl_texturemode GL_NEAREST
gl_smoothmodels 0
```

`GL_NEAREST_MIPMAP_LINEAR` is also documented as an alternative that keeps
point-sampled texels while blending smoothly between mip levels.

For Unreal Engine 1 games, the preferred targeted method is:

```text
set texture bNoSmooth true | set actor bNoSmooth true
```

This disables smoothing on game textures and actor textures without using the
broader renderer-wide `NoFiltering=True` setting.

For Thief and System Shock 2, NewDark exposes the required filtering control
directly:

```text
tex_filter_mode 0
```

Where an original game does not expose a true point-sampling option, the
reference clearly labels alternative renderer or wrapper methods instead of
presenting them as native console commands.

## Widescreen / FOV

[widescreen.txt](widescreen.txt) documents 4:3 and 16:9 resolution setup and
field-of-view configuration for the same 17 games as the console reference.
The 16:9 examples cover 1920x1080, 2560x1440, and 3840x2160.

The reference uses this project baseline:

```text
4:3  (800x600)   fov: 90
16:9 (1920x1080) fov: 106.270273206
16:9 (2560x1440) fov: 106.270273206
16:9 (3840x2160) fov: 106.270273206
```

It covers:

- Duke Nukem 3D / EDuke32
- Quake / Mark V
- Quake II / Yamagi Quake II
- Unreal
- Unreal Tournament 1999
- Half-Life / WON retail version
- Deus Ex
- Gothic
- Gothic II
- Gothic 3
- Morrowind
- Oblivion
- Skyrim 2011
- Vietcong 2003
- Red Faction 2001
- Thief: The Dark Project / NewDark
- System Shock 2 / NewDark

For Quake, the widescreen guide uses the Mark V source port and its native
automatic Hor+ FOV adaptation.

The guide distinguishes direct horizontal FOV settings from engines that use
automatic Hor+ scaling, vertical FOV, or engine-specific units. Where an exact
numeric FOV cannot be entered, the limitation is documented instead of
inventing an unsupported command.

## Project principles

- Prefer original-game commands and behavior.
- Do not use remaster-only commands as references.
- Keep engine/source-port additions clearly identified.
- Distinguish native commands from configuration edits and external wrappers.
- Distinguish nearest-neighbor filtering from AF/trilinear settings.
- Document limitations instead of inventing unsupported commands.
- Preserve useful developer/debug commands for engine documentation.
- Keep TXT reference files hard-wrapped at 78 columns.

## Notes

These files are reference documentation, not executable mods. Some commands
can alter saves, quest state, inventory, player statistics, AI state, or other
game data. Save the game before experimenting with destructive or
developer-oriented commands.

Older games often have substantial differences between retail executables,
official patches, editors, source releases, community engine updates, and
modern operating-system compatibility layers. Check the notes in each file
before assuming that a command applies to every build.

## License

This repository is distributed under the [MIT License](LICENSE).
