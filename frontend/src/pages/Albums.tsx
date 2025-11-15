import React, { useEffect, useState } from "react";
import { fetchAlbums } from "../api";
import { useNavigate } from "react-router-dom";

export const Albums: React.FC = () => {
  const [albums, setAlbums] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [visible, setVisible] = useState<string[]>([]);
  const navigate = useNavigate();

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

  // update visible albums when album list or filter changes
  useEffect(() => {
    if (!filterText) {
      setVisible(albums);
      return;
    }
    const q = filterText.toLowerCase();
    setVisible(albums.filter((a) => a.toLowerCase().includes(q)));
  }, [albums, filterText]);

  if (loading) return <div>Loading albums…</div>;

  return (
    <div>
      <h2>Albums</h2>

      {albums.length === 0 && <div>No albums yet</div>}

      <div style={{ margin: "8px 0 12px 0" }}>
        <input
          type="text"
          placeholder="Filter albums"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="album-list">
        {visible.length === 0 && <div>No matching albums</div>}
        {visible.map((a) => (
          <button
            key={a}
            className="album-btn"
            onClick={() => navigate(`/albums/${encodeURIComponent(a)}`)}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Albums;
