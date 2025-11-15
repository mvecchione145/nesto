import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Albums from "./pages/Albums";
import AlbumView from "./pages/AlbumView";
import Upload from "./pages/Upload";

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 style={{ margin: 0 }}>Nesto Photo Storage</h1>
        <nav className="app-nav">
          <Link to="/">Home</Link>
          <Link to="/albums">Albums</Link>
          <Link to="/upload">Upload</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/albums" element={<Albums />} />
        <Route path="/albums/:name" element={<AlbumView />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </div>
  );
}

export default App;
