/**
 * Google Drive API Type Definitions
 *
 * This file contains TypeScript interfaces for Google Drive
 * operations, file uploads, and authentication.
 */

/**
 * Google Service Account Key Configuration
 */
export interface GoogleServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

/**
 * Google Drive File Metadata
 */
export interface GoogleDriveFileMetadata {
  name: string;
  mimeType?: string;
  parents?: string[];
  description?: string;
  properties?: Record<string, string>;
}

/**
 * Google Drive File Response
 */
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  kind: string;
  parents?: string[];
  createdTime: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  shared?: boolean;
  owners?: Array<{
    displayName: string;
    emailAddress: string;
    permissionId: string;
  }>;
  permissions?: GoogleDrivePermission[];
}

/**
 * Google Drive Permission
 */
export interface GoogleDrivePermission {
  id: string;
  type: 'user' | 'group' | 'domain' | 'anyone';
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
  emailAddress?: string;
  domain?: string;
  displayName?: string;
  photoLink?: string;
  expirationTime?: string;
  deleted?: boolean;
  pendingOwner?: boolean;
}

/**
 * Google Drive Upload Options
 */
export interface GoogleDriveUploadOptions {
  fileMetadata: GoogleDriveFileMetadata;
  media: {
    mimeType: string;
    body: Buffer | NodeJS.ReadableStream;
  };
}

/**
 * Google Drive File List Response
 */
export interface GoogleDriveFileListResponse {
  kind: string;
  incompleteSearch: boolean;
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

/**
 * Google Drive File Search Options
 */
export interface GoogleDriveSearchOptions {
  q?: string; // Query string
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
  fields?: string;
  spaces?: string; // 'drive', 'appDataFolder', 'photos'
  corpora?: string;
  includeItemsFromAllDrives?: boolean;
  supportsAllDrives?: boolean;
}

/**
 * Google Drive Delete Response
 */
export interface GoogleDriveDeleteResponse {
  success: boolean;
  fileId: string;
}

/**
 * Google Drive Share Link Options
 */
export interface GoogleDriveShareOptions {
  fileId: string;
  type: 'user' | 'group' | 'domain' | 'anyone';
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
  emailAddress?: string;
  domain?: string;
  sendNotificationEmail?: boolean;
}

/**
 * Photo Upload Request (for membership photos)
 */
export interface MemberPhotoUploadRequest {
  membership_number: string;
  file: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  };
}

/**
 * Photo Upload Response
 */
export interface MemberPhotoUploadResponse {
  success: boolean;
  photoUrl: string;
  fileId: string;
}

/**
 * Photo Download Request
 */
export interface MemberPhotoDownloadRequest {
  membership_number: string;
}

/**
 * Photo Download Response
 */
export interface MemberPhotoDownloadResponse {
  success: boolean;
  photoUrl?: string;
  photoData?: Buffer;
  mimeType?: string;
}
