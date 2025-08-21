"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MapPlot = MapPlot;
var _react = _interopRequireWildcard(require("react"));
require("./MapPlot.css");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// см. CSS ниже

/**
 * Преобразует широту в Y-тайл
 */
function lat2tile(lat, zoom) {
  const rad = lat * Math.PI / 180;
  return (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * Math.pow(2, zoom);
}

/**
 * Преобразует долготу в X-тайл
 */
function lon2tile(lon, zoom) {
  return (lon + 180) / 360 * Math.pow(2, zoom);
}
function MapPlot(_ref) {
  let {
    center = [37.8, -96],
    // [lat, lon]
    zoom = 4,
    tileSize = 256,
    width = 800,
    height = 600,
    bounds = null // не используем сейчас
  } = _ref;
  const containerRef = (0, _react.useRef)(null);
  const [cz, setCz] = (0, _react.useState)(zoom);
  const [centerPx, setCenterPx] = (0, _react.useState)([0, 0]);
  const [isDragging, setIsDragging] = (0, _react.useState)(false);
  const dragStart = (0, _react.useRef)([0, 0]);

  // при изменении zoom или center пересчитываем пиксели
  const recalc = (0, _react.useCallback)(() => {
    const [lat, lon] = center;
    const x = lon2tile(lon, cz) * tileSize;
    const y = lat2tile(lat, cz) * tileSize;
    setCenterPx([x, y]);
  }, [center, cz, tileSize]);
  (0, _react.useEffect)(() => {
    recalc();
  }, [recalc]);

  // обработчики мыши для панорамирования
  (0, _react.useEffect)(() => {
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
      setCz(z => Math.min(19, Math.max(1, z + (e.deltaY > 0 ? -1 : 1))));
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

  // Собираем тайлы, которые нужно отобразить
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
      const max = Math.pow(2, cz);
      // оборачиваем долготу по модулю
      const xWrapped = (tx % max + max) % max;
      if (ty < 0 || ty >= max) continue; // за полюсами пропускаем
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
  return /*#__PURE__*/_react.default.createElement("div", {
    ref: containerRef,
    className: "map-plot-container",
    style: {
      width,
      height
    }
  }, tiles.map((t, i) => /*#__PURE__*/_react.default.createElement("img", {
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