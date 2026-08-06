const Filters = {
  none(ctx, canvas) {
  },

  // inverte as cores
  invert(ctx, canvas) {
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = frame.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i]     = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
    ctx.putImageData(frame, 0, 0);
  },

  // preto e branco
  gray(ctx, canvas) {
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = frame.data;
    for (let i = 0; i < d.length; i += 4) {
      const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = avg;
    }
    ctx.putImageData(frame, 0, 0);
  },

  // tipo camera termica
  thermal(ctx, canvas) {
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = frame.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      let r, g, b;
      if (lum < 0.25) {
        const t = lum / 0.25;
        r = 0; g = 0; b = 128 + t * 127;
      } else if (lum < 0.5) {
        const t = (lum - 0.25) / 0.25;
        r = t * 200; g = 0; b = 255 - t * 100;
      } else if (lum < 0.75) {
        const t = (lum - 0.5) / 0.25;
        r = 200 + t * 55; g = t * 180; b = 155 - t * 155;
      } else {
        const t = (lum - 0.75) / 0.25;
        r = 255; g = 180 + t * 75; b = t * 200;
      }
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    ctx.putImageData(frame, 0, 0);
  },

  // pixelado
  pixelate(ctx, canvas) {
    const size = 14;
    const w = canvas.width, h = canvas.height;
    const small = document.createElement('canvas');
    small.width = Math.max(1, Math.floor(w / size));
    small.height = Math.max(1, Math.floor(h / size));
    const sctx = small.getContext('2d');
    sctx.drawImage(canvas, 0, 0, small.width, small.height);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(small, 0, 0, small.width, small.height, 0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
  },

  // sepia
  sepia(ctx, canvas) {
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = frame.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      d[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }
    ctx.putImageData(frame, 0, 0);
  },

  // contornos
  edges(ctx, canvas) {
    const w = canvas.width, h = canvas.height;
    const src = ctx.getImageData(0, 0, w, h);
    const sd = src.data;
    const gray = new Float32Array(w * h);
    for (let i = 0, p = 0; i < sd.length; i += 4, p++) {
      gray[p] = 0.299 * sd[i] + 0.587 * sd[i + 1] + 0.114 * sd[i + 2];
    }
    const out = ctx.createImageData(w, h);
    const od = out.data;
    const gx = [-1,0,1,-2,0,2,-1,0,1];
    const gy = [-1,-2,-1,0,0,0,1,2,1];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let sx = 0, sy = 0, k = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const val = gray[(y + ky) * w + (x + kx)];
            sx += val * gx[k];
            sy += val * gy[k];
            k++;
          }
        }
        const mag = Math.min(255, Math.sqrt(sx * sx + sy * sy));
        const idx = (y * w + x) * 4;
        od[idx] = od[idx + 1] = od[idx + 2] = mag;
        od[idx + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
  }
};