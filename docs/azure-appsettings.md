Azure App Service — App Settings & Key Vault quick commands

# Set App Settings (example)

# Login using Azure CLI (use a service principal in CI)
az login

# Set individual app setting (example)
az webapp config appsettings set --name <APP_NAME> --resource-group <RG_NAME> --settings Resend__ApiKey="<new_key>"

# Set multiple settings
az webapp config appsettings set --name <APP_NAME> --resource-group <RG_NAME> --settings \
  Resend__ApiKey="<new_key>" Resend__FromEmail="onboarding@doctick.example" Google__ClientId="<id>" Google__ClientSecret="<secret>"

# Recommended: use Azure Key Vault and set AZURE_KEYVAULT_URI as an App Setting
# Create Key Vault and add secrets
az keyvault create -n <vault-name> -g <RG_NAME> -l <location>
az keyvault secret set -n Resend--ApiKey --vault-name <vault-name> --value "<new_key>"
az keyvault secret set -n Google--ClientSecret --vault-name <vault-name> --value "<google_secret>"

# Set AZURE_KEYVAULT_URI on the Web App so application loads secrets from Key Vault
az webapp config appsettings set --name <APP_NAME> --resource-group <RG_NAME> --settings AZURE_KEYVAULT_URI="https://<vault-name>.vault.azure.net/"

# Notes
# - Use managed identities or service principals and grant Key Vault access policies to the app/service principal.
# - In our app, configuration keys should be named like Resend__ApiKey, Google__ClientId to match IConfiguration binding.
