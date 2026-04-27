targetScope = 'resourceGroup'

@description('The Azure Developer CLI environment name.')
param environmentName string

@description('Azure region for the App Service resources.')
param location string = resourceGroup().location

@description('Optional short suffix for globally unique resource names.')
param resourceToken string = uniqueString(resourceGroup().id, environmentName)

@description('Voice Live API or Azure AI Foundry endpoint returned by the demo token endpoint.')
param azureVoiceLiveEndpoint string = ''

@description('Foundry agent name returned by the demo token endpoint.')
param azureVoiceLiveAgentName string = ''

@description('Foundry project name returned by the demo token endpoint.')
param azureVoiceLiveProjectName string = ''

var normalizedEnvironmentName = toLower(replace(environmentName, '_', '-'))
var appServicePlanName = 'asp-${normalizedEnvironmentName}-${resourceToken}'
var webAppName = 'app-${normalizedEnvironmentName}-${resourceToken}'
var tags = {
  'azd-env-name': environmentName
}

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  tags: union(tags, { 'azd-service-name': 'mobile-backend' })
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: true
      appCommandLine: 'npm start'
      healthCheckPath: '/health'
      appSettings: [
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '0'
        }
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'AZURE_VOICELIVE_ENDPOINT'
          value: azureVoiceLiveEndpoint
        }
        {
          name: 'AZURE_VOICELIVE_AGENT_NAME'
          value: azureVoiceLiveAgentName
        }
        {
          name: 'AZURE_VOICELIVE_PROJECT_NAME'
          value: azureVoiceLiveProjectName
        }
      ]
    }
  }
}

output AZURE_LOCATION string = location
output AZURE_WEBAPP_NAME string = webApp.name
output AZURE_WEBAPP_PRINCIPAL_ID string = webApp.identity.principalId
output mobileBackendEndpoint string = 'https://${webApp.properties.defaultHostName}'
