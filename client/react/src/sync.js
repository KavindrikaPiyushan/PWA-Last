import axios from 'axios';
import { getSyncQueue, clearSyncItem } from './db';

export const syncWithServer = async () => {
  if (!navigator.onLine) return;

  const queue = await getSyncQueue();

  for (const item of queue) {
    try {
      if (item.action === 'create') {
        await axios.post('http://localhost:5000/users', item.payload);
      } else if (item.action === 'update') {
        await axios.put(`http://localhost:5000/users/${item.payload.id}`, item.payload);
      } else if (item.action === 'delete') {
        await axios.delete(`http://localhost:5000/users/${item.payload.id}`);
      }
      await clearSyncItem(item.id);
    } catch (err) {
      console.error('Failed to sync item:', item, err);
    }
  }
};
