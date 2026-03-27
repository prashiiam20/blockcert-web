const crypto = require('crypto');

const ALGORITHM = 'chacha20-poly1305';

function generateKey() {
  return crypto.randomBytes(32);
}

function encrypt(data, key) {
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, nonce, {
    authTagLength: 16
  });
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    nonce: nonce.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData, key, nonce, authTag) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(nonce, 'hex'),
    { authTagLength: 16 }
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = { generateKey, encrypt, decrypt };