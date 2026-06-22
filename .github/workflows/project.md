For now this project only has a CI/CD pipeline for the frontend, I wanted to add to the backend aswell but in the future. I hope it's not an issue I setup this CI/CD pipeline for this project instead of doing it for a sample app, but I thought it might be useful for me and my friends to have this in the future when working on this little project (but only I worked on this part :D)

--------------------------------------------------
for now the stages are only for frontend directory

1. lint - eslint - ran on every pull request (and every push to that PR) and push in the main branch

2. test - npm test - ran on every pull request (and every push to that PR) and push in the main branch

3. typecheck - npm run typecheck - ran on every pull request (and every push to that PR) and push in the main branch

4. build - npm run build - ran on every pull request (and every push to that PR) and push in the main branch

5. deploy - actions/deploy-pages - ran on every push to main branch only

------------
Tools chosen

1. ESLint — catches code style and logic issues early
2. TypeScript — type safety before anything ships
3. npm ci — clean, reproducible installs (not npm install)
4. GitHub Pages + upload-pages-artifact — zero-cost hosting, native GitHub integration
// 5. VITE_USE_MOCK: true — builds work without a real backend - since there's no real backend hosted anywhere yet  ->> removed this in the meanwhile, while trying to setup backend CI/CD pipeline

--------
Lessons learned

1. Path filtering - CI only runs when files in /frontend directory are changed
2. Gates - build only starts if the first 3 checks pass
3. Deploy conditional - deploy only runs on push to main branch
4. Learnt a bit of how to setup a CI/CD pipeline on GitHub, how to manually trigger via the UI (other than Azure DevOps during the laboratory)
