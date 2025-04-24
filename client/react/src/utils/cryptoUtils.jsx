// src/utils/cryptoUtils.js
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'd8ddf912ef1ab17789d501b9be433561d8bf0f113d56d3159a7369697f07e2ba'; // 🔐 Keep secure
const HMAC_SECRET = 'c812cdd68a9ca007296a5652cb2a85193790ffbe0f33c3f8d207a5ba6acc8eee';     // 🔐 Keep secure

export function encryptData(data) {
  const jsonString = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
  const hmac = CryptoJS.HmacSHA256(encrypted, HMAC_SECRET).toString();
  return JSON.stringify({ encrypted, hmac });
}

export function decryptData(encryptedPayload) {
  try {
    const { encrypted, hmac } = JSON.parse(encryptedPayload);

    const recalculatedHmac = CryptoJS.HmacSHA256(encrypted, HMAC_SECRET).toString();
    if (hmac !== recalculatedHmac) {
      console.warn('Tampering detected: HMAC mismatch');
      localStorage.clear(); // Optional: wipe storage
      window.location.href = '/login'; // Force logout + redirect
      return null;
    }

    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (err) {
    console.error('Decryption or integrity check failed:', err);
    return null;
  }
}
