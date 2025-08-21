'use strict';

var React = require('react');

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".map-plot-container {\r\n  position: relative;\r\n  overflow: hidden;\r\n  cursor: grab;\r\n}\r\n.map-plot-container:active {\r\n  cursor: grabbing;\r\n}\r\n.map-tile {\r\n  position: absolute;\r\n  user-select: none;\r\n  pointer-events: none;\r\n}";
styleInject(css_248z);

function lat2tile(lat, zoom) {
  const rad = lat * Math.PI / 180;
  return (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * 2 ** zoom;
}
function lon2tile(lon, zoom) {
  return (lon + 180) / 360 * 2 ** zoom;
}
function MapPlot(_ref) {
  let {
    center = [37.8, -96],
    zoom = 4,
    tileSize = 256,
    width = 800,
    height = 600
  } = _ref;
  const containerRef = React.useRef(null);
  const [cz, setCz] = React.useState(zoom);
  const [centerPx, setCenterPx] = React.useState([0, 0]);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStart = React.useRef([0, 0]);
  const recalc = React.useCallback(() => {
    const [lat, lon] = center;
    const x = lon2tile(lon, cz) * tileSize;
    const y = lat2tile(lat, cz) * tileSize;
    setCenterPx([x, y]);
  }, [center, cz, tileSize]);
  React.useEffect(() => {
    recalc();
  }, [recalc]);
  React.useEffect(() => {
    const cont = containerRef.current;
    if (!cont) return;
    const onMouseDown = e => {
      setIsDragging(true);
      dragStart.current = [e.clientX, e.clientY];
    };
    const onMouseMove = e => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current[0];
      const dy = e.clientY - dragStart.current[1];
      dragStart.current = [e.clientX, e.clientY];
      setCenterPx(_ref2 => {
        let [cx, cy] = _ref2;
        return [cx - dx, cy - dy];
      });
    };
    const onMouseUp = () => setIsDragging(false);
    const onWheel = e => {
      e.preventDefault();
      setCz(z => Math.max(1, Math.min(19, z + (e.deltaY > 0 ? -1 : 1))));
    };
    cont.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    cont.addEventListener('wheel', onWheel, {
      passive: false
    });
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
      const xWrapped = (tx % max + max) % max;
      if (ty < 0 || ty >= max) continue;
      const left = c * tileSize + (width / 2 - centerPx[0] % tileSize - tileSize);
      const top = r * tileSize + (height / 2 - centerPx[1] % tileSize - tileSize);
      tiles.push({
        x: xWrapped,
        y: ty,
        left,
        top
      });
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    ref: containerRef,
    className: "map-plot-container",
    style: {
      width,
      height
    }
  }, tiles.map((t, i) => /*#__PURE__*/React.createElement("img", {
    key: "".concat(t.x, "-").concat(t.y, "-").concat(i),
    src: "https://tile.openstreetmap.org/".concat(cz, "/").concat(t.x, "/").concat(t.y, ".png"),
    alt: "",
    className: "map-tile",
    style: {
      width: tileSize,
      height: tileSize,
      left: t.left,
      top: t.top
    }
  })));
}

exports.MapPlot = MapPlot;
//# sourceMappingURL=index.cjs.js.map
