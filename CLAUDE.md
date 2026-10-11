# Engine Eye (autodoc)

Expo/React Native app in `frontend/`, FastAPI backend in `backend/`. Read `PROGRESS.md` first for current status and open PRs.

## Commands
- Backend tests: `.venv\Scripts\python -m pytest` (create the venv with `python -m venv .venv` then `.venv\Scripts\python -m pip install -r requirements-dev.txt`)
- Backend run: `python -m uvicorn backend.main:app --port 8080` (needs `.env` with real keys; never commit it)
- Frontend tests: `cd frontend && npm test`
- Frontend check: `cd frontend && npx expo-doctor` and `npx expo export --platform ios`
- Frontend run: `cd frontend && npx expo start --tunnel`

## Rules
- Expo SDK 57: read https://docs.expo.dev/versions/v57.0.0/ before changing config; `app.json` rejects removed fields (`npx expo-doctor` catches them).
- `main` auto-deploys the backend to Railway. Work on branches and open PRs.
- Never commit `.env` or secret keys. The Supabase service-role key and the RevenueCat secret/webhook values live only in Railway.
- `ENFORCE_USAGE_LIMITS` stays off until the new app version (token + `kind` aware) is released.
- Keep `frontend/plans.js` and `backend/plans.py` limits in sync.
