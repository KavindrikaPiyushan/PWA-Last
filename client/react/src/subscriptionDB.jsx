// src/subscriptionDB.js
import { openDB } from 'idb';
import { encryptData, decryptData } from './utils/cryptoUtils'; // Make sure you have this utility (shown below)

let db;

async function initDB() {
  db = await openDB('SubDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('subs')) {
        db.createObjectStore('subs');
      }
    },
  });
}

await initDB();

export async function saveSub(data) {
  try {
    const encrypted = encryptData(data);
    const tx = db.transaction('subs', 'readwrite');
    await tx.store.put(encrypted, 'current');
    await tx.done;
  } catch (err) {
    console.error('🔒 Error saving subscription:', err);
  }
}

export async function getSub() {
  try {
    const tx = db.transaction('subs', 'readonly');
    const encrypted = await tx.store.get('current');
    await tx.done;
    if (!encrypted) return null;
    return decryptData(encrypted);
  } catch (err) {
    console.error('🔒 Error getting subscription:', err);
    return null;
  }
}

export async function clearSub() {
  try {
    const tx = db.transaction('subs', 'readwrite');
    await tx.store.delete('current');
    await tx.done;
  } catch (err) {
    console.error('🔒 Error clearing subscription:', err);
  }
}
