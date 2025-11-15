import React, { useState, useEffect } from "react";
import { Photo, photoImageUrl } from "../api";

interface Props {
  photos: Photo[];
  onDelete?: (id: number) => void;
}

export const PhotoGrid: React.FC<Props> = ({ photos, onDelete }) => {
  const [modalPhoto, setModalPhoto] = useState<Photo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  const openModal = (p: Photo) => {
    setModalPhoto(p);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalPhoto(null);
  };

  return (
    <div>
      <div className="photo-grid">
        {photos.map((p) => (
          <div key={p.id} className="photo-card">
            <div className="photo-media">
              <img
                src={photoImageUrl(p)}
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
                        try {
                          if (typeof onDelete === "function") {
                            onDelete(p.id);
                          }
                        } catch (err) {
                          console.error(err);
                          alert("Failed to delete photo");
                        }
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
    </div>
  );
};
