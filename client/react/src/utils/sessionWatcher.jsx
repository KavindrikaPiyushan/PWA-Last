// import { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { checkSession } from './session';

// const SessionWatcher = () => {
//   const navigate = useNavigate();

//   useEffect(() => {
//     const handleReconnect = async () => {
//       const isValid = await checkSession();
//       if (!isValid) {
//         navigate('/login');
//       }
//     };

//     window.addEventListener('online', handleReconnect);
//     return () => {
//       window.removeEventListener('online', handleReconnect);
//     };
//   }, [navigate]);

//   return null; 
// };

// export default SessionWatcher;
