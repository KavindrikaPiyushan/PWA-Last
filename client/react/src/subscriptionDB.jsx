import { openDB } from 'idb';

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
        const tx = db.transaction('subs', 'readwrite');
        await tx.store.put(data, 'current');
        await tx.done;
    } catch (err) {
        console.error('Error saving subscription:', err);
    }
}

export async function getSub() {
    try {
        const tx = db.transaction('subs', 'readonly');
        const result = await tx.store.get('current');
        await tx.done;
        return result;
    } catch (err) {
        console.error('Error getting subscription:', err);
    }
}

export async function clearSub() {
    try {
        const tx = db.transaction('subs', 'readwrite');
        await tx.store.delete('current');
        await tx.done;
    } catch (err) {
        console.error('Error clearing subscription:', err);
    }
}