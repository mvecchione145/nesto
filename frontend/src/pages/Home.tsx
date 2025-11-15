import React from "react";

const Home: React.FC = () => {
  return (
    <div>
      <h2>Welcome to Nesto</h2>
      <p className="muted">
        Nesto is a lightweight local photo storage application. Upload photos from
        any device on your network, organize them into albums, and download originals
        when you need them. Photos are stored on the server's filesystem and
        referenced in a Postgres database.
      </p>

      <h3>Features</h3>
      <ul>
        <li>Upload photos with optional album names.</li>
        <li>Browse photos by album.</li>
        <li>Download original images.</li>
      </ul>

      <p className="muted" style={{ fontSize: 13 }}>
        Use the navigation links above to view albums or upload new photos.
      </p>
    </div>
  );
};

export default Home;
