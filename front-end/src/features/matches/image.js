const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_DATA_URL_BYTES = 40 * 1024;

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('O arquivo selecionado nao e uma imagem valida.'));
    image.src = dataUrl;
  });
}

function readDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Nao foi possivel ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

export async function prepareOpponentLogo(file) {
  if (!file) return '';
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Use uma imagem PNG, JPG/JPEG ou WebP.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('A logo deve ter no maximo 5 MB.');
  }

  const source = await readDataUrl(file);
  const image = await loadImage(source);
  let width = Math.min(image.naturalWidth, 512);
  let height = Math.round(image.naturalHeight * (width / image.naturalWidth));
  if (height > 512) {
    width = Math.round(width * (512 / height));
    height = 512;
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Seu navegador nao conseguiu processar a imagem.');

  for (let attempt = 0; attempt < 7; attempt += 1) {
    canvas.width = Math.max(48, Math.round(width));
    canvas.height = Math.max(48, Math.round(height));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL('image/webp', Math.max(0.45, 0.88 - attempt * 0.08));
    if (new Blob([result]).size <= MAX_DATA_URL_BYTES) return result;
    width *= 0.78;
    height *= 0.78;
  }

  throw new Error('Nao foi possivel reduzir a logo para o limite aceito pelo servidor.');
}
