import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPhotos, deletePhoto, Photo } from "../api";
import { PhotoGrid } from "../components/PhotoGrid";

export const AlbumView: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const decoded = name ? decodeURIComponent(name) : undefined;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await fetchPhotos(decoded);
        setPhotos(p);
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [decoded]);

  const handleDelete = async (id: number) => {
    try {
      await deletePhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete photo");
    }
  };

  return (
    <div>
      <h2>Album: {decoded}</h2>
      {loading && <div>Loading…</div>}
      {!loading && <PhotoGrid photos={photos} onDelete={handleDelete} />}
    </div>
  );
};

export default AlbumView;
