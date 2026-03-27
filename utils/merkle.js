const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

function createMerkleTree(certificates) {
  const leaves = certificates.map(cert => keccak256(cert));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  return tree;
}

function getMerkleRoot(tree) {
  return tree.getRoot().toString('hex');
}

function getMerkleProof(tree, certificate) {
  const leaf = keccak256(certificate);
  const proof = tree.getProof(leaf);
  return proof.map(p => '0x' + p.data.toString('hex'));
}

function verifyProof(proof, leaf, root) {
  return MerkleTree.verify(proof, keccak256(leaf), root, keccak256, { sortPairs: true });
}

module.exports = {
  createMerkleTree,
  getMerkleRoot,
  getMerkleProof,
  verifyProof
};