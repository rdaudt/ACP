# Deploying to GitHub Pages

This guide will help you deploy the Advanced Care Planning app to GitHub Pages.

## Prerequisites

- Your code must be pushed to a GitHub repository
- You need push access to the repository
- Node.js and npm installed locally

## Deployment Steps

### 1. Install Dependencies

First, make sure all dependencies are installed, including the `gh-pages` package:

```bash
npm install
```

### 2. Build and Deploy

From the root directory, run:

```bash
npm run deploy
```

This command will:
- Build the React app for production
- Create an optimized bundle in `client/build/`
- Push the build to the `gh-pages` branch on GitHub
- GitHub will automatically serve it

### 3. Enable GitHub Pages

After your first deployment:

1. Go to your GitHub repository: https://github.com/rdaudt/ACP
2. Click on **Settings**
3. Scroll down to **Pages** (in the left sidebar)
4. Under **Source**, ensure it's set to:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
5. Click **Save**

### 4. Access Your App

Once deployed, your app will be available at:

**https://rdaudt.github.io/ACP/**

Note: It may take a few minutes for the site to become available after the first deployment.

## Updating Your Deployment

Whenever you make changes and want to update the live site:

```bash
npm run deploy
```

That's it! The changes will be live in a few minutes.

## Troubleshooting

### "Permission denied" error
- Make sure you have push access to the repository
- Check that you're logged into GitHub in your terminal
- Try running: `git config --global user.name "Your Name"` and `git config --global user.email "your@email.com"`

### Changes not showing up
- Wait 2-5 minutes for GitHub Pages to update
- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check the gh-pages branch exists: `git branch -r | grep gh-pages`

### 404 error
- Verify the homepage URL in `client/package.json` matches your repository
- Make sure GitHub Pages is enabled in repository settings
- Check that the gh-pages branch exists

### Blank page
- Check browser console for errors
- Verify the homepage field is correct in package.json
- Try a hard refresh (Ctrl+Shift+R)

## Repository Settings

The app is configured for:
- **Repository**: rdaudt/ACP
- **GitHub Pages URL**: https://rdaudt.github.io/ACP/
- **Deploy Branch**: gh-pages

If you fork this repository or change the repo name, update the `homepage` field in `client/package.json`:

```json
"homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME"
```

## Local Testing Before Deploy

To test the production build locally before deploying:

```bash
npm run build
cd client/build
python3 -m http.server 8000
# or
npx serve -s .
```

Then visit http://localhost:8000

## Cost Considerations

Remember: The app runs entirely in the browser, so hosting on GitHub Pages is **FREE**. However:

- Users will need their own OpenAI API key
- OpenAI API usage costs ~$0.04 per complete session
- No server costs, no hosting fees

## Security Notes

- GitHub Pages serves static files only (perfect for this app)
- API keys are stored in user's browser localStorage
- No backend means no server-side secrets to manage
- All API calls go directly from user's browser to OpenAI
