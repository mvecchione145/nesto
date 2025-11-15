import React, { useRef, useState, useEffect } from "react";
import {
  uploadPhoto,
  uploadPhotoWithProgress,
  Photo,
  fetchAlbums,
} from "../api";

interface Props {
  onUploaded: (photo: Photo) => void;
  onBatchUploaded?: (photos: Photo[]) => void;
}

export const UploadForm: React.FC<Props> = ({
  onUploaded,
  onBatchUploaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [album, setAlbum] = useState("");
  type SelectedFile = {
    id: string;
    file: File;
    progress: number;
    status: "pending" | "uploading" | "done" | "error";
    result?: Photo;
    error?: string;
  };

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
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
    // require album
    if (!album || album.trim() === "") {
      setError("Please provide an album name before uploading");
      return;
    }

    // single-file submit (legacy): if multiple files are selected, upload the first
    const file = fileInputRef.current?.files?.[0] ?? selectedFiles[0]?.file;
    if (!file) {
      setError("Please choose a file");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const photo = await uploadPhoto(file, album || undefined);
      onUploaded(photo);
      // notify batch completion hook for single-file legacy submit so
      // callers can uniformly wait for completion before navigating
      if (onBatchUploaded) onBatchUploaded([photo]);
      // clear file input selection
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFiles([]);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) {
      setSelectedFiles([]);
      return;
    }
    const arr = Array.from(files).map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      file: f,
      progress: 0,
      status: "pending" as const,
    }));
    setSelectedFiles(arr);
  };

  const uploadAll = async () => {
    if (selectedFiles.length === 0) return;
    if (!album || album.trim() === "") {
      setError("Please provide an album name before uploading");
      return;
    }
    setIsUploading(true);
    setError(null);

    // helper to update a selected file entry
    const updateFile = (id: string, patch: Partial<SelectedFile>) => {
      setSelectedFiles((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
    };

    const uploaded: Photo[] = [];

    // create upload tasks
    const tasks = selectedFiles.map((s) => async () => {
      updateFile(s.id, { status: "uploading", progress: 0 });
      try {
        const p = await uploadPhotoWithProgress(
          s.file,
          album || undefined,
          (pct) => {
            updateFile(s.id, { progress: pct });
          },
        );
        updateFile(s.id, { status: "done", progress: 100, result: p });
        uploaded.push(p);
        onUploaded(p);
      } catch (err: any) {
        console.error("Failed to upload", s.file.name, err);
        updateFile(s.id, {
          status: "error",
          error: err?.message ?? String(err),
        });
      }
    });

    // run with concurrency limit (worker pool)
    const concurrency = 4;
    const runWithConcurrency = async (
      jobs: (() => Promise<void>)[],
      limit: number,
    ) => {
      let idx = 0;
      const workers = new Array(Math.min(limit, jobs.length))
        .fill(0)
        .map(async () => {
          while (true) {
            const i = idx;
            idx += 1;
            if (i >= jobs.length) break;
            await jobs[i]();
          }
        });
      await Promise.all(workers);
    };

    await runWithConcurrency(tasks, concurrency);

    setIsUploading(false);
    // keep entries so user can see status; clear input selection
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (uploaded.length > 0 && onBatchUploaded) onBatchUploaded(uploaded);
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
      <input
        type="file"
        ref={fileInputRef}
        className="file-input"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
      />
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
                className={
                  "suggestion-item" + (highlight === i ? " highlight" : "")
                }
                onMouseDown={() => choose(s)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="submit"
          disabled={isUploading}
          className="btn btn-primary"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
        <button
          type="button"
          disabled={isUploading || selectedFiles.length === 0}
          onClick={uploadAll}
          className="btn btn-primary"
        >
          {isUploading
            ? "Uploading..."
            : `Upload ${selectedFiles.length} files`}
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <strong>Selected files:</strong>
          <div>
            {selectedFiles.map((s) => (
              <div key={s.id} className="file-item">
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div style={{ fontSize: 13 }}>{s.file.name}</div>
                  <div className="file-status">
                    {s.status} {s.progress ? `· ${s.progress}%` : ""}
                  </div>
                </div>
                <div className="progress-bar" aria-hidden>
                  <div
                    className="progress-fill"
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <span className="error-text">{error}</span>}
    </form>
  );
};
