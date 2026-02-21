// Assigns the Azure AI User role to the Foundry project's managed identity
// to enable tracing access on the Foundry account.
// NOTE: The Foundry account must be in the SAME resource group as this deployment.

@description('The principal ID of the Foundry project managed identity')
param foundryProjectPrincipalId string

@description('The name of the Foundry account (Cognitive Services account) in the same resource group')
param foundryAccountName string

// Azure AI User role definition ID
var azureAiUserRoleId = 'e47c6f54-e4a2-4754-9501-8e0985b135e1'

resource foundryAccount 'Microsoft.CognitiveServices/accounts@2024-10-01' existing = {
  name: foundryAccountName
}

resource azureAiUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(foundryAccount.id, foundryProjectPrincipalId, azureAiUserRoleId)
  scope: foundryAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', azureAiUserRoleId)
    principalId: foundryProjectPrincipalId
    principalType: 'ServicePrincipal'
    description: 'Azure AI User role for Foundry project tracing'
  }
}

output roleAssignmentId string = azureAiUserRole.id
