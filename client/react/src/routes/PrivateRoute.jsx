// routes/PrivateRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { checkSession } from '../utils/session';
import { verifySessionIntegrity } from '../utils/verifySession';

const PrivateRoute = ({ children }) => {

  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    const validate = async () => {
      const localOkay = checkSession(); // offline check
      if (!localOkay) return setIsValid(false);

      // If online, do server verification
      if (navigator.onLine) {
        const serverOkay = await verifySessionIntegrity();
        setIsValid(serverOkay);
      } else {
        setIsValid(true); // skip if offline
      }
      
    };
    validate();

    
  }, []);

  if (isValid === null) return <p>Loading...</p>;
  return isValid ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
