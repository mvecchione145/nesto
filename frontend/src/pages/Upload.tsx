import React, { useState } from "react";
import { UploadForm } from "../components/UploadForm";
import { Photo, photoImageUrl } from "../api";
import { Link, useNavigate } from "react-router-dom";

const UploadPage: React.FC = () => {
  const [lastUploaded, setLastUploaded] = useState<Photo | null>(null);
  const navigate = useNavigate();

  return (
    <div>
      <h2>Upload Photo</h2>

      <UploadForm
        onUploaded={(p) => {
          // do not redirect here — wait for batch completion to avoid
          // navigating away before all parallel uploads finish
          setLastUploaded(p);
        }}
        onBatchUploaded={(arr) => {
          if (arr.length > 0 && arr[0].album) {
            navigate(`/albums/${encodeURIComponent(arr[0].album as string)}`);
            return;
          }
          if (arr.length > 0) setLastUploaded(arr[arr.length - 1]);
        }}
      />

      {lastUploaded && (
        <div style={{ marginTop: 12 }}>
          <strong>Uploaded:</strong>
          <div>{lastUploaded.original_filename}</div>
          <div style={{ marginTop: 8 }}>
            <a
              href={photoImageUrl(lastUploaded)}
              target="_blank"
              rel="noreferrer"
            >
              Open file
            </a>{" "}
            —{" "}
            <a
              href={photoImageUrl(lastUploaded)}
              download={lastUploaded.original_filename}
            >
              Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
