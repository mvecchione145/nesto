// prefer a build-time Vite variable VITE_API_URL; fall back to localhost:8000 for
// local dev. When building the frontend image in Docker Compose we pass the
// backend address as a build-arg so this value is compiled into the bundle.
const API_BASE = (import.meta as any)?.env?.VITE_API_URL ?? "http://localhost:8000";

export interface Photo {
  id: number;
  original_filename: string;
  url: string;
  created_at: string;
  album?: string | null;
}

export async function fetchPhotos(album?: string): Promise<Photo[]> {
  const url = new URL(`${API_BASE}/api/photos`);
  if (album) url.searchParams.set("album", album);
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
