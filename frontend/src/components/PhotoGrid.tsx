import React, { useState, useEffect } from "react";
import {
  Photo,
  photoImageUrl,
  photoThumbUrl,
  fetchPhotos,
  deletePhoto,
} from "../api";

interface Props {
  photos?: Photo[]; // optional: if provided, component is controlled
  album?: string;
  onDelete?: (id: number) => void;
}

export const PhotoGrid: React.FC<Props> = ({ photos, album, onDelete }) => {
  const [modalPhoto, setModalPhoto] = useState<Photo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [items, setItems] = useState<Photo[]>(photos ?? []);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const PAGE_SIZE = 30;

  const controlled = Array.isArray(photos);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) {
        setModalOpen(false);
        setModalPhoto(null);
      }
    };
    if (modalOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  // respond to external photos prop when controlled
  useEffect(() => {
    if (controlled) setItems(photos ?? []);
  }, [photos]);

  // when album changes and uncontrolled, reset and load first page
  useEffect(() => {
    if (controlled) return;
    setItems([]);
    setFinished(false);
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album]);

  async function loadMore() {
    if (loading || finished) return;
    setLoading(true);
    try {
      const skip = items.length;
      const next = await fetchPhotos(album, skip, PAGE_SIZE);
      setItems((prev) => [...prev, ...next]);
      if (next.length < PAGE_SIZE) setFinished(true);
    } catch (err) {
      console.error("Failed to load photos", err);
    } finally {
      setLoading(false);
    }
  }

  const openModal = (p: Photo) => {
    setModalPhoto(p);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalPhoto(null);
  };

  const handleDelete = async (p: Photo) => {
    if (typeof onDelete === "function") {
      try {
        await onDelete(p.id);
        setItems((prev) => prev.filter((x) => x.id !== p.id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete photo");
      }
    } else {
      try {
        await deletePhoto(p.id);
        setItems((prev) => prev.filter((x) => x.id !== p.id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete photo");
      }
    }
  };

  return (
    <div>
      <div className="photo-grid">
        {items.map((p) => (
          <div key={p.id} className="photo-card">
            <div className="photo-media">
              <img
                src={photoThumbUrl(p)}
                alt={p.original_filename}
                className="photo-img"
              />

              <div className="photo-overlay">
                <div className="photo-details">
                  <div className="photo-filename" title={p.original_filename}>
                    {p.original_filename}
                  </div>
                  <div className="photo-date">
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                  <div className="photo-actions">
                    <button
                      onClick={() => window.open(photoImageUrl(p), "_blank")}
                      className="btn btn-secondary"
                    >
                      💾
                    </button>
                    <button
                      onClick={() => openModal(p)}
                      className="btn btn-secondary"
                    >
                      👀
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this photo?")) return;
                        await handleDelete(p);
                      }}
                      className="btn btn-danger"
                    >
                      🗑️
                    </button>
                  </div>
                  {p.album && (
                    <div className="photo-album">
                      <div className="badge">{p.album}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && modalPhoto && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={closeModal}
              aria-label="Close"
            >
              ×
            </button>
            <img
              src={photoImageUrl(modalPhoto)}
              alt={modalPhoto.original_filename}
              className="modal-img"
            />
            <div className="modal-caption">{modalPhoto.original_filename}</div>
          </div>
        </div>
      )}
      {/* load more button */}
      <div className="load-more-container">
        {!finished && (
          <button
            className="load-more-btn"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "Loading…" : "More"}
          </button>
        )}
        {finished && items.length === 0 && (
          <div className="muted">No photos found</div>
        )}
      </div>
    </div>
  );
};
