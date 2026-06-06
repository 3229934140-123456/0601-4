export interface RemoveBgOptions {
  threshold?: number;
  tolerance?: number;
  bgColor?: { r: number; g: number; b: number };
  edgeSoftness?: number;
}

export function removeBackground(
  imageSrc: string,
  options: RemoveBgOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const {
        threshold = 30,
        tolerance = 20,
        bgColor,
        edgeSoftness = 2,
      } = options;

      let targetBg = bgColor;
      if (!targetBg) {
        targetBg = detectBackgroundColor(data, canvas.width, canvas.height);
      }

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const distance = colorDistance(r, g, b, targetBg.r, targetBg.g, targetBg.b);

        if (distance < threshold) {
          data[i + 3] = 0;
        } else if (distance < threshold + tolerance) {
          const alpha = ((distance - threshold) / tolerance) * 255;
          data[i + 3] = Math.min(255, Math.max(0, alpha));

          const factor = data[i + 3] / 255;
          data[i] = Math.round((r - targetBg.r * (1 - factor)) / factor);
          data[i + 1] = Math.round((g - targetBg.g * (1 - factor)) / factor);
          data[i + 2] = Math.round((b - targetBg.b * (1 - factor)) / factor);
        }
      }

      if (edgeSoftness > 0) {
        softenEdges(data, canvas.width, canvas.height, edgeSoftness);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(imageData, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    if (imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')) {
      img.src = imageSrc;
    } else {
      img.src = imageSrc;
    }
  });
}

function detectBackgroundColor(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { r: number; g: number; b: number } {
  const sampleSize = 20;
  let rSum = 0,
    gSum = 0,
    bSum = 0,
    count = 0;

  for (let x = 0; x < Math.min(sampleSize, width); x++) {
    for (let y = 0; y < Math.min(sampleSize, height); y++) {
      const idx = (y * width + x) * 4;
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      count++;
    }
  }

  for (let x = width - sampleSize; x < width; x++) {
    for (let y = 0; y < Math.min(sampleSize, height); y++) {
      const idx = (y * width + x) * 4;
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      count++;
    }
  }

  for (let x = 0; x < Math.min(sampleSize, width); x++) {
    for (let y = height - sampleSize; y < height; y++) {
      const idx = (y * width + x) * 4;
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      count++;
    }
  }

  for (let x = width - sampleSize; x < width; x++) {
    for (let y = height - sampleSize; y < height; y++) {
      const idx = (y * width + x) * 4;
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      count++;
    }
  }

  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
  };
}

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const rmean = (r1 + r2) / 2;
  const r = r1 - r2;
  const g = g1 - g2;
  const b = b1 - b2;

  return Math.sqrt(
    (2 + rmean / 256) * r * r + 4 * g * g + (2 + (255 - rmean) / 256) * b * b
  );
}

function softenEdges(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
) {
  const temp = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (temp[idx + 3] === 0 || temp[idx + 3] === 255) continue;

      let alphaSum = 0;
      let count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = (ny * width + nx) * 4;
            alphaSum += temp[nidx + 3];
            count++;
          }
        }
      }

      data[idx + 3] = Math.round(alphaSum / count);
    }
  }
}

export function hasTransparentPixels(imageSrc: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(false);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) {
          resolve(true);
          return;
        }
      }

      resolve(false);
    };
    img.onerror = () => resolve(false);
    img.src = imageSrc;
  });
}
