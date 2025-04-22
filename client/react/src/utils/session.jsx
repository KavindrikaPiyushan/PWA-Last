// utils/session.js
import dayjs from 'dayjs';
import api from '../api/axios'

export const checkSession =async () => {
  const session = JSON.parse(localStorage.getItem('offlineSession'));
  const accessToken = localStorage.getItem('accessToken');

  if (!session || !accessToken) return false;

  const now = dayjs();
  const loginTime = dayjs(session.trustedTimestamp);
  const diffMinutes = now.diff(loginTime, 'minute');

  //  This will check system current time is less than last login time, if it is lpgout automatically
  if(now.isBefore(loginTime)){
    localStorage.removeItem('accessToken');
    localStorage.removeItem('offlineSession');
    alert('System time manupulation detected. Please login in again');
  }


// This check the difference between last login time and current systemn time. if it is more than 1 minute will logout automatically.
  if (diffMinutes >= 5) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('offlineSession');
    alert('Session expired. Please log in again.');
    return false;
  }

  try {
    const res = await api.get('/server-time',{ headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    withCredentials: true,});

    const res2 = await api.get('/verify-session', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const lastLoginServerTime = dayjs(res2.data.serverTimestamp);

    

    const serverTime = dayjs(res.data.serverTime);
    const diffWithServer = serverTime.diff(lastLoginServerTime,'minute');

    if(diffWithServer>=1){
      localStorage.removeItem('accessToken');
      localStorage.removeItem('offlineSession');
      alert('Login time validation failed. Please log in again.');

      return false;
    }

  }
  catch(err){
       console.warn('Server time check failed', err.message);
  }




  return true;
};
