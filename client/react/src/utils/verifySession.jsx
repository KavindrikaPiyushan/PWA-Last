// utils/verifySession.js
import api from '../api/axios';
import { secureGet,secureRemove } from '../utils/secureStorage';

export const verifySessionIntegrity = async () => {
  const session = JSON.parse(secureGet('offlineSession'));
  const accessToken = secureGet('accessToken');
  if (!session || !accessToken) return false;

  try {
    const res = await api.get('/verify-session', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log(res);

    const trustedFromServer = res.data.serverTimestamp;
    const trustedFromClient = session.trustedTimestamp;

    const toleranceMs = 3 * 60 * 1000; // 3 minutes
    const diff = Math.abs(trustedFromServer - trustedFromClient);

    if (diff > toleranceMs) {
      alert('Session mismatch detected. Please log in again.');
      secureRemove('accessToken');
      secureRemove('offlineSession');
      return false;
    }

    return true;
  } catch (err) {
    console.error('Session verification failed', err);
    return false;
  }
};
