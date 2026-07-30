Secrets & production credential handling

Overview

This project previously contained placeholder secrets in backend/appsettings.json and some leaked keys were discovered in local history. Production must not store secrets in repository files.

What changed in code

- Added optional Azure Key Vault integration: set AZURE_KEYVAULT_URI environment variable in the host where the app runs and the app will load secrets from Key Vault at startup (uses DefaultAzureCredential). The necessary NuGet packages were added to backend/DocTick.Api.csproj.

Immediate manual actions (do these now)

1) Rotate leaked keys
   - Resend API keys (re_...): revoke existing keys in resend.com and create a new key.
   - Google OAuth client secret: rotate client secret in Google Cloud Console and update the OAuth client (or create a new client id/secret pair).

2) Remove keys from local env and history
   - Remove any keys set as local user environment variables if you copied them.
   - If secrets were committed, perform a git filter-repo or BFG cleanup to remove them from history and then force-push to origin (coordinate with collaborators).

3) Move secrets to secure store
   - Azure: put secrets (Resend:ApiKey, Google:ClientSecret, Admin:Email if sensitive) into Azure Key Vault. Set AZURE_KEYVAULT_URI on the App Service as an App Setting.
   - Alternatively: set GitHub Actions / GitHub Secrets and use them in CI to populate App Settings on deploy.

How to provide secrets to the app

- Environment variables (dotnet picks these up via configuration):
  - Resend__ApiKey
  - Resend__FromEmail
  - Resend__FromName
  - Resend__RedirectTo
  - Google__ClientId
  - Admin__Email
  - ConnectionStrings__Default

- Azure Key Vault: store secrets in Key Vault (names matching configuration path) and set AZURE_KEYVAULT_URI to the vault URI on the host.

CI / GitHub Actions (example guidance)

- Add required secrets in repository Settings → Secrets → Actions: RESEND_API_KEY, GOOGLE_CLIENT_SECRET, AZURE_CREDENTIALS (for az cli/service principal), KEYVAULT_URI.
- Use the secrets in the deployment workflow to set App Service App Settings or to populate Key Vault.

Notes / rationale

- The app already treats missing Resend API key as non-fatal (email sending is skipped with a warning). That avoids accidental runtime crashes during local development.
- Do not commit any rotated keys; use env/App Settings/Key Vault.

If you want, I can:
- Add a GitHub Actions workflow snippet to deploy and set App Settings from repo secrets.
- Run a local scan for strings that look like API keys (I can search memory/sessions too).
