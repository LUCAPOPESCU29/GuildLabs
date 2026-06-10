import { ImageResponse } from "next/og";

// Generated favicon — a blurple "G" monogram, consistent with the brand mark.
export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#8b93ff",
          color: "#15131e",
          fontSize: 44,
          fontWeight: 800,
          borderRadius: 14,
          fontFamily: "sans-serif",
        }}
      >
        G
      </div>
    ),
    { ...size }
  );
}
