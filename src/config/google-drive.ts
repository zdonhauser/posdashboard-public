/**
 * Google Drive Configuration
 *
 * Google Drive API client initialization with JWT authentication
 * for file storage and management operations.
 */

import { JWT } from 'google-auth-library';
import { drive_v3 } from 'googleapis/build/src/apis/drive/v3';
import { env } from './environment';

/**
 * Google Drive API scopes
 */
export const SCOPES = ['https://www.googleapis.com/auth/drive'];

/**
 * Google Service Account key configuration
 * Built from environment variables
 */
export const googleServiceAccountKey = {
  type: env.google.type,
  project_id: env.google.projectId,
  private_key_id: env.google.privateKeyId,
  private_key: env.google.privateKey,
  client_email: env.google.clientEmail,
  client_id: env.google.clientId,
  auth_uri: env.google.authUri,
  token_uri: env.google.tokenUri,
  auth_provider_x509_cert_url: env.google.authProviderX509CertUrl,
  client_x509_cert_url: env.google.clientX509CertUrl,
  universe_domain: env.google.universeDomain,
};

/**
 * JWT authentication client
 * Used for Google Drive API authentication
 */
export const auth = new JWT({
  email: googleServiceAccountKey.client_email,
  key: googleServiceAccountKey.private_key,
  scopes: SCOPES,
});

/**
 * Google Drive API client instance
 */
export const drive = new drive_v3.Drive({
  auth,
});

/**
 * Upload a file to Google Drive
 *
 * @param fileMetadata File metadata (name, mimeType, parents)
 * @param media File content and mimeType
 * @returns Uploaded file
 */
export async function uploadFile(
  fileMetadata: drive_v3.Schema$File,
  media: {
    mimeType: string;
    body: Buffer | NodeJS.ReadableStream;
  }
) {
  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, mimeType, webViewLink, webContentLink',
  });

  return response.data;
}

/**
 * Download a file from Google Drive
 *
 * @param fileId File ID
 * @returns File content as buffer
 */
export async function downloadFile(fileId: string): Promise<Buffer> {
  const response = await drive.files.get(
    {
      fileId: fileId,
      alt: 'media',
    },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

/**
 * Get file metadata
 *
 * @param fileId File ID
 * @param fields Optional fields to retrieve
 * @returns File metadata
 */
export async function getFileMetadata(
  fileId: string,
  fields: string = 'id, name, mimeType, size, createdTime, modifiedTime'
) {
  const response = await drive.files.get({
    fileId: fileId,
    fields: fields,
  });

  return response.data;
}

/**
 * Delete a file from Google Drive
 *
 * @param fileId File ID
 */
export async function deleteFile(fileId: string): Promise<void> {
  await drive.files.delete({
    fileId: fileId,
  });
}

/**
 * List files in a folder
 *
 * @param folderId Folder ID (optional)
 * @param query Search query (optional)
 * @param pageSize Number of results per page (default: 10)
 * @returns List of files
 */
export async function listFiles(
  folderId?: string,
  query?: string,
  pageSize: number = 10
) {
  let q = query || '';

  if (folderId) {
    q = q ? `${q} and '${folderId}' in parents` : `'${folderId}' in parents`;
  }

  const response = await drive.files.list({
    q: q,
    pageSize: pageSize,
    fields: 'files(id, name, mimeType, size, createdTime, modifiedTime)',
  });

  return response.data.files || [];
}

/**
 * Create a folder in Google Drive
 *
 * @param folderName Folder name
 * @param parentFolderId Optional parent folder ID
 * @returns Created folder
 */
export async function createFolder(
  folderName: string,
  parentFolderId?: string
) {
  const fileMetadata: drive_v3.Schema$File = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId];
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id, name, mimeType',
  });

  return response.data;
}

/**
 * Share a file with specific permissions
 *
 * @param fileId File ID
 * @param emailAddress Email address to share with
 * @param role Permission role (reader, writer, commenter)
 * @returns Permission
 */
export async function shareFile(
  fileId: string,
  emailAddress: string,
  role: 'reader' | 'writer' | 'commenter' = 'reader'
) {
  const response = await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      type: 'user',
      role: role,
      emailAddress: emailAddress,
    },
    fields: 'id',
  });

  return response.data;
}

/**
 * Make a file publicly accessible
 *
 * @param fileId File ID
 * @returns Permission
 */
export async function makeFilePublic(fileId: string) {
  const response = await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      type: 'anyone',
      role: 'reader',
    },
    fields: 'id',
  });

  return response.data;
}
