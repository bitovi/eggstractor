# GitLab Integration Quick Start Guide

## For gitlab.com Users

### 1. Create a Personal Access Token

1. Go to https://gitlab.com/-/profile/personal_access_tokens
2. Click "Add new token"
3. Set a name (e.g., "Eggstractor Figma Plugin")
4. Select scopes: **`api`** (or `read_api` + `write_repository`)
5. Set expiration date (optional but recommended)
6. Click "Create personal access token"
7. **Copy the token immediately** (you won't see it again!)

### 2. Configure the Plugin

1. Open Eggstractor plugin in Figma
2. Go to the "Setup" tab
3. Select **GitLab** as the Git provider
4. Enter your project path (e.g., `username/my-project`)
5. Leave "GitLab instance URL" **empty** (defaults to gitlab.com)
6. Paste your GitLab token
7. Enter the file path (e.g., `src/styles/_variables.scss`)
8. Choose your stylesheet format (SCSS, Tailwind, etc.)
9. Click "Save changes"

### 3. Export Styles

1. Go to the "Export" tab
2. Click "Generate styles"
3. Wait for generation to complete
4. Enter a branch name (e.g., `figma-variables-update`)
5. Click "Create Merge Request"
6. Click "Open in GitLab" to view your MR

---

## For Self-Hosted GitLab Users

### 1. Create a Personal Access Token

1. Go to your GitLab instance: `https://gitlab.yourcompany.com/-/profile/personal_access_tokens`
2. Follow the same steps as gitlab.com users above

### 2. Configure the Plugin

1. Open Eggstractor plugin in Figma
2. Go to the "Setup" tab
3. Select **GitLab** as the Git provider
4. Enter your project path (e.g., `my-team/design-system`)
5. Enter your **GitLab instance URL**: `gitlab.yourcompany.com`
   - ⚠️ Do NOT include `https://` - just the domain
   - ✅ Correct: `gitlab.yourcompany.com`
   - ❌ Wrong: `https://gitlab.yourcompany.com`
6. Paste your GitLab token
7. Configure remaining fields (file path, format, etc.)
8. Click "Save changes"

### 3. Export Styles

Same as gitlab.com users - the plugin will automatically use your self-hosted instance!

---

## Troubleshooting

### "Project not found" Error

- **Check project path**: Must be `owner/project-name` format
- **Check token permissions**: Token needs `api` scope
- **Check project visibility**: Token must have access to the project
- **Self-hosted**: Verify instance URL is correct (no `https://`)

### "Failed to create branch" Error

- **Check permissions**: Token needs write access to repository
- **Check default branch**: Verify project has a default branch set
- **Branch exists**: If branch already exists, the plugin will use it

### "Failed to update file" Error

- **Check file path**: Path is relative to repository root
- **Check encoding**: Special characters in path may cause issues
- **Check permissions**: Token needs write access

### "Failed to create merge request" Error

- **Check existing MRs**: Plugin will reuse if MR already exists for that branch
- **Check project settings**: MRs must be enabled for the project
- **Check permissions**: Token needs write access

### Instance URL Not Working (Self-hosted)

- Remove `https://` or `http://` from the URL
- Verify your GitLab instance is accessible from the internet (or your network)
- Check if your instance requires additional authentication (SSO, VPN, etc.)

---

## FAQ

### Q: What's the difference between GitHub and GitLab in this plugin?

A: Functionally the same! The plugin handles the API differences automatically. GitLab users get "Merge Requests" instead of "Pull Requests".

### Q: Can I switch between GitHub and GitLab?

A: Yes! Just change the provider in Setup. Each Figma file stores its own config.

### Q: Do I need different tokens for different projects?

A: No, one token can access all your projects (if it has the right permissions).

### Q: What permissions does the token need?

A: Minimum: `read_api` + `write_repository`. Recommended: `api` (full access).

### Q: Can I use GitLab groups?

A: Yes! Use the format `group/subgroup/project-name` in the project path.

### Q: Does it work with GitLab CI/CD?

A: The plugin creates MRs, which can trigger your CI/CD pipelines automatically!

### Q: Can I use this with GitHub Enterprise or GitLab.com?

A: GitHub Enterprise: Not yet (coming soon!). GitLab.com: Yes, works perfectly!

---

## Token Security Tips

🔒 **Keep your token safe!**

- Never share your token publicly
- Don't commit tokens to repositories
- Set expiration dates on tokens
- Use minimal required scopes
- Revoke tokens you're not using
- Create separate tokens for different tools

🔐 **Token Storage**
The plugin stores tokens securely in Figma's client storage, scoped per-file. Tokens are never sent anywhere except to GitHub/GitLab APIs.
