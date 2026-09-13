import { useState } from "react";
import { iconUrl } from "./engine/icons";

export function EsoIcon({
  file,
  alt,
  size = 48,
}: {
  file: string;
  alt: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="eso-icon fallback" style={{ width: size, height: size }} title={alt}>
        {alt.slice(0, 1)}
      </span>
    );
  }
  return (
    <img
      className="eso-icon"
      src={iconUrl(file)}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
