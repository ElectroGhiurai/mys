# CI/CD Pipeline Documentation

## Overview
This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline established for the frontend application using GitHub Actions. 

## Pipeline Stages
The pipeline is defined in `.github/workflows/frontend-cicd.yml` and triggers automatically on `push` and `pull_request` events to the `main` and `master` branches. It consists of the following sequential and parallel stages:

1. **Lint**: Runs ESLint (`npm run lint`) to enforce coding standards, discover syntax errors, and find problematic patterns in the codebase.
2. **Test**: Executes unit tests via Vitest (`npm run test`) in a jsdom environment to verify application logic.
3. **Typecheck**: Validates TypeScript types (`npm run typecheck`) to ensure type safety without emitting compiled files.
4. **Build**: Compiles the application for production (`npm run build`) using Vite. This stage requires the `lint`, `test`, and `typecheck` jobs to pass successfully. It generates a distribution artifact.
5. **Deploy**: Deploys the generated production artifact to **GitHub Pages**. This stage runs only on pushes to the default branch (main/master) and skips deployment for pull requests.

## Tools Chosen
- **GitHub Actions**: Selected as the CI/CD platform because it is integrated directly into the repository, free for public repositories, and provides an extensive marketplace of pre-built actions.
- **Node.js**: The runtime environment used for our pipeline jobs. We standardized on Node 20.
- **Vite**: The build tool of choice because of its exceptionally fast build times and native ES modules support.
- **ESLint**: Industry standard for linting JavaScript and React codebases.
- **Vitest**: A blazing fast unit testing framework built for Vite. It seamlessly integrates with Vite's configuration and offers a Jest-compatible API.
- **TypeScript**: Adds static typing to JavaScript, catching type errors early during the `typecheck` CI stage.
- **GitHub Pages**: Chosen for deployment because it offers a zero-configuration, free hosting solution directly tied to GitHub Actions via the `actions/deploy-pages@v4` action.

## Lessons Learned & Best Practices
- **Parallel vs Sequential Execution**: Jobs like lint, test, and typecheck can run in parallel to reduce overall CI time. However, the `build` and `deploy` jobs must be sequential (`needs: build`) to ensure we only deploy what successfully compiles.
- **Caching Dependencies**: Utilizing `actions/setup-node@v4` with `cache: 'npm'` significantly speeds up the pipeline by caching the `node_modules` between workflow runs.
- **Environment Targeting**: Deployments require configuring the appropriate GitHub Actions `permissions` (like `pages: write` and `id-token: write`) and using GitHub Environments to securely manage deployments.
- **Relative Asset Paths**: When deploying a single-page app (SPA) built with Vite to GitHub Pages, the base URL often needs to be adjusted. Adding `base: './'` to `vite.config.ts` ensures assets are loaded correctly regardless of whether the app is hosted at the root or a subpath.
