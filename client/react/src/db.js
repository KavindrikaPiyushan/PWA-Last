import { openDB } from 'idb';

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

export const saveUsers = async (users) => {
  const db = await initDB();
  const tx = db.transaction('users', 'readwrite');
  for (const user of users) {
    await tx.store.put(user);
  }
  await tx.done;
};

export const getUsers = async () => {
  const db = await initDB();
  return db.getAll('users');
};

export const addToSyncQueue = async (action, payload) => {
  const db = await initDB();
  await db.add('syncQueue', { action, payload });
};

export const getSyncQueue = async () => {
  const db = await initDB();
  return db.getAll('syncQueue');
};

export const clearSyncItem = async (id) => {
  const db = await initDB();
  await db.delete('syncQueue', id);
};
