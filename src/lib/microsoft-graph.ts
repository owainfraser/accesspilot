import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

// ─── Token Provider ───────────────────────────────────────────────────────────

interface TokenCredentials {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

async function getAccessToken(credentials: TokenCredentials): Promise<string> {
  const url = `https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Microsoft access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

// ─── Graph Client Factory ─────────────────────────────────────────────────────

export function createGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

// ─── User Operations ──────────────────────────────────────────────────────────

export interface GraphUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

export async function getGraphUser(
  credentials: TokenCredentials,
  userId: string
): Promise<GraphUser> {
  const token = await getAccessToken(credentials);
  const client = createGraphClient(token);

  const user = await client
    .api(`/users/${userId}`)
    .select("id,displayName,mail,userPrincipalName")
    .get();

  return user as GraphUser;
}

export async function listGraphUsers(
  credentials: TokenCredentials,
  search?: string
): Promise<GraphUser[]> {
  const token = await getAccessToken(credentials);
  const client = createGraphClient(token);

  let api = client
    .api("/users")
    .select("id,displayName,mail,userPrincipalName")
    .top(50);

  if (search) {
    api = api.filter(
      `startsWith(displayName,'${search}') or startsWith(mail,'${search}')`
    );
  }

  const result = await api.get();
  return (result.value || []) as GraphUser[];
}

// ─── Role Assignments ─────────────────────────────────────────────────────────

export interface DirectoryRole {
  id: string;
  displayName: string;
  description: string;
  roleTemplateId: string;
}

export async function listDirectoryRoles(
  credentials: TokenCredentials
): Promise<DirectoryRole[]> {
  const token = await getAccessToken(credentials);
  const client = createGraphClient(token);

  const result = await client
    .api("/directoryRoles")
    .select("id,displayName,description,roleTemplateId")
    .get();

  return (result.value || []) as DirectoryRole[];
}

export async function assignDirectoryRole(
  credentials: TokenCredentials,
  userId: string,
  roleId: string
): Promise<void> {
  const token = await getAccessToken(credentials);
  const client = createGraphClient(token);

  await client.api(`/directoryRoles/${roleId}/members/$ref`).post({
    "@odata.id": `https://graph.microsoft.com/v1.0/users/${userId}`,
  });
}

export async function removeDirectoryRole(
  credentials: TokenCredentials,
  userId: string,
  roleId: string
): Promise<void> {
  const token = await getAccessToken(credentials);
  const client = createGraphClient(token);

  await client
    .api(`/directoryRoles/${roleId}/members/${userId}/$ref`)
    .delete();
}

// ─── Group Operations ─────────────────────────────────────────────────────────

export interface GraphGroup {
  id: string;
  displayName: string;
  description: string;
  mail: string;
  groupTypes: string[];
}

export async function listGroups(
  credentials: TokenCredentials,
  search?: string
): Promise<GraphGroup[]> {
  const token = await getAccessToken(credentials);
  const client = createGraphClient(token);

  let api = client
    .api("/groups")
    .select("id,displayName,description,mail,groupTypes")
    .top(50);

  if (search) {
    api = api.filter(`startsWith(displayName,'${search}')`);
  }

  const result = await api.get();
  return (result.value || []) as GraphGroup[];
}

export async function addUserToGroup(
  credentials: TokenCredentials,
  userId: string,
  groupId: string
): Promise<void> {
  const token = await getAccessToken(credentials);
  const client = createGraphClient(token);

  await client.api(`/groups/${groupId}/members/$ref`).post({
    "@odata.id": `https://graph.microsoft.com/v1.0/users/${userId}`,
  });
}

export async function removeUserFromGroup(
  credentials: TokenCredentials,
  userId: string,
  groupId: string
): Promise<void> {
  const token = await getAccessToken(credentials);
  const client = createGraphClient(token);

  await client
    .api(`/groups/${groupId}/members/${userId}/$ref`)
    .delete();
}

// ─── Grant/Revoke Dispatcher ──────────────────────────────────────────────────

export type ResourceType =
  | "ENTRA_ROLE"
  | "M365_GROUP"
  | "AZURE_RESOURCE"
  | "LOCAL_ADMIN";

export async function grantAccess(
  credentials: TokenCredentials,
  userId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<void> {
  switch (resourceType) {
    case "ENTRA_ROLE":
      await assignDirectoryRole(credentials, userId, resourceId);
      break;
    case "M365_GROUP":
      await addUserToGroup(credentials, userId, resourceId);
      break;
    case "AZURE_RESOURCE":
      // Azure RBAC assignment via ARM API — future implementation
      throw new Error("Azure resource assignment not yet implemented");
    case "LOCAL_ADMIN":
      // Local admin elevation is handled by an on-prem agent
      throw new Error("Local admin elevation requires on-prem agent");
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }
}

export async function revokeAccess(
  credentials: TokenCredentials,
  userId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<void> {
  switch (resourceType) {
    case "ENTRA_ROLE":
      await removeDirectoryRole(credentials, userId, resourceId);
      break;
    case "M365_GROUP":
      await removeUserFromGroup(credentials, userId, resourceId);
      break;
    case "AZURE_RESOURCE":
      throw new Error("Azure resource revocation not yet implemented");
    case "LOCAL_ADMIN":
      throw new Error("Local admin revocation requires on-prem agent");
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }
}

// ─── OAuth Admin Consent ──────────────────────────────────────────────────────

export function buildAdminConsentUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    response_mode: "query",
    scope:
      "https://graph.microsoft.com/.default offline_access",
    prompt: "admin_consent",
    state,
  });

  return `https://login.microsoftonline.com/common/adminconsent?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  tenantId: string
): Promise<{ accessToken: string; refreshToken: string; tenantId: string }> {
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    scope: "https://graph.microsoft.com/.default offline_access",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tenantId: data.tid || tenantId,
  };
}
