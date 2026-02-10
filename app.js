// === Infographic Maker Application ===

(function () {
  'use strict';

  // ── State ──
  const state = {
    canvas: { width: 800, height: 1200, bg: '#ffffff' },
    elements: [],
    selectedId: null,
    nextId: 1,
    zoom: 1,
    undoStack: [],
    redoStack: [],
    drag: null,
    resize: null,
  };

  // ── DOM refs ──
  const $ = (sel) => document.querySelector(sel);
  const canvas = $('#canvas');
  const canvasWrapper = $('#canvas-wrapper');
  const canvasScroll = $('#canvas-scroll');
  const propsContent = $('#props-content');
  const elementPropsPanel = $('#element-props');
  const canvasPropsPanel = $('#canvas-props');

  // ── Icons library ──
  const ICONS = [
    '&#9733;', '&#9829;', '&#9728;', '&#9730;', '&#9742;',
    '&#9998;', '&#10004;', '&#10006;', '&#10010;', '&#9654;',
    '&#9660;', '&#9650;', '&#9664;', '&#128161;', '&#128640;',
    '&#128200;', '&#128176;', '&#128736;', '&#128187;', '&#127919;',
    '&#9889;', '&#128274;', '&#128269;', '&#127891;', '&#128241;',
    '&#9971;', '&#128293;', '&#128640;', '&#127775;', '&#128170;',
  ];

  // ── Templates ──
  const TEMPLATES = [
    {
      name: 'Statistics',
      bg: '#1B2838',
      preview: { bg: '#1B2838', accent: '#00D4AA' },
      elements: [
        { type: 'rect', x: 0, y: 0, w: 800, h: 200, fill: '#00D4AA', stroke: 'transparent', radius: 0, opacity: 1 },
        { type: 'heading', x: 80, y: 50, w: 640, h: 60, text: 'KEY STATISTICS 2025', fontSize: 42, fontFamily: 'Montserrat', fontWeight: '900', color: '#1B2838', align: 'center' },
        { type: 'text', x: 80, y: 120, w: 640, h: 30, text: 'Important numbers you should know', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', color: '#1B2838', align: 'center' },
        { type: 'number', x: 60, y: 260, w: 200, h: 100, text: '87%', label: 'Growth Rate', fontSize: 56, fontFamily: 'Montserrat', fontWeight: '900', color: '#00D4AA', align: 'center' },
        { type: 'number', x: 300, y: 260, w: 200, h: 100, text: '2.4M', label: 'Active Users', fontSize: 56, fontFamily: 'Montserrat', fontWeight: '900', color: '#00D4AA', align: 'center' },
        { type: 'number', x: 540, y: 260, w: 200, h: 100, text: '150+', label: 'Countries', fontSize: 56, fontFamily: 'Montserrat', fontWeight: '900', color: '#00D4AA', align: 'center' },
        { type: 'divider', x: 80, y: 420, w: 640, h: 4, fill: '#00D4AA', opacity: 0.3 },
        { type: 'bar-chart', x: 80, y: 470, w: 640, h: 300, data: [{ label: 'Q1', value: 65 }, { label: 'Q2', value: 80 }, { label: 'Q3', value: 72 }, { label: 'Q4', value: 95 }], barColor: '#00D4AA', labelColor: '#ffffff', bgColor: 'transparent' },
        { type: 'divider', x: 80, y: 810, w: 640, h: 4, fill: '#00D4AA', opacity: 0.3 },
        { type: 'progress', x: 80, y: 860, w: 640, h: 40, value: 75, label: 'Customer Satisfaction', barColor: '#00D4AA', trackColor: '#2a3f55', labelColor: '#ffffff' },
        { type: 'progress', x: 80, y: 930, w: 640, h: 40, value: 90, label: 'Revenue Target', barColor: '#00D4AA', trackColor: '#2a3f55', labelColor: '#ffffff' },
        { type: 'progress', x: 80, y: 1000, w: 640, h: 40, value: 60, label: 'Market Share', barColor: '#00D4AA', trackColor: '#2a3f55', labelColor: '#ffffff' },
        { type: 'text', x: 80, y: 1100, w: 640, h: 30, text: 'Source: Annual Report 2025 | yourcompany.com', fontSize: 12, fontFamily: 'Inter', fontWeight: '400', color: '#667788', align: 'center' },
      ]
    },
    {
      name: 'Process',
      bg: '#F7F3EE',
      preview: { bg: '#F7F3EE', accent: '#E85D3A' },
      elements: [
        { type: 'heading', x: 80, y: 60, w: 640, h: 60, text: 'HOW IT WORKS', fontSize: 44, fontFamily: 'Playfair Display', fontWeight: '900', color: '#2C2C2C', align: 'center' },
        { type: 'divider', x: 350, y: 140, w: 100, h: 4, fill: '#E85D3A', opacity: 1 },
        { type: 'text', x: 100, y: 170, w: 600, h: 40, text: 'A simple guide to getting started with our platform', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', color: '#666666', align: 'center' },
        ...[1, 2, 3, 4].map((n, i) => ([
          { type: 'circle', x: 100, y: 260 + i * 210, w: 70, h: 70, fill: '#E85D3A', stroke: 'transparent', opacity: 1 },
          { type: 'heading', x: 112, y: 275 + i * 210, w: 46, h: 40, text: String(n), fontSize: 32, fontFamily: 'Montserrat', fontWeight: '800', color: '#ffffff', align: 'center' },
          { type: 'heading', x: 200, y: 265 + i * 210, w: 500, h: 35, text: ['Sign Up', 'Configure', 'Launch', 'Analyze'][i], fontSize: 26, fontFamily: 'Montserrat', fontWeight: '700', color: '#2C2C2C', align: 'left' },
          { type: 'text', x: 200, y: 305 + i * 210, w: 500, h: 40, text: ['Create your account in just a few clicks', 'Customize settings to match your needs', 'Deploy your project with one click', 'Track results with powerful analytics'][i], fontSize: 14, fontFamily: 'Inter', fontWeight: '400', color: '#666666', align: 'left' },
        ])).flat(),
        { type: 'rect', x: 150, y: 1100, w: 500, h: 56, fill: '#E85D3A', stroke: 'transparent', radius: 28, opacity: 1 },
        { type: 'heading', x: 150, y: 1112, w: 500, h: 32, text: 'Get Started Today', fontSize: 20, fontFamily: 'Montserrat', fontWeight: '700', color: '#ffffff', align: 'center' },
      ]
    },
    {
      name: 'Comparison',
      bg: '#0D1B2A',
      preview: { bg: '#0D1B2A', accent: '#FFB703' },
      elements: [
        { type: 'heading', x: 80, y: 50, w: 640, h: 55, text: 'PLAN COMPARISON', fontSize: 38, fontFamily: 'Montserrat', fontWeight: '900', color: '#ffffff', align: 'center' },
        { type: 'text', x: 80, y: 115, w: 640, h: 30, text: 'Choose the plan that fits your needs', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', color: '#8899aa', align: 'center' },
        // Basic plan
        { type: 'rect', x: 50, y: 180, w: 220, h: 450, fill: '#1B2D45', stroke: '#2a3f55', radius: 12, opacity: 1 },
        { type: 'heading', x: 50, y: 210, w: 220, h: 30, text: 'Basic', fontSize: 22, fontFamily: 'Montserrat', fontWeight: '700', color: '#8899aa', align: 'center' },
        { type: 'number', x: 50, y: 255, w: 220, h: 50, text: '$9', label: '/month', fontSize: 44, fontFamily: 'Montserrat', fontWeight: '900', color: '#ffffff', align: 'center' },
        { type: 'text', x: 70, y: 340, w: 180, h: 250, text: '5 Projects\n10GB Storage\nEmail Support\nBasic Analytics\nAPI Access', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', color: '#aabbcc', align: 'center' },
        // Pro plan (highlighted)
        { type: 'rect', x: 290, y: 170, w: 220, h: 470, fill: '#FFB703', stroke: 'transparent', radius: 12, opacity: 1 },
        { type: 'heading', x: 290, y: 195, w: 220, h: 30, text: 'Pro', fontSize: 22, fontFamily: 'Montserrat', fontWeight: '700', color: '#0D1B2A', align: 'center' },
        { type: 'number', x: 290, y: 240, w: 220, h: 50, text: '$29', label: '/month', fontSize: 44, fontFamily: 'Montserrat', fontWeight: '900', color: '#0D1B2A', align: 'center' },
        { type: 'text', x: 310, y: 330, w: 180, h: 270, text: '25 Projects\n100GB Storage\nPriority Support\nAdvanced Analytics\nFull API Access\nCustom Domains', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', color: '#0D1B2A', align: 'center' },
        // Enterprise plan
        { type: 'rect', x: 530, y: 180, w: 220, h: 450, fill: '#1B2D45', stroke: '#2a3f55', radius: 12, opacity: 1 },
        { type: 'heading', x: 530, y: 210, w: 220, h: 30, text: 'Enterprise', fontSize: 22, fontFamily: 'Montserrat', fontWeight: '700', color: '#8899aa', align: 'center' },
        { type: 'number', x: 530, y: 255, w: 220, h: 50, text: '$99', label: '/month', fontSize: 44, fontFamily: 'Montserrat', fontWeight: '900', color: '#ffffff', align: 'center' },
        { type: 'text', x: 550, y: 340, w: 180, h: 250, text: 'Unlimited Projects\n1TB Storage\n24/7 Support\nCustom Analytics\nDedicated API\nSSO & SAML', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', color: '#aabbcc', align: 'center' },
        // Pie chart
        { type: 'pie-chart', x: 150, y: 700, w: 500, h: 400, data: [{ label: 'Basic', value: 30 }, { label: 'Pro', value: 50 }, { label: 'Enterprise', value: 20 }], colors: ['#1B2D45', '#FFB703', '#E85D3A'], labelColor: '#ffffff', bgColor: 'transparent' },
        { type: 'text', x: 80, y: 1130, w: 640, h: 25, text: 'All plans include a 14-day free trial', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', color: '#667788', align: 'center' },
      ]
    },
    {
      name: 'Timeline',
      bg: '#FFFFFF',
      preview: { bg: '#FFFFFF', accent: '#6C63FF' },
      elements: [
        { type: 'rect', x: 0, y: 0, w: 800, h: 160, fill: '#6C63FF', stroke: 'transparent', radius: 0, opacity: 1 },
        { type: 'heading', x: 80, y: 40, w: 640, h: 55, text: 'PROJECT TIMELINE', fontSize: 40, fontFamily: 'Montserrat', fontWeight: '900', color: '#ffffff', align: 'center' },
        { type: 'text', x: 80, y: 105, w: 640, h: 25, text: '2025 Roadmap & Key Milestones', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', color: 'rgba(255,255,255,0.8)', align: 'center' },
        // Timeline line
        { type: 'line', x: 399, y: 200, w: 2, h: 880, fill: '#6C63FF', opacity: 0.3 },
        // Milestones alternating left/right
        ...[
          { q: 'Q1 JAN', title: 'Research Phase', desc: 'User interviews, market analysis, and competitive audit' },
          { q: 'Q1 MAR', title: 'Design Sprint', desc: 'Wireframes, prototypes, and user testing' },
          { q: 'Q2 MAY', title: 'Development', desc: 'Core feature build, backend infrastructure' },
          { q: 'Q3 AUG', title: 'Beta Launch', desc: 'Closed beta with 500 early adopters' },
          { q: 'Q4 NOV', title: 'Public Launch', desc: 'Full product launch and marketing campaign' },
        ].map((m, i) => {
          const left = i % 2 === 0;
          const yOff = 220 + i * 175;
          return [
            { type: 'circle', x: 385, y: yOff, w: 30, h: 30, fill: '#6C63FF', stroke: '#ffffff', opacity: 1 },
            { type: 'heading', x: left ? 80 : 440, y: yOff - 5, w: 280, h: 25, text: m.q, fontSize: 12, fontFamily: 'Montserrat', fontWeight: '700', color: '#6C63FF', align: left ? 'right' : 'left' },
            { type: 'heading', x: left ? 80 : 440, y: yOff + 22, w: 280, h: 30, text: m.title, fontSize: 22, fontFamily: 'Montserrat', fontWeight: '700', color: '#2C2C2C', align: left ? 'right' : 'left' },
            { type: 'text', x: left ? 80 : 440, y: yOff + 56, w: 280, h: 40, text: m.desc, fontSize: 13, fontFamily: 'Inter', fontWeight: '400', color: '#666666', align: left ? 'right' : 'left' },
          ];
        }).flat(),
      ]
    },
  ];

  // ── Utility ──
  function uid() { return state.nextId++; }

  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

  function snapshot() {
    state.undoStack.push(JSON.stringify(state.elements));
    if (state.undoStack.length > 50) state.undoStack.shift();
    state.redoStack = [];
  }

  function undo() {
    if (!state.undoStack.length) return;
    state.redoStack.push(JSON.stringify(state.elements));
    state.elements = JSON.parse(state.undoStack.pop());
    state.selectedId = null;
    render();
  }

  function redo() {
    if (!state.redoStack.length) return;
    state.undoStack.push(JSON.stringify(state.elements));
    state.elements = JSON.parse(state.redoStack.pop());
    state.selectedId = null;
    render();
  }

  function getEl(id) { return state.elements.find(e => e.id === id); }
  function selectedEl() { return getEl(state.selectedId); }

  // ── Canvas sizing ──
  function applyCanvasSize() {
    canvas.style.width = state.canvas.width + 'px';
    canvas.style.height = state.canvas.height + 'px';
    canvas.style.background = state.canvas.bg;
  }

  function applyZoom() {
    canvasWrapper.style.transform = `scale(${state.zoom})`;
    $('#zoom-level').textContent = Math.round(state.zoom * 100) + '%';
  }

  // ── Render elements ──
  function render() {
    canvas.innerHTML = '';
    const sorted = [...state.elements].sort((a, b) => a.z - b.z);
    sorted.forEach(el => {
      const dom = createElement(el);
      if (dom) canvas.appendChild(dom);
    });
    updatePropsPanel();
  }

  function createElement(el) {
    const div = document.createElement('div');
    div.className = 'canvas-element' + (el.id === state.selectedId ? ' selected' : '');
    div.dataset.id = el.id;
    div.style.left = el.x + 'px';
    div.style.top = el.y + 'px';
    div.style.width = el.w + 'px';
    div.style.height = el.h + 'px';
    div.style.opacity = el.opacity ?? 1;

    switch (el.type) {
      case 'heading':
      case 'text':
        div.style.fontSize = el.fontSize + 'px';
        div.style.fontFamily = el.fontFamily || 'Inter';
        div.style.fontWeight = el.fontWeight || '400';
        div.style.color = el.color || '#000000';
        div.style.textAlign = el.align || 'left';
        div.style.lineHeight = '1.3';
        div.style.overflow = 'hidden';
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.textContent = el.text;
        break;

      case 'number': {
        div.style.textAlign = el.align || 'center';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center';
        div.style.justifyContent = 'center';
        const numSpan = document.createElement('span');
        numSpan.textContent = el.text;
        numSpan.style.fontSize = el.fontSize + 'px';
        numSpan.style.fontFamily = el.fontFamily || 'Montserrat';
        numSpan.style.fontWeight = el.fontWeight || '800';
        numSpan.style.color = el.color || '#000';
        numSpan.style.lineHeight = '1';
        div.appendChild(numSpan);
        if (el.label) {
          const lbl = document.createElement('span');
          lbl.textContent = el.label;
          lbl.style.fontSize = Math.max(11, el.fontSize * 0.3) + 'px';
          lbl.style.color = el.color || '#000';
          lbl.style.opacity = '0.6';
          lbl.style.fontFamily = el.fontFamily || 'Inter';
          lbl.style.marginTop = '4px';
          div.appendChild(lbl);
        }
        break;
      }

      case 'rect':
        div.style.background = el.fill || '#cccccc';
        div.style.border = el.stroke && el.stroke !== 'transparent' ? `2px solid ${el.stroke}` : 'none';
        div.style.borderRadius = (el.radius || 0) + 'px';
        break;

      case 'circle':
        div.style.background = el.fill || '#cccccc';
        div.style.borderRadius = '50%';
        div.style.border = el.stroke && el.stroke !== 'transparent' ? `2px solid ${el.stroke}` : 'none';
        break;

      case 'line':
        div.style.background = el.fill || '#000000';
        if (el.w > el.h) {
          div.style.height = Math.max(el.h, 2) + 'px';
        } else {
          div.style.width = Math.max(el.w, 2) + 'px';
        }
        break;

      case 'divider':
        div.style.background = el.fill || '#cccccc';
        break;

      case 'icon':
        div.innerHTML = el.icon || '&#9733;';
        div.style.fontSize = el.fontSize + 'px';
        div.style.color = el.color || '#000';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        break;

      case 'image':
        if (el.src) {
          const img = document.createElement('img');
          img.src = el.src;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = el.objectFit || 'cover';
          img.style.borderRadius = (el.radius || 0) + 'px';
          img.draggable = false;
          div.appendChild(img);
        } else {
          div.style.background = '#ddd';
          div.style.display = 'flex';
          div.style.alignItems = 'center';
          div.style.justifyContent = 'center';
          div.style.color = '#999';
          div.style.fontSize = '14px';
          div.textContent = 'Click to upload image';
        }
        break;

      case 'bar-chart':
        renderBarChart(div, el);
        break;

      case 'pie-chart':
        renderPieChart(div, el);
        break;

      case 'progress':
        renderProgress(div, el);
        break;
    }

    // Resize handles when selected
    if (el.id === state.selectedId) {
      ['nw', 'ne', 'sw', 'se'].forEach(pos => {
        const h = document.createElement('div');
        h.className = 'resize-handle ' + pos;
        h.dataset.handle = pos;
        div.appendChild(h);
      });
    }

    return div;
  }

  // ── Chart renderers ──
  function renderBarChart(div, el) {
    const data = el.data || [];
    if (!data.length) return;
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barWidth = Math.floor((el.w - 40) / data.length) - 10;
    const chartHeight = el.h - 40;

    div.style.padding = '10px';
    div.style.background = el.bgColor || 'transparent';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', el.w - 20);
    svg.setAttribute('height', el.h - 20);
    svg.style.overflow = 'visible';

    data.forEach((d, i) => {
      const barH = (d.value / maxVal) * (chartHeight - 30);
      const x = 10 + i * (barWidth + 10);
      const y = chartHeight - barH;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', barH);
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', el.barColor || '#00D4AA');
      svg.appendChild(rect);

      // Value label
      const valText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      valText.setAttribute('x', x + barWidth / 2);
      valText.setAttribute('y', y - 6);
      valText.setAttribute('text-anchor', 'middle');
      valText.setAttribute('fill', el.labelColor || '#ffffff');
      valText.setAttribute('font-size', '12');
      valText.setAttribute('font-family', 'Inter');
      valText.setAttribute('font-weight', '600');
      valText.textContent = d.value;
      svg.appendChild(valText);

      // Category label
      const catText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      catText.setAttribute('x', x + barWidth / 2);
      catText.setAttribute('y', chartHeight + 16);
      catText.setAttribute('text-anchor', 'middle');
      catText.setAttribute('fill', el.labelColor || '#ffffff');
      catText.setAttribute('font-size', '11');
      catText.setAttribute('font-family', 'Inter');
      catText.textContent = d.label;
      svg.appendChild(catText);
    });

    div.appendChild(svg);
  }

  function renderPieChart(div, el) {
    const data = el.data || [];
    if (!data.length) return;
    const total = data.reduce((s, d) => s + d.value, 0);
    if (!total) return;

    const size = Math.min(el.w, el.h) - 20;
    const cx = el.w / 2;
    const cy = (el.h - 40) / 2;
    const r = size / 2 - 10;
    const colors = el.colors || ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

    div.style.background = el.bgColor || 'transparent';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', el.w);
    svg.setAttribute('height', el.h);

    let angle = -Math.PI / 2;
    data.forEach((d, i) => {
      const sweep = (d.value / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(angle + sweep);
      const y2 = cy + r * Math.sin(angle + sweep);
      const large = sweep > Math.PI ? 1 : 0;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`);
      path.setAttribute('fill', colors[i % colors.length]);
      svg.appendChild(path);

      // Label
      const midAngle = angle + sweep / 2;
      const lx = cx + (r * 0.65) * Math.cos(midAngle);
      const ly = cy + (r * 0.65) * Math.sin(midAngle);
      const pct = Math.round((d.value / total) * 100);
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', lx);
      text.setAttribute('y', ly);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', '#ffffff');
      text.setAttribute('font-size', '13');
      text.setAttribute('font-weight', '700');
      text.setAttribute('font-family', 'Inter');
      text.textContent = pct + '%';
      svg.appendChild(text);

      angle += sweep;
    });

    // Legend
    data.forEach((d, i) => {
      const ly = el.h - 30 + (i * 0) ; // single-row legend
      const lx = 20 + i * (el.w / data.length);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', lx);
      rect.setAttribute('y', el.h - 28);
      rect.setAttribute('width', 10);
      rect.setAttribute('height', 10);
      rect.setAttribute('rx', 2);
      rect.setAttribute('fill', colors[i % colors.length]);
      svg.appendChild(rect);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', lx + 15);
      text.setAttribute('y', el.h - 19);
      text.setAttribute('fill', el.labelColor || '#ffffff');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-family', 'Inter');
      text.textContent = d.label;
      svg.appendChild(text);
    });

    div.appendChild(svg);
  }

  function renderProgress(div, el) {
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.justifyContent = 'center';
    div.style.gap = '4px';

    if (el.label) {
      const lbl = document.createElement('div');
      lbl.style.display = 'flex';
      lbl.style.justifyContent = 'space-between';
      lbl.style.fontSize = '12px';
      lbl.style.fontFamily = 'Inter';
      lbl.style.color = el.labelColor || '#ffffff';

      const name = document.createElement('span');
      name.textContent = el.label;
      name.style.fontWeight = '600';
      lbl.appendChild(name);

      const pct = document.createElement('span');
      pct.textContent = (el.value || 0) + '%';
      pct.style.opacity = '0.7';
      lbl.appendChild(pct);

      div.appendChild(lbl);
    }

    const track = document.createElement('div');
    track.style.width = '100%';
    track.style.height = '10px';
    track.style.borderRadius = '5px';
    track.style.background = el.trackColor || '#333';
    track.style.overflow = 'hidden';

    const bar = document.createElement('div');
    bar.style.width = clamp(el.value || 0, 0, 100) + '%';
    bar.style.height = '100%';
    bar.style.borderRadius = '5px';
    bar.style.background = el.barColor || '#00D4AA';
    bar.style.transition = 'width 0.3s';
    track.appendChild(bar);

    div.appendChild(track);
  }

  // ── Element factory ──
  function addElement(type, overrides) {
    snapshot();
    const defaults = {
      id: uid(),
      type,
      x: 100,
      y: 100,
      w: 200,
      h: 50,
      z: state.elements.length,
      opacity: 1,
    };

    const typeDefaults = {
      heading: { w: 400, h: 60, text: 'Heading', fontSize: 36, fontFamily: 'Montserrat', fontWeight: '800', color: '#000000', align: 'center' },
      text: { w: 300, h: 60, text: 'Type your text here. Edit in the properties panel on the right.', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', color: '#333333', align: 'left' },
      number: { w: 180, h: 100, text: '100', label: 'Label', fontSize: 56, fontFamily: 'Montserrat', fontWeight: '900', color: '#E94560', align: 'center' },
      rect: { w: 200, h: 150, fill: '#E94560', stroke: 'transparent', radius: 8 },
      circle: { w: 120, h: 120, fill: '#6C63FF', stroke: 'transparent' },
      line: { w: 200, h: 3, fill: '#333333' },
      divider: { w: 400, h: 3, fill: '#cccccc' },
      icon: { w: 80, h: 80, icon: '&#9733;', fontSize: 48, color: '#E94560' },
      image: { w: 250, h: 200, src: '', objectFit: 'cover', radius: 0 },
      'bar-chart': { w: 400, h: 260, data: [{ label: 'A', value: 40 }, { label: 'B', value: 70 }, { label: 'C', value: 55 }, { label: 'D', value: 90 }], barColor: '#E94560', labelColor: '#333333', bgColor: 'transparent' },
      'pie-chart': { w: 350, h: 300, data: [{ label: 'Cat A', value: 40 }, { label: 'Cat B', value: 30 }, { label: 'Cat C', value: 30 }], colors: ['#E94560', '#6C63FF', '#FFB703', '#00D4AA'], labelColor: '#333333', bgColor: 'transparent' },
      progress: { w: 400, h: 45, value: 65, label: 'Progress', barColor: '#E94560', trackColor: '#e0e0e0', labelColor: '#333333' },
    };

    const el = { ...defaults, ...(typeDefaults[type] || {}), ...overrides };
    state.elements.push(el);
    state.selectedId = el.id;
    render();
    return el;
  }

  // ── Properties panel ──
  function updatePropsPanel() {
    const el = selectedEl();
    if (!el) {
      elementPropsPanel.style.display = 'none';
      canvasPropsPanel.style.display = '';
      return;
    }
    canvasPropsPanel.style.display = 'none';
    elementPropsPanel.style.display = '';

    let html = '';

    // Position
    html += `
      <div class="prop-row">
        <div class="prop-group"><label>X</label><input type="number" data-prop="x" value="${el.x}"></div>
        <div class="prop-group"><label>Y</label><input type="number" data-prop="y" value="${el.y}"></div>
      </div>
      <div class="prop-row">
        <div class="prop-group"><label>Width</label><input type="number" data-prop="w" value="${el.w}" min="10"></div>
        <div class="prop-group"><label>Height</label><input type="number" data-prop="h" value="${el.h}" min="10"></div>
      </div>
      <div class="prop-group"><label>Opacity</label><input type="range" data-prop="opacity" min="0" max="1" step="0.05" value="${el.opacity ?? 1}"></div>
    `;

    // Type-specific props
    if (['heading', 'text'].includes(el.type)) {
      html += textProps(el);
    } else if (el.type === 'number') {
      html += textProps(el);
      html += `<div class="prop-group"><label>Label</label><input type="text" data-prop="label" value="${esc(el.label || '')}"></div>`;
    } else if (el.type === 'rect') {
      html += shapeProps(el);
      html += `<div class="prop-group"><label>Corner Radius</label><input type="number" data-prop="radius" value="${el.radius || 0}" min="0"></div>`;
    } else if (el.type === 'circle') {
      html += shapeProps(el);
    } else if (el.type === 'line' || el.type === 'divider') {
      html += `<div class="prop-group"><label>Color</label><input type="color" data-prop="fill" value="${el.fill || '#000000'}"></div>`;
    } else if (el.type === 'icon') {
      html += `
        <div class="prop-group"><label>Size</label><input type="number" data-prop="fontSize" value="${el.fontSize}" min="10" max="200"></div>
        <div class="prop-group"><label>Color</label><input type="color" data-prop="color" value="${el.color || '#000000'}"></div>
      `;
    } else if (el.type === 'image') {
      html += `
        <div class="prop-group"><label>Image</label><button class="btn btn-small" id="btn-change-image">Upload Image</button></div>
        <div class="prop-group"><label>Fit</label>
          <select data-prop="objectFit">
            <option value="cover"${el.objectFit === 'cover' ? ' selected' : ''}>Cover</option>
            <option value="contain"${el.objectFit === 'contain' ? ' selected' : ''}>Contain</option>
            <option value="fill"${el.objectFit === 'fill' ? ' selected' : ''}>Fill</option>
          </select>
        </div>
        <div class="prop-group"><label>Corner Radius</label><input type="number" data-prop="radius" value="${el.radius || 0}" min="0"></div>
      `;
    } else if (el.type === 'bar-chart') {
      html += chartDataProps(el, 'bar');
      html += `
        <div class="prop-group"><label>Bar Color</label><input type="color" data-prop="barColor" value="${el.barColor || '#E94560'}"></div>
        <div class="prop-group"><label>Label Color</label><input type="color" data-prop="labelColor" value="${el.labelColor || '#333333'}"></div>
      `;
    } else if (el.type === 'pie-chart') {
      html += chartDataProps(el, 'pie');
      html += `<div class="prop-group"><label>Label Color</label><input type="color" data-prop="labelColor" value="${el.labelColor || '#333333'}"></div>`;
    } else if (el.type === 'progress') {
      html += `
        <div class="prop-group"><label>Value (%)</label><input type="number" data-prop="value" value="${el.value || 0}" min="0" max="100"></div>
        <div class="prop-group"><label>Label</label><input type="text" data-prop="label" value="${esc(el.label || '')}"></div>
        <div class="prop-group"><label>Bar Color</label><input type="color" data-prop="barColor" value="${el.barColor || '#E94560'}"></div>
        <div class="prop-group"><label>Track Color</label><input type="color" data-prop="trackColor" value="${el.trackColor || '#e0e0e0'}"></div>
        <div class="prop-group"><label>Label Color</label><input type="color" data-prop="labelColor" value="${el.labelColor || '#333333'}"></div>
      `;
    }

    propsContent.innerHTML = html;
    bindPropInputs();
  }

  function textProps(el) {
    return `
      <div class="prop-group"><label>Text</label><textarea data-prop="text" rows="3">${esc(el.text)}</textarea></div>
      <div class="prop-group"><label>Font Size</label><input type="number" data-prop="fontSize" value="${el.fontSize}" min="8" max="200"></div>
      <div class="prop-group"><label>Font</label>
        <select data-prop="fontFamily">
          ${['Inter', 'Montserrat', 'Poppins', 'Playfair Display', 'Roboto Slab'].map(f =>
            `<option value="${f}"${el.fontFamily === f ? ' selected' : ''}>${f}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-group"><label>Weight</label>
        <select data-prop="fontWeight">
          ${['400', '500', '600', '700', '800', '900'].map(w =>
            `<option value="${w}"${el.fontWeight === w ? ' selected' : ''}>${w}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-group"><label>Color</label><input type="color" data-prop="color" value="${el.color || '#000000'}"></div>
      <div class="prop-group"><label>Align</label>
        <select data-prop="align">
          <option value="left"${el.align === 'left' ? ' selected' : ''}>Left</option>
          <option value="center"${el.align === 'center' ? ' selected' : ''}>Center</option>
          <option value="right"${el.align === 'right' ? ' selected' : ''}>Right</option>
        </select>
      </div>
    `;
  }

  function shapeProps(el) {
    return `
      <div class="prop-group"><label>Fill</label><input type="color" data-prop="fill" value="${el.fill || '#cccccc'}"></div>
      <div class="prop-group"><label>Stroke</label><input type="color" data-prop="stroke" value="${el.stroke || '#000000'}"></div>
    `;
  }

  function chartDataProps(el, chartType) {
    const data = el.data || [];
    let html = '<div class="prop-group"><label>Data</label><div class="data-entry">';
    data.forEach((d, i) => {
      html += `
        <div class="data-row">
          <input type="text" data-chart-label="${i}" value="${esc(d.label)}" placeholder="Label">
          <input type="number" data-chart-value="${i}" value="${d.value}" placeholder="Value" min="0">
          ${chartType === 'pie' ? `<input type="color" data-chart-color="${i}" value="${(el.colors || [])[i] || '#E94560'}">` : ''}
          <button class="btn-remove-row" data-remove-row="${i}">&times;</button>
        </div>`;
    });
    html += `</div><button class="btn btn-small btn-add-row" data-add-row="${chartType}">+ Add</button></div>`;
    return html;
  }

  function esc(s) { return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  function bindPropInputs() {
    propsContent.querySelectorAll('[data-prop]').forEach(input => {
      const event = input.type === 'range' || input.type === 'color' ? 'input' : 'change';
      input.addEventListener(event, () => {
        const el = selectedEl();
        if (!el) return;
        snapshot();
        const prop = input.dataset.prop;
        let val = input.value;
        if (input.type === 'number' || input.type === 'range') val = parseFloat(val);
        el[prop] = val;
        render();
      });
    });

    // Chart data bindings
    propsContent.querySelectorAll('[data-chart-label]').forEach(input => {
      input.addEventListener('change', () => {
        const el = selectedEl();
        if (!el) return;
        snapshot();
        el.data[parseInt(input.dataset.chartLabel)].label = input.value;
        render();
      });
    });
    propsContent.querySelectorAll('[data-chart-value]').forEach(input => {
      input.addEventListener('change', () => {
        const el = selectedEl();
        if (!el) return;
        snapshot();
        el.data[parseInt(input.dataset.chartValue)].value = parseFloat(input.value) || 0;
        render();
      });
    });
    propsContent.querySelectorAll('[data-chart-color]').forEach(input => {
      input.addEventListener('input', () => {
        const el = selectedEl();
        if (!el) return;
        snapshot();
        if (!el.colors) el.colors = [];
        el.colors[parseInt(input.dataset.chartColor)] = input.value;
        render();
      });
    });
    propsContent.querySelectorAll('[data-remove-row]').forEach(btn => {
      btn.addEventListener('click', () => {
        const el = selectedEl();
        if (!el || el.data.length <= 1) return;
        snapshot();
        const idx = parseInt(btn.dataset.removeRow);
        el.data.splice(idx, 1);
        if (el.colors) el.colors.splice(idx, 1);
        render();
      });
    });
    propsContent.querySelectorAll('[data-add-row]').forEach(btn => {
      btn.addEventListener('click', () => {
        const el = selectedEl();
        if (!el) return;
        snapshot();
        el.data.push({ label: 'New', value: 50 });
        if (el.colors) el.colors.push('#999999');
        render();
      });
    });

    // Image upload button
    const imgBtn = propsContent.querySelector('#btn-change-image');
    if (imgBtn) {
      imgBtn.addEventListener('click', () => {
        document.getElementById('image-upload').click();
      });
    }
  }

  // ── Drag and Drop ──
  canvas.addEventListener('mousedown', (e) => {
    const handle = e.target.closest('.resize-handle');
    const elDom = e.target.closest('.canvas-element');

    if (handle && state.selectedId) {
      // Start resize
      const el = selectedEl();
      state.resize = {
        handle: handle.dataset.handle,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        origW: el.w,
        origH: el.h,
      };
      snapshot();
      e.preventDefault();
      return;
    }

    if (elDom) {
      const id = parseInt(elDom.dataset.id);
      state.selectedId = id;
      const el = getEl(id);

      // Handle image click for upload
      if (el.type === 'image' && !el.src) {
        document.getElementById('image-upload').click();
      }

      state.drag = {
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        moved: false,
      };
      render();
      e.preventDefault();
    } else {
      state.selectedId = null;
      render();
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (state.resize) {
      const el = selectedEl();
      if (!el) return;
      const dx = (e.clientX - state.resize.startX) / state.zoom;
      const dy = (e.clientY - state.resize.startY) / state.zoom;
      const h = state.resize.handle;

      if (h.includes('e')) el.w = Math.max(10, state.resize.origW + dx);
      if (h.includes('w')) {
        el.w = Math.max(10, state.resize.origW - dx);
        el.x = state.resize.origX + (state.resize.origW - el.w);
      }
      if (h.includes('s')) el.h = Math.max(10, state.resize.origH + dy);
      if (h.includes('n')) {
        el.h = Math.max(10, state.resize.origH - dy);
        el.y = state.resize.origY + (state.resize.origH - el.h);
      }
      render();
    }

    if (state.drag) {
      const el = selectedEl();
      if (!el) return;
      const dx = (e.clientX - state.drag.startX) / state.zoom;
      const dy = (e.clientY - state.drag.startY) / state.zoom;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) state.drag.moved = true;
      el.x = Math.round(state.drag.origX + dx);
      el.y = Math.round(state.drag.origY + dy);
      render();
    }
  });

  document.addEventListener('mouseup', () => {
    if (state.drag && state.drag.moved) {
      snapshot();
    }
    state.drag = null;
    state.resize = null;
  });

  // ── Keyboard shortcuts ──
  document.addEventListener('keydown', (e) => {
    // Don't intercept when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelected();
      e.preventDefault();
    }
    if (e.ctrlKey && e.key === 'z') { undo(); e.preventDefault(); }
    if (e.ctrlKey && e.key === 'y') { redo(); e.preventDefault(); }
    if (e.ctrlKey && e.key === 'd') { duplicateSelected(); e.preventDefault(); }

    // Arrow key nudge
    const el = selectedEl();
    if (el && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      snapshot();
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowUp') el.y -= step;
      if (e.key === 'ArrowDown') el.y += step;
      if (e.key === 'ArrowLeft') el.x -= step;
      if (e.key === 'ArrowRight') el.x += step;
      render();
      e.preventDefault();
    }
  });

  function deleteSelected() {
    if (!state.selectedId) return;
    snapshot();
    state.elements = state.elements.filter(e => e.id !== state.selectedId);
    state.selectedId = null;
    render();
  }

  function duplicateSelected() {
    const el = selectedEl();
    if (!el) return;
    snapshot();
    const copy = { ...JSON.parse(JSON.stringify(el)), id: uid(), x: el.x + 20, y: el.y + 20, z: state.elements.length };
    state.elements.push(copy);
    state.selectedId = copy.id;
    render();
  }

  // ── Layer controls ──
  function bringToFront() {
    const el = selectedEl();
    if (!el) return;
    snapshot();
    const maxZ = Math.max(...state.elements.map(e => e.z));
    el.z = maxZ + 1;
    render();
  }

  function sendToBack() {
    const el = selectedEl();
    if (!el) return;
    snapshot();
    const minZ = Math.min(...state.elements.map(e => e.z));
    el.z = minZ - 1;
    render();
  }

  // ── Templates ──
  function applyTemplate(template) {
    snapshot();
    state.canvas.bg = template.bg;
    state.elements = [];
    state.selectedId = null;
    state.nextId = 1;
    template.elements.forEach(elDef => {
      const el = { ...elDef, id: uid(), z: state.elements.length, opacity: elDef.opacity ?? 1 };
      state.elements.push(el);
    });
    applyCanvasSize();
    $('#canvas-bg').value = template.bg;
    render();
  }

  function renderTemplates() {
    const container = $('#template-list');
    TEMPLATES.forEach((t, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'template-thumb';
      thumb.innerHTML = `
        <div class="template-thumb-inner" style="background:${t.preview.bg};">
          <div style="background:${t.preview.accent};height:25%;border-radius:2px;margin-bottom:4px;"></div>
          <div style="background:${t.preview.accent};opacity:0.3;height:8px;width:60%;margin:2px auto;border-radius:2px;"></div>
          <div style="background:${t.preview.accent};opacity:0.3;height:8px;width:40%;margin:2px auto;border-radius:2px;"></div>
          <div style="flex:1;display:flex;gap:3px;margin-top:6px;">
            <div style="flex:1;background:${t.preview.accent};opacity:0.5;border-radius:2px;"></div>
            <div style="flex:1;background:${t.preview.accent};opacity:0.5;border-radius:2px;"></div>
            <div style="flex:1;background:${t.preview.accent};opacity:0.5;border-radius:2px;"></div>
          </div>
        </div>
        <div class="template-name">${t.name}</div>`;
      thumb.addEventListener('click', () => applyTemplate(t));
      container.appendChild(thumb);
    });
  }

  function renderIcons() {
    const container = $('#icon-picker');
    ICONS.forEach(icon => {
      const item = document.createElement('div');
      item.className = 'icon-grid-item';
      item.innerHTML = icon;
      item.addEventListener('click', () => {
        addElement('icon', { icon, x: 200, y: 200 });
      });
      container.appendChild(item);
    });
  }

  // ── Export ──
  function exportPNG() {
    // We'll use html2canvas-like manual approach with SVG foreignObject
    const w = state.canvas.width;
    const h = state.canvas.height;

    // Clone the canvas for export
    const clone = canvas.cloneNode(true);
    clone.querySelectorAll('.resize-handle').forEach(rh => rh.remove());
    clone.querySelectorAll('.canvas-element').forEach(el => {
      el.classList.remove('selected');
      el.style.outline = 'none';
    });
    // Remove the dashed border pseudo-element by resetting
    clone.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));

    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
        <foreignObject width="${w}" height="${h}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;position:relative;background:${state.canvas.bg};font-family:Inter,sans-serif;">
            ${clone.innerHTML}
          </div>
        </foreignObject>
      </svg>`;

    // Use canvas to render
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w * 2; // 2x for retina
      c.height = h * 2;
      const ctx = c.getContext('2d');
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);

      c.toBlob(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = ($('#doc-title').value || 'infographic') + '.png';
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');
    };

    img.onerror = () => {
      // Fallback: export as SVG if PNG fails due to CORS
      alert('PNG export failed (likely due to embedded images). Try SVG export instead, or use images from URLs.');
      URL.revokeObjectURL(url);
    };

    img.src = url;
  }

  function exportSVG() {
    const w = state.canvas.width;
    const h = state.canvas.height;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
    svg += `<rect width="${w}" height="${h}" fill="${state.canvas.bg}"/>`;

    const sorted = [...state.elements].sort((a, b) => a.z - b.z);
    sorted.forEach(el => {
      const opacity = el.opacity ?? 1;
      switch (el.type) {
        case 'rect':
          svg += `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="${el.radius || 0}" fill="${el.fill}" opacity="${opacity}"${el.stroke && el.stroke !== 'transparent' ? ` stroke="${el.stroke}" stroke-width="2"` : ''}/>`;
          break;
        case 'circle':
          svg += `<ellipse cx="${el.x + el.w / 2}" cy="${el.y + el.h / 2}" rx="${el.w / 2}" ry="${el.h / 2}" fill="${el.fill}" opacity="${opacity}"${el.stroke && el.stroke !== 'transparent' ? ` stroke="${el.stroke}" stroke-width="2"` : ''}/>`;
          break;
        case 'line':
        case 'divider':
          svg += `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" fill="${el.fill}" opacity="${opacity}"/>`;
          break;
        case 'heading':
        case 'text': {
          const anchor = el.align === 'center' ? 'middle' : el.align === 'right' ? 'end' : 'start';
          const tx = el.align === 'center' ? el.x + el.w / 2 : el.align === 'right' ? el.x + el.w : el.x;
          const lines = el.text.split('\n');
          const lineH = el.fontSize * 1.3;
          lines.forEach((line, i) => {
            svg += `<text x="${tx}" y="${el.y + el.fontSize + i * lineH}" font-family="${el.fontFamily}" font-size="${el.fontSize}" font-weight="${el.fontWeight}" fill="${el.color}" text-anchor="${anchor}" opacity="${opacity}">${escXml(line)}</text>`;
          });
          break;
        }
        case 'number': {
          const anchor = el.align === 'center' ? 'middle' : el.align === 'right' ? 'end' : 'start';
          const tx = el.align === 'center' ? el.x + el.w / 2 : el.align === 'right' ? el.x + el.w : el.x;
          svg += `<text x="${tx}" y="${el.y + el.h / 2}" font-family="${el.fontFamily}" font-size="${el.fontSize}" font-weight="${el.fontWeight}" fill="${el.color}" text-anchor="${anchor}" dominant-baseline="middle" opacity="${opacity}">${escXml(el.text)}</text>`;
          if (el.label) {
            svg += `<text x="${tx}" y="${el.y + el.h / 2 + el.fontSize * 0.5}" font-family="Inter" font-size="${Math.max(11, el.fontSize * 0.3)}" fill="${el.color}" text-anchor="${anchor}" opacity="${opacity * 0.6}">${escXml(el.label)}</text>`;
          }
          break;
        }
        case 'icon':
          svg += `<text x="${el.x + el.w / 2}" y="${el.y + el.h / 2}" font-size="${el.fontSize}" fill="${el.color}" text-anchor="middle" dominant-baseline="middle" opacity="${opacity}">${el.icon}</text>`;
          break;
        case 'progress': {
          const trackW = el.w;
          const barW = trackW * clamp(el.value, 0, 100) / 100;
          if (el.label) {
            svg += `<text x="${el.x}" y="${el.y + 12}" font-family="Inter" font-size="12" font-weight="600" fill="${el.labelColor}">${escXml(el.label)}</text>`;
            svg += `<text x="${el.x + el.w}" y="${el.y + 12}" font-family="Inter" font-size="12" fill="${el.labelColor}" text-anchor="end" opacity="0.7">${el.value}%</text>`;
          }
          const barY = el.label ? el.y + 22 : el.y;
          svg += `<rect x="${el.x}" y="${barY}" width="${trackW}" height="10" rx="5" fill="${el.trackColor}"/>`;
          svg += `<rect x="${el.x}" y="${barY}" width="${barW}" height="10" rx="5" fill="${el.barColor}"/>`;
          break;
        }
        case 'bar-chart': {
          const data = el.data || [];
          const maxVal = Math.max(...data.map(d => d.value), 1);
          const barWidth = Math.floor((el.w - 40) / data.length) - 10;
          const chartH = el.h - 40;
          data.forEach((d, i) => {
            const barH = (d.value / maxVal) * (chartH - 30);
            const x = el.x + 10 + i * (barWidth + 10);
            const y = el.y + 10 + chartH - barH;
            svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="${el.barColor}"/>`;
            svg += `<text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" fill="${el.labelColor}" font-size="12" font-family="Inter" font-weight="600">${d.value}</text>`;
            svg += `<text x="${x + barWidth / 2}" y="${el.y + 10 + chartH + 16}" text-anchor="middle" fill="${el.labelColor}" font-size="11" font-family="Inter">${escXml(d.label)}</text>`;
          });
          break;
        }
        case 'pie-chart': {
          const data = el.data || [];
          const total = data.reduce((s, d) => s + d.value, 0);
          if (!total) break;
          const cx = el.x + el.w / 2;
          const cy = el.y + (el.h - 40) / 2;
          const r = (Math.min(el.w, el.h) - 20) / 2 - 10;
          const colors = el.colors || ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'];
          let angle = -Math.PI / 2;
          data.forEach((d, i) => {
            const sweep = (d.value / total) * Math.PI * 2;
            const x1 = cx + r * Math.cos(angle);
            const y1 = cy + r * Math.sin(angle);
            const x2 = cx + r * Math.cos(angle + sweep);
            const y2 = cy + r * Math.sin(angle + sweep);
            const large = sweep > Math.PI ? 1 : 0;
            svg += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]}"/>`;
            const midAngle = angle + sweep / 2;
            const lx = cx + (r * 0.65) * Math.cos(midAngle);
            const ly = cy + (r * 0.65) * Math.sin(midAngle);
            svg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="13" font-weight="700" font-family="Inter">${Math.round((d.value / total) * 100)}%</text>`;
            angle += sweep;
          });
          break;
        }
      }
    });

    svg += '</svg>';

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = ($('#doc-title').value || 'infographic') + '.svg';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function escXml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Image upload handler ──
  document.getElementById('image-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const el = selectedEl();
      if (el && el.type === 'image') {
        snapshot();
        el.src = ev.target.result;
        render();
      } else {
        addElement('image', { src: ev.target.result, x: 200, y: 200 });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  // ── Zoom ──
  function zoomIn() { state.zoom = Math.min(3, state.zoom + 0.1); applyZoom(); }
  function zoomOut() { state.zoom = Math.max(0.2, state.zoom - 0.1); applyZoom(); }
  function zoomFit() {
    const scrollRect = canvasScroll.getBoundingClientRect();
    const scaleX = (scrollRect.width - 80) / state.canvas.width;
    const scaleY = (scrollRect.height - 80) / state.canvas.height;
    state.zoom = Math.min(scaleX, scaleY, 1);
    applyZoom();
  }

  // Scroll to zoom
  canvasScroll.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    }
  }, { passive: false });

  // ── Wire up buttons ──
  function init() {
    applyCanvasSize();
    applyZoom();
    renderTemplates();
    renderIcons();
    render();

    // Element add buttons
    document.querySelectorAll('.element-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.element;
        if (type === 'image') {
          addElement('image');
        } else {
          addElement(type);
        }
      });
    });

    // Top bar
    $('#btn-undo').addEventListener('click', undo);
    $('#btn-redo').addEventListener('click', redo);
    $('#btn-export-png').addEventListener('click', exportPNG);
    $('#btn-export-svg').addEventListener('click', exportSVG);

    // Zoom
    $('#btn-zoom-in').addEventListener('click', zoomIn);
    $('#btn-zoom-out').addEventListener('click', zoomOut);
    $('#btn-zoom-fit').addEventListener('click', zoomFit);

    // Element actions
    $('#btn-duplicate').addEventListener('click', duplicateSelected);
    $('#btn-delete').addEventListener('click', deleteSelected);
    $('#btn-bring-front').addEventListener('click', bringToFront);
    $('#btn-send-back').addEventListener('click', sendToBack);

    // Canvas props
    $('#canvas-width').addEventListener('change', (e) => {
      state.canvas.width = parseInt(e.target.value) || 800;
      applyCanvasSize();
    });
    $('#canvas-height').addEventListener('change', (e) => {
      state.canvas.height = parseInt(e.target.value) || 1200;
      applyCanvasSize();
    });
    $('#canvas-bg').addEventListener('input', (e) => {
      state.canvas.bg = e.target.value;
      applyCanvasSize();
    });

    // Fit on load
    setTimeout(zoomFit, 100);
  }

  init();
})();
