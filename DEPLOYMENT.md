# Deploying to GitHub Pages

This app is configured to deploy to GitHub Pages using the `/docs` folder approach.

## How It Works

The production build is placed in the `/docs` folder at the root of the repository, and GitHub Pages serves directly from this folder on your main branch.

## Deployment (Already Done!)

The app has been built and deployed. The production files are in the `/docs` folder.

## Enable GitHub Pages

To make your app live, follow these one-time setup steps:

### 1. Go to Repository Settings

1. Visit: https://github.com/rdaudt/ACP
2. Click on **Settings** (top menu bar)

### 2. Configure GitHub Pages

1. In the left sidebar, click **Pages**
2. Under **Source**, configure:
   - **Branch**: Select your main branch (likely `main` or `master` or `claude/advanced-care-planning-app-011CURJWdhTLsA6688GACFdE`)
   - **Folder**: Select `/docs`
3. Click **Save**

### 3. Wait for Deployment

- GitHub will take 1-3 minutes to build and deploy
- You'll see a green checkmark when it's ready
- A link will appear showing your live URL

### 4. Access Your App

Your app will be live at:

**https://rdaudt.github.io/ACP/**

## Making Updates

When you make changes to the app and want to deploy:

1. The code changes are made
2. Run the build (this has been done for you)
3. Commit and push the updated `/docs` folder
4. GitHub Pages automatically updates (takes 1-3 minutes)

## Files in /docs Folder

The `/docs` folder contains:
- `index.html` - Main HTML file
- `static/` - JavaScript, CSS, and other assets
- `myvoice-advancecareplanningguide.pdf` - The PDF template
- Other supporting files

These are optimized production files created by React's build process.

## Troubleshooting

### App not showing up
- Wait 2-5 minutes after enabling GitHub Pages
- Check that Branch and Folder are set correctly in Settings → Pages
- Verify the `/docs` folder exists in your repository

### 404 error
- Ensure the branch selected in Pages settings matches the branch containing `/docs`
- Check that the homepage in `client/package.json` matches your repo: `https://rdaudt.github.io/ACP`

### Blank page
- Check browser console for errors
- Verify the homepage field is correct
- Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Changes not appearing
- Clear browser cache
- Wait a few minutes for GitHub Pages to rebuild
- Check the Actions tab in GitHub for deployment status

## Why /docs Folder?

This approach is simpler than using gh-pages branch because:
- No need for additional deployment tools
- Works seamlessly with CI/CD environments
- Easy to see what's deployed (just check the `/docs` folder)
- GitHub Pages directly serves from your main branch
- No branch management required

## Configuration Details

- **Repository**: rdaudt/ACP
- **GitHub Pages URL**: https://rdaudt.github.io/ACP/
- **Deploy Location**: /docs folder on main branch
- **Homepage Setting**: Set in `client/package.json`

## Cost

- GitHub Pages hosting: **FREE**
- OpenAI API usage: ~$0.04 per user session
- No server costs

## Security

- All code runs in the user's browser
- API keys stored in user's browser localStorage only
- No backend server means no server-side vulnerabilities
- Static files only - very secure
