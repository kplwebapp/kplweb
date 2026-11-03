# KPL mobile (Phase 1)

Separate Expo / React Native package for Kansara Premier League. It is **not** part of the npm workspaces (`frontend`, `backend`, `shared`), so the website build is unchanged.

Uses **Expo SDK 58** — requires **Expo Go SDK 58** on your phone (from [expo.dev/go](https://expo.dev/go)).

Phase 1 uses **clearly marked preview fixtures**. It does not call the production API or Neon.

## Preview on Windows (PowerShell)

```powershell
Set-Location E:\Projects\KPL\Application\kplweb\mobile
Copy-Item .env.example .env
npm start
```

Then:

- Install **Expo Go for SDK 58** from https://expo.dev/go (store builds may differ).
- Put the phone on the **same Wi‑Fi** as the PC and scan the QR code.
- Or press `w` for web preview in the browser (`http://localhost:8081`).
- Press `a` only if an Android emulator/device with USB debugging is available.

If Metro fails with `transformFile` undefined, stop every Expo process using port 8081, then:

```powershell
npm run start:clear
```

## Checks

```powershell
npm test
npm run typecheck
```

## Notes

- `EXPO_PUBLIC_API_BASE_URL` is reserved for Phase 2+ (public API only).
- Never put database URLs, JWT secrets, or passwords in mobile env files.
- Architecture audit: `docs/mobile/PHASE0_AUDIT.md`
- Design tokens: `docs/mobile/PHASE1_DESIGN.md`
