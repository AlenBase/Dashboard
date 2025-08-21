// src/App.jsx

import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  LineChart, Line,
  BarChart, Bar,
  ScatterChart, Scatter,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MapPlot } from 'my-map-lib';
import './style.css';

const ItemTypes = { FIELD: 'field' };

function Field({ name }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FIELD,
    item: { name },
    collect: m => ({ isDragging: !!m.isDragging() }),
  }));
  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: '4px 8px',
        margin: '4px 0',
        background: '#eef',
        cursor: 'move'
      }}
    >
      {name}
    </div>
  );
}

function DropZone({ axis, value, onDrop }) {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.FIELD,
    drop: ({ name }) => onDrop(axis, name),
    collect: m => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
  }));
  const active = canDrop && isOver;
  return (
    <div
      ref={drop}
      style={{
        minHeight: 30,
        padding: 8,
        margin: '8px 0',
        border: '2px dashed',
        borderColor: active ? '#4caf50' : '#999',
        background: active ? '#f0fff0' : '#fafafa',
        textAlign: 'center'
      }}
    >
      {axis}: {value || '(перетащите поле)'}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState([]);
  const [chartCols, setChartCols] = useState({ x: '', y: '', hue: '', lat: '', lon: '' });
  const [chartType, setChartType] = useState('line');
  const [zoom, setZoom] = useState(1);

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();

    const finalize = json => {
      setData(json);
      const hasLon = json[0]?.longitude !== undefined;
      const hasLat = json[0]?.latitude !== undefined;
      setChartCols({
        x: '',
        y: '',
        hue: '',
        lon: hasLon ? 'longitude' : '',
        lat: hasLat ? 'latitude' : ''
      });
      setZoom(1);
    };

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: res => finalize(res.data)
      });
    } else if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const parsed = JSON.parse(evt.target.result);
          finalize(Array.isArray(parsed) ? parsed : []);
        } catch {
          alert('Невалидный JSON');
        }
      };
      reader.readAsText(file);
    } else if (['xlsx', 'xls'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = evt => {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: null });
        finalize(json);
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Поддерживаются только CSV, JSON и Excel (.xlsx/.xls)');
    }
  };

  const columns = useMemo(() => {
    if (!data.length) return { numeric: [], categorical: [] };
    const keys = Object.keys(data[0]);
    return {
      numeric: keys.filter(k => typeof data[0][k] === 'number'),
      categorical: keys.filter(k => typeof data[0][k] === 'string'),
    };
  }, [data]);

  const ChartRenderer = () => {
    const { x, y, hue, lat, lon } = chartCols;

    if (chartType === 'map') {
      if (!lat || !lon) return <p>Выберите Lon и Lat</p>;
      const mapData = data.map(row => {
        const la = parseFloat(row[lat]);
        const lo = parseFloat(row[lon]);
        return isNaN(la) || isNaN(lo)
          ? null
          : { lat: la, lon: lo, popupText: `${lat}: ${la}, ${lon}: ${lo}` };
      }).filter(Boolean);

      return (
        <div className="map-wrapper">
          <MapPlot
            data={mapData}
            center={[37.8, -96]}
            zoom={4}
            bounds={[[24.396308, -124.848974], [49.384358, -66.885444]]}
          />
        </div>
      );
    }

    if (!x || !y) return <p>Выберите X и Y</p>;

    const yVals = data.map(r => r[y]).filter(v => typeof v === 'number');
    const minY = Math.min(...yVals), maxY = Math.max(...yVals);
    const midY = (minY + maxY) / 2;
    const rangeY = (maxY - minY) / 2 / zoom;
    const domainY = [midY - rangeY, midY + rangeY];
    const common = { data, margin: { top: 20, right: 30, left: 20, bottom: 5 } };

    switch (chartType) {
      case 'line': {
        const cats = hue ? Array.from(new Set(data.map(r => r[hue]))) : [null];
        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#413ea0'];
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...common}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={x} />
              <YAxis domain={domainY} />
              <Tooltip />
              <Legend />
              {cats.map((cat, i) => (
                <Line
                  key={cat || 'single'}
                  data={cat ? data.filter(r => r[hue] === cat) : data}
                  type="monotone"
                  dataKey={y}
                  name={cat || y}
                  stroke={colors[i % colors.length]}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      }
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...common}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={x} />
              <YAxis domain={domainY} />
              <Tooltip />
              <Legend />
              <Bar dataKey={y} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart {...common}>
              <CartesianGrid />
              <XAxis dataKey={x} />
              <YAxis dataKey={y} domain={domainY} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={data} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        {/* SIDEBAR */}
        <div className="sidebar">
          <h4>1. Загрузить файл</h4>
          <input type="file" accept=".csv,.json,.xlsx" onChange={handleFile} />

          <h4 style={{ marginTop: 24 }}>2. Поля для графика</h4>
          <strong>Числовые (drag):</strong>
          {columns.numeric.map(c => <Field key={c} name={c} />)}

          <h4 style={{ marginTop: 24 }}>3. Настройка</h4>
          {chartType !== 'map' ? (
            <>
              <DropZone axis="X" value={chartCols.x} onDrop={(a, n) => setChartCols(c => ({ ...c, x: n }))} />
              <DropZone axis="Y" value={chartCols.y} onDrop={(a, n) => setChartCols(c => ({ ...c, y: n }))} />
            </>
          ) : (
            <>
              <DropZone axis="Lon" value={chartCols.lon} onDrop={(a, n) => setChartCols(c => ({ ...c, lon: n }))} />
              <DropZone axis="Lat" value={chartCols.lat} onDrop={(a, n) => setChartCols(c => ({ ...c, lat: n }))} />
            </>
          )}

          <h4 style={{ marginTop: 24 }}>4. Hue:</h4>
          <button onClick={() => setChartCols(c => ({ ...c, hue: '' }))}>None</button>
          {columns.categorical.map(cat => (
            <button
              key={cat}
              onClick={() => setChartCols(c => ({ ...c, hue: cat }))}
              style={{ marginLeft: 8 }}
            >
              {cat}
            </button>
          ))}

          <h4 style={{ marginTop: 24 }}>5. Zoom:</h4>
          <button onClick={() => setZoom(z => z * 1.2)}>Zoom In</button>
          <button onClick={() => setZoom(z => z / 1.2)} style={{ marginLeft: 8 }}>Zoom Out</button>

          <h4 style={{ marginTop: 24 }}>6. Тип графика:</h4>
          <select value={chartType} onChange={e => setChartType(e.target.value)}>
            <option value="line">Линейный</option>
            <option value="bar">Столбчатый</option>
            <option value="scatter">Точечный</option>
            <option value="map">Карта</option>
          </select>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content">
          <h2>График</h2>
          {ChartRenderer()}
        </div>
      </div>
    </DndProvider>
  );
}
