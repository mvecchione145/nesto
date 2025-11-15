import React, { useEffect, useState } from "react";
import { fetchAlbums } from "../api";
import { Link } from "react-router-dom";

export const Albums: React.FC = () => {
  const [albums, setAlbums] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const a = await fetchAlbums();
        setAlbums(a);
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading albums…</div>;

  return (
    <div>
      <h2>Albums</h2>
      {albums.length === 0 && <div>No albums yet</div>}
      <ul>
        {albums.map((a) => (
          <li key={a}>
            <Link to={`/albums/${encodeURIComponent(a)}`}>{a}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Albums;
