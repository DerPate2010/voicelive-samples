targetScope = 'resourceGroup'

@description('The Azure Developer CLI environment name.')
param environmentName string

@description('Azure region for the Static Web App. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Optional suffix to keep globally unique resource names stable per environment.')
param resourceToken string = uniqueString(resourceGroup().id, environmentName)

@description('The Azure Static Web App SKU to provision.')
@allowed([
  'Free'
  'Standard'
])
param staticWebAppSku string = 'Free'

var sanitizedEnvironmentName = trim(toLower(environmentName))
var normalizedEnvironmentName = replace(replace(replace(replace(sanitizedEnvironmentName, ' ', '-'), '_', '-'), '.', '-'), '/', '-')
var staticWebAppName = 'swa-${normalizedEnvironmentName}-${resourceToken}'
var tags = {
  'azd-env-name': environmentName
  'azd-service-name': 'web'
}

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: staticWebAppSku
    tier: staticWebAppSku
  }
  tags: tags
  properties: {}
}

output AZURE_LOCATION string = location
output AZURE_STATIC_WEB_APP_NAME string = staticWebApp.name
output webEndpoint string = 'https://${staticWebApp.properties.defaultHostname}'
