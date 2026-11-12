# Snap Store Listing Guide for Daily Bread

This guide explains how to test locally, register, and publish **Daily Bread** (`daily-bread-bible`) on the Ubuntu Snap Store ([snapcraft.io](https://snapcraft.io)).

---

## 1. Build & Test Locally

Run the packaging script from `desktop/`:

```bash
./scripts/package-snap.sh
```

Install the generated `.snap` locally to test strict confinement:

```bash
sudo snap install --dangerous daily-bread-bible_1.0.0_amd64.snap
snap run daily-bread-bible
```

---

## 2. Register & Publish to Snap Store

1. Log in to Snapcraft:
   ```bash
   snapcraft login
   ```
2. Register the snap name (one-time):
   ```bash
   snapcraft register daily-bread-bible
   ```
3. Upload and release to `stable`:
   ```bash
   snapcraft upload --release=stable daily-bread-bible_1.0.0_amd64.snap
   ```

---

## 3. Store Listing Copy

- **Title**: `Daily Bread — Offline Bible & Study`
- **Summary**: `Offline Bible & Study Notes — 60 translations, cross-refs & parallel view`
- **Categories**: `Education`, `Books and Reference`
- **Icon**: [snap/gui/daily-bread.png](../snap/gui/daily-bread.png) (512×512 PNG, synced automatically on upload)
