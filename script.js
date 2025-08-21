// Ваши данные
const pixarData = [
  { film: "Toy Story",      year: 1995, budget:  30000000, gross: 373554033 },
  { film: "A Bug's Life",   year: 1998, budget: 120000000, gross: 363258859 },
  { film: "Toy Story 2",    year: 1999, budget:  90000000, gross: 497366869 },
  { film: "Monsters, Inc.", year: 2001, budget: 115000000, gross: 577425734 },
  { film: "Finding Nemo",   year: 2003, budget:  94000000, gross: 940335536 },
  { film: "The Incredibles",year: 2004, budget:  92000000, gross: 631442092 },
  { film: "Cars",           year: 2006, budget: 120000000, gross: 461983149 },
  { film: "Ratatouille",    year: 2007, budget: 150000000, gross: 623726085 },
  { film: "WALL-E",         year: 2008, budget: 180000000, gross: 533316881 },
  { film: "Up",             year: 2009, budget: 175000000, gross: 735099082 }
];

// Функция форматирования чисел
const formatNumber = n =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// Настройки трёх слайдеров
const sliders = [
  { id: 'yearSlider',   minSpan: 'yearMinVal',   maxSpan: 'yearMaxVal',   toNumber: v=>+v },
  { id: 'grossSlider',  minSpan: 'grossMinVal',  maxSpan: 'grossMaxVal',  toNumber: v=>+v },
  { id: 'budgetSlider', minSpan: 'budgetMinVal', maxSpan: 'budgetMaxVal', toNumber: v=>+v }
];

let lineChart, barChart, scatterChart;
const filmSelect = document.getElementById("filmSelect");

// Заполняем селект фильмами
function populateFilmSelect() {
  pixarData.map(d => d.film)
    .forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      filmSelect.append(opt);
    });
}

// Инициализация одного dual-thumb слайдера
function setupSlider({ id, minSpan, maxSpan, toNumber }) {
  const container = document.getElementById(id);
  const [minInput, maxInput] = container.querySelectorAll('input[type=range]');
  const minLabel = document.getElementById(minSpan);
  const maxLabel = document.getElementById(maxSpan);

  function updateTrack() {
    let minVal = toNumber(minInput.value);
    let maxVal = toNumber(maxInput.value);
    if (minVal > maxVal) {
      [minInput.value, maxInput.value] = [maxInput.value, minInput.value];
      minVal = toNumber(minInput.value);
      maxVal = toNumber(maxInput.value);
    }
    const range = +minInput.max - +minInput.min;
    const p1 = ((minInput.value - minInput.min) / range) * 100;
    const p2 = ((maxInput.value - minInput.min) / range) * 100;

    const track = container.querySelector('.slider-track');
    track.style.setProperty('--left', `${p1}%`);
    track.style.setProperty('--right', `${100 - p2}%`);

    minLabel.textContent = formatNumber(minVal);
    maxLabel.textContent = formatNumber(maxVal);

    updateCharts();
  }

  [minInput, maxInput].forEach(i =>
    i.addEventListener('input', updateTrack)
  );
  updateTrack();
}

// Собираем фильтры и перерисовываем графики
function updateCharts() {
  const y = [...document.querySelectorAll('#yearSlider input')].map(i => +i.value);
  const g = [...document.querySelectorAll('#grossSlider input')].map(i => +i.value);
  const b = [...document.querySelectorAll('#budgetSlider input')].map(i => +i.value);
  const yMin = Math.min(...y), yMax = Math.max(...y);
  const gMin = Math.min(...g), gMax = Math.max(...g);
  const bMin = Math.min(...b), bMax = Math.max(...b);
  const sel  = filmSelect.value;

  let filtered = pixarData.filter(d =>
    d.year   >= yMin && d.year   <= yMax &&
    d.gross  >= gMin && d.gross  <= gMax &&
    d.budget >= bMin && d.budget <= bMax
  );
  if (sel !== "All") filtered = filtered.filter(d => d.film === sel);

  const years   = filtered.map(d => d.year);
  const grossV  = filtered.map(d => d.gross);
  const budgets = filtered.map(d => d.budget);
  const names   = filtered.map(d => d.film);

  [lineChart, barChart, scatterChart].forEach(c => c && c.destroy());

  lineChart = new Chart(
    document.getElementById('lineChart').getContext('2d'),
    {
      type: 'line',
      data: { labels: years, datasets: [{
        label: 'Worldwide Gross',
        data: grossV,
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54,162,235,0.2)',
        tension: 0.4,
        pointRadius: 5
      }]},
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Year' } },
          y: { title: { display: true, text: 'Gross ($)' } }
        }
      }
    }
  );

  barChart = new Chart(
    document.getElementById('barChart').getContext('2d'),
    {
      type: 'bar',
      data: { labels: names, datasets: [{
        label: 'Budget ($)',
        data: budgets,
        backgroundColor: '#FF6384'
      }]},
      options: {
        responsive: true,
        indexAxis: 'y',
        scales: {
          x: { title: { display: true, text: 'Budget ($)' } },
          y: { title: { display: true, text: 'Film' } }
        }
      }
    }
  );

  scatterChart = new Chart(
    document.getElementById('scatterChart').getContext('2d'),
    {
      type: 'scatter',
      data: { datasets: [{
        label: 'Budget vs Gross',
        data: filtered.map(d => ({ x: d.budget, y: d.gross })),
        pointRadius: 6
      }]},
      options: {
        responsive: true,
        scales: {
          x: { min: 0, title: { display: true, text: 'Budget ($)' } },
          y: { min: 0, title: { display: true, text: 'Gross ($)' } }
        },
        animation: {
          x: { from: 0, easing: 'easeOutQuad' },
          y: { from: 0, easing: 'easeOutQuad' }
        }
      }
    }
  );
}

// Запуск
populateFilmSelect();
sliders.forEach(s => setupSlider(s));
filmSelect.addEventListener('input', updateCharts);
updateCharts();
