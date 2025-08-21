import React, { useRef, useState, useEffect, useCallback } from 'react';
import './MapPlot.css';

function lat2tile(lat, zoom) {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom;
}

function lon2tile(lon, zoom) {
  return ((lon + 180) / 360) * 2 ** zoom;
}

export function MapPlot({ center = [37.8, -96], zoom = 4, tileSize = 256, width = 800, height = 600 }) {
  const containerRef = useRef(null);
  const [cz, setCz] = useState(zoom);
  const [centerPx, setCenterPx] = useState([0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef([0, 0]);

  const recalc = useCallback(() => {
    const [lat, lon] = center;
    const x = lon2tile(lon, cz) * tileSize;
    const y = lat2tile(lat, cz) * tileSize;
    setCenterPx([x, y]);
  }, [center, cz, tileSize]);

  useEffect(() => { recalc(); }, [recalc]);

  useEffect(() => {
    const cont = containerRef.current;
    if (!cont) return;
    const onMouseDown = e => { setIsDragging(true); dragStart.current = [e.clientX, e.clientY]; };
    const onMouseMove = e => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current[0];
      const dy = e.clientY - dragStart.current[1];
      dragStart.current = [e.clientX, e.clientY];
      setCenterPx(([cx, cy]) => [cx - dx, cy - dy]);
    };
    const onMouseUp = () => setIsDragging(false);
    const onWheel = e => { e.preventDefault(); setCz(z => Math.max(1, Math.min(19, z + (e.deltaY > 0 ? -1 : 1)))); };

    cont.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    cont.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cont.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      cont.removeEventListener('wheel', onWheel);
    };
  }, [isDragging]);

  const cols = Math.ceil(width / tileSize) + 2;
  const rows = Math.ceil(height / tileSize) + 2;
  const centerCol = centerPx[0] / tileSize;
  const centerRow = centerPx[1] / tileSize;
  const startCol = Math.floor(centerCol - cols / 2);
  const startRow = Math.floor(centerRow - rows / 2);

  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tx = startCol + c;
      const ty = startRow + r;
      const max = 2 ** cz;
      const xWrapped = ((tx % max) + max) % max;
      if (ty < 0 || ty >= max) continue;
      const left = c * tileSize + (width / 2 - (centerPx[0] % tileSize) - tileSize);
      const top = r * tileSize + (height / 2 - (centerPx[1] % tileSize) - tileSize);
      tiles.push({ x: xWrapped, y: ty, left, top });
    }
  }

  return (
    <div ref={containerRef} className="map-plot-container" style={{ width, height }}>
      {tiles.map((t, i) => (
        <img
          key={`${t.x}-${t.y}-${i}`}
          src={`https://tile.openstreetmap.org/${cz}/${t.x}/${t.y}.png`}
          alt=""
          className="map-tile"
          style={{ width: tileSize, height: tileSize, left: t.left, top: t.top }}
        />
      ))}
    </div>
  );
}