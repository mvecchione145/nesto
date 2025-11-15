import React from "react";

const Home: React.FC = () => {
  return (
    <div>
      <h2>Welcome to Nesto</h2>
      <p className="muted">
        Nesto is a lightweight local photo storage application. Upload photos
        from any device on your network, organize them into albums, and download
        originals when you need them. Photos are stored on the server's
        filesystem and referenced in a Postgres database.
      </p>

      <h3>Features</h3>
      <ul>
        <li>Upload photos with optional album names.</li>
        <li>Browse photos by album.</li>
        <li>Download original images.</li>
      </ul>
    </div>
  );
};

export default Home;
