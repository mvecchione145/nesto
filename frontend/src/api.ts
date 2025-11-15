// prefer a build-time Vite variable VITE_API_URL; fall back to localhost:8000 for
// local dev. When building the frontend image in Docker Compose we pass the
// backend address as a build-arg so this value is compiled into the bundle.
const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL ?? "http://localhost:8000";

export interface Photo {
  id: number;
  original_filename: string;
  url: string;
  created_at: string;
  album?: string | null;
}

export async function fetchPhotos(
  album?: string,
  skip?: number,
  limit?: number,
): Promise<Photo[]> {
  const url = new URL(`${API_BASE}/api/photos`);
  if (album) url.searchParams.set("album", album);
  if (typeof skip === "number") url.searchParams.set("skip", String(skip));
  if (typeof limit === "number") url.searchParams.set("limit", String(limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch photos");
  return res.json();
}

export async function uploadPhoto(file: File, album?: string): Promise<Photo> {
  const formData = new FormData();
  formData.append("file", file);
  if (album) formData.append("album", album);

  const res = await fetch(`${API_BASE}/api/photos`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

// Upload with progress callback using XMLHttpRequest so we can report per-file progress.
export function uploadPhotoWithProgress(
  file: File,
  album: string | undefined,
  onProgress?: (percent: number) => void,
): Promise<Photo> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/photos`);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data as Photo);
        } catch (err) {
          reject(new Error("Failed to parse upload response"));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));

    if (xhr.upload && typeof onProgress === "function") {
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          onProgress(pct);
        }
      };
    }

    const form = new FormData();
    form.append("file", file);
    if (album) form.append("album", album);

    xhr.send(form);
  });
}

export function photoImageUrl(photo: Photo): string {
  // API already returns `/media/originals/...` in `url`, just prefix backend
  return `${API_BASE}${photo.url}`;
}

export async function fetchAlbums(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/albums`);
  if (!res.ok) throw new Error("Failed to fetch albums");
  return res.json();
}

export async function deletePhoto(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/photos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete photo");
}
