// utils/session.js
import dayjs from 'dayjs';

export const checkSession = () => {
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
  if (diffMinutes >= 1) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('offlineSession');
    alert('Session expired. Please log in again.');
    return false;
  }

  return true;
};
