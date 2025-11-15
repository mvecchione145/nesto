import React, { useRef, useState, useEffect } from "react";
import { uploadPhoto, Photo, fetchAlbums } from "../api";

interface Props {
  onUploaded: (photo: Photo) => void;
}

export const UploadForm: React.FC<Props> = ({ onUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [album, setAlbum] = useState("");
  const [albums, setAlbums] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const a = await fetchAlbums();
        if (mounted) setAlbums(a || []);
      } catch (err) {
        // ignore failures — suggestions are optional
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a file");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const photo = await uploadPhoto(file, album || undefined);
      onUploaded(photo);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = album
    ? albums.filter((a) => a.toLowerCase().includes(album.toLowerCase()))
    : albums.slice(0, 8);

  const choose = (value: string) => {
    setAlbum(value);
    setShowSuggestions(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(-1, h - 1));
    } else if (e.key === "Enter") {
      if (highlight >= 0 && highlight < filtered.length) {
        e.preventDefault();
        choose(filtered[highlight]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <input type="file" ref={fileInputRef} className="file-input" />
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Album (optional)"
          value={album}
          onChange={(e) => {
            setAlbum(e.target.value);
            setShowSuggestions(true);
            setHighlight(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={onKeyDown}
          className="text-input"
          aria-autocomplete="list"
          aria-haspopup="listbox"
        />

        {showSuggestions && filtered.length > 0 && (
          <ul className="suggestion-list" role="listbox">
            {filtered.slice(0, 8).map((s, i) => (
              <li
                key={s}
                role="option"
                aria-selected={highlight === i}
                className={"suggestion-item" + (highlight === i ? " highlight" : "")}
                onMouseDown={() => choose(s)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" disabled={isUploading} className="btn btn-primary">
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {error && <span className="error-text">{error}</span>}
    </form>
  );
};
