import React from "react";
import { useParams } from "react-router-dom";
import { PhotoGrid } from "../components/PhotoGrid";

export const AlbumView: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const decoded = name ? decodeURIComponent(name) : undefined;

  return (
    <div>
      <h2>Album: {decoded}</h2>
      {/* Let PhotoGrid load pages for this album */}
      <PhotoGrid album={decoded} />
    </div>
  );
};

export default AlbumView;
