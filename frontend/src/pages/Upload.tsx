import React, { useState } from "react";
import { UploadForm } from "../components/UploadForm";
import { Photo, photoImageUrl } from "../api";
import { Link } from "react-router-dom";

const UploadPage: React.FC = () => {
  const [lastUploaded, setLastUploaded] = useState<Photo | null>(null);

  return (
    <div>
      <h2>Upload Photo</h2>

      <UploadForm
        onUploaded={(p) => {
          setLastUploaded(p);
        }}
      />

      {lastUploaded && (
        <div style={{ marginTop: 12 }}>
          <strong>Uploaded:</strong>
          <div>{lastUploaded.original_filename}</div>
          <div style={{ marginTop: 8 }}>
            <a href={photoImageUrl(lastUploaded)} target="_blank" rel="noreferrer">
              Open file
            </a>
            {' '}
            —
            {' '}
            <a href={photoImageUrl(lastUploaded)} download={lastUploaded.original_filename}>
              Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
