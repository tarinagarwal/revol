import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export type Photo = {
  id: string;
  position: number;
  url: string | null;
  ai: { analyzed: boolean; isHuman: boolean | null; safe: boolean | null; flaggedReason: string | null };
};

export const getPhotos = () => api<{ photos: Photo[] }>("/media/photos");
export const deletePhoto = (id: string) => api<{ ok: boolean }>(`/media/photos/${id}`, { method: "DELETE" });
export const reorderPhotos = (ids: string[]) =>
  api<{ ok: boolean }>("/media/photos/order", { method: "PUT", body: JSON.stringify({ ids }) });

/** XHR upload — fetch still has no upload progress events. */
export function uploadPhoto(file: File | Blob, onProgress: (pct: number) => void): Promise<Photo> {
  return new Promise((resolve, reject) => {
    const { accessToken } = useAuthStore.getState();
    const form = new FormData();
    form.append("file", file, file instanceof File ? file.name : "photo.jpg");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/media/photos`);
    if (accessToken) xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((JSON.parse(xhr.responseText) as { photo: Photo }).photo);
      } else {
        try {
          reject(new Error((JSON.parse(xhr.responseText) as { error?: string }).error ?? "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });
}
