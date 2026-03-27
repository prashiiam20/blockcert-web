const zlib = require('zlib');
const { promisify } = require('util');

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

async function compressBrotli(data) {
  const compressed = await brotliCompress(Buffer.from(data));
  return compressed;
}

async function decompressBrotli(compressed) {
  const decompressed = await brotliDecompress(compressed);
  return decompressed.toString();
}

function compressZlib(data) {
  return zlib.deflateSync(Buffer.from(data));
}

function decompressZlib(compressed) {
  return zlib.inflateSync(compressed).toString();
}

module.exports = {
  compressBrotli,
  decompressBrotli,
  compressZlib,
  decompressZlib
};