# Blockchain Certificate System

End-to-end blockchain certificate platform with:
- Smart contracts (Hardhat)
- Frontend (React)
- Production static build + local serving

## Prerequisites

- Node.js 22 (see `.nvmrc`)
- npm

Use:

```bash
nvm use
```

## Install

Install root and frontend dependencies:

```bash
npm install
npm --prefix frontend install
```

## Development

Start frontend dev server:

```bash
npm --prefix frontend start
```

## Test Commands

Run contract tests:

```bash
npm run test:contracts
```

Run frontend tests (CI mode, single run):

```bash
npm run test:frontend
```

Run all tests:

```bash
npm run test:all
```

## Build + Serve Production Frontend

Build:

```bash
npm run build:frontend
```

Serve on port 3000:

```bash
npm run serve:frontend
```

If port `3000` is busy, stop the process using it first, then rerun.

## Deployment Notes

- CRA build is in `frontend/build`
- The app is assumed to be hosted at `/` by default
- If deploying under a subpath, set `homepage` in `frontend/package.json`, rebuild, then redeploy

## Manual QA Checklist

- Connect wallet from dashboard
- Issue a certificate
- Verify a certificate
- View "My Certificates"
- Validate role-specific pages (`Manage`, `Batch`) with authorized wallet
