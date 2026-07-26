/**
 * Google Cloud Storage adapter — Epic 4 implements.
 * Contract: signed upload URLs, delete, access control for images + audio.
 * Single media backend for the whole app.
 */
export type SignedUpload = {
  uploadUrl: string;
  objectPath: string;
  expiresAt: string;
};

export interface StorageAdapter {
  createSignedUpload(opts: {
    userId: string;
    kind: "image" | "audio";
    contentType: string;
  }): Promise<SignedUpload>;
  delete(objectPath: string): Promise<void>;
  publicUrl(objectPath: string): string;
}

export function getStorage(): StorageAdapter {
  throw new Error("GCS storage adapter lands in Epic 4");
}
