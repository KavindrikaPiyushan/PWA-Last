import { openDB } from 'idb';
import { encryptData, decryptData } from './utils/cryptoUtils'; // Shared utility

export const initDB = async () => {
  return openDB('crud-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

// Encrypt and save users
export const saveUsers = async (users) => {
  const db = await initDB();
  const tx = db.transaction('users', 'readwrite');
  for (const user of users) {
    const encrypted = encryptData(user);
    await tx.store.put({ id: user.id, encrypted }); // Store under same ID
  }
  await tx.done;
};

// Decrypt all users
export const getUsers = async () => {
  const db = await initDB();
  const entries = await db.getAll('users');
  return entries.map(entry => decryptData(entry.encrypted)).filter(Boolean);
};

// Add to syncQueue encrypted
export const addToSyncQueue = async (action, payload) => {
  const db = await initDB();
  const encrypted = encryptData({ action, payload });
  await db.add('syncQueue', { encrypted });
};

// Decrypt sync queue items
export const getSyncQueue = async () => {
  const db = await initDB();
  const records = await db.getAll('syncQueue');
  return records.map(r => ({
    ...r,
    ...(decryptData(r.encrypted) || {})
  })).filter(r => r.action); // filter invalid or tampered records
};

export const clearSyncItem = async (id) => {
  const db = await initDB();
  await db.delete('syncQueue', id);
};
