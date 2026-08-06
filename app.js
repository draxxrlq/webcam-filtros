const videoEl = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const W = canvas.width;
const H = canvas.height;

let currentFilter = 'none';
let smoothedPoints = null;
const SMOOTHING = 0.35;

document.querySelectorAll('.controls button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
  });
});

function orderPointsByAngle(points) {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return points
    .map(p => ({ ...p, angle: Math.atan2(p.y - cy, p.x - cx) }))
    .sort((a, b) => a.angle - b.angle);
}

function smooth(points) {
  if (!smoothedPoints || smoothedPoints.length !== points.length) {
    smoothedPoints = points.map(p => ({ ...p }));
    return smoothedPoints;
  }
  smoothedPoints = points.map((p, i) => ({
    x: smoothedPoints[i].x * SMOOTHING + p.x * (1 - SMOOTHING),
    y: smoothedPoints[i].y * SMOOTHING + p.y * (1 - SMOOTHING),
  }));
  return smoothedPoints;
}

// aqui é pro filtro ficar so entre os dedos
function drawFilteredRegion(rawPoints) {
  if (!rawPoints || rawPoints.length < 2) return;

  let points;
  if (rawPoints.length >= 4) {
    points = orderPointsByAngle(rawPoints);
  } else {
    const [a, b] = rawPoints;
    points = [
      { x: a.x, y: a.y },
      { x: b.x, y: a.y },
      { x: b.x, y: b.y },
      { x: a.x, y: b.y },
    ];
  }

  points = smooth(points);

  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const offCtx = off.getContext('2d');
  offCtx.translate(W, 0);
  offCtx.scale(-1, 1);
  offCtx.drawImage(videoEl, 0, 0, W, H);
  offCtx.setTransform(1, 0, 0, 1, 0, 0);

  if (Filters[currentFilter]) {
    Filters[currentFilter](offCtx, off);
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(off, 0, 0);
  ctx.restore();
}

function onResults(results) {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(results.image, 0, 0, W, H);
  ctx.restore();

  const hands = results.multiHandLandmarks || [];

  if (hands.length === 0) {
    smoothedPoints = null;
    statusEl.textContent = 'nenhuma mao detectada — mostre a mao pra camera';
    return;
  }
  const framePoints = [];
  hands.forEach(landmarks => {
    const thumb = landmarks[4];
    const index = landmarks[8];
    framePoints.push({ x: W - thumb.x * W, y: thumb.y * H });
    framePoints.push({ x: W - index.x * W, y: index.y * H });
  });

  drawFilteredRegion(framePoints);

  statusEl.textContent = hands.length === 1
    ? 'uma mao detectada - junte as duas maos pra formar um quadro completo'
    : `filtro ativo: ${currentFilter}`;
}

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6,
});
hands.onResults(onResults);

const camera = new Camera(videoEl, {
  onFrame: async () => {
    await hands.send({ image: videoEl });
  },
  width: W,
  height: H,
});

camera.start()
  .then(() => { statusEl.textContent = 'mostre a mao pra camera...'; })
  .catch(err => {
    statusEl.textContent = 'nao consegui acessar a camera: ' + err.message;
    console.error(err);
  });