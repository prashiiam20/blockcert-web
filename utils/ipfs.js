let ipfsClientPromise = null;

async function getIPFSClient() {
  if (!ipfsClientPromise) {
    const { create } = await import('ipfs-http-client');
    ipfsClientPromise = create({ url: 'http://127.0.0.1:5001' });
  }
  return ipfsClientPromise;
}

async function uploadToIPFS(data) {
  const ipfs = await getIPFSClient();
  const { cid } = await ipfs.add(data);
  return cid.toString();
}

async function downloadFromIPFS(cid) {
  const ipfs = await getIPFSClient();
  const chunks = [];
  for await (const chunk of ipfs.cat(cid)) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = { uploadToIPFS, downloadFromIPFS };