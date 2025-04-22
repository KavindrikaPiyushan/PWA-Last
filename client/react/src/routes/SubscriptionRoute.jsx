import React, { useEffect, useState } from "react";
import { Navigate } from 'react-router-dom';
import { checkSubscription } from "../components/subscriptionCheck";

const SubscriptionRoute = ({ children }) => {
  const [allowed, setAllowed] = useState(null); // null = loading, true/false = result

  useEffect(() => {
    checkSubscription().then(valid => {
      setAllowed(valid);
      console.log('Sub Status', valid);
    });
  }, []);

  if (allowed === null) return <div>Loading Subscription...</div>;
  if (!allowed) return <Navigate to='/subscription' />;

  return children;
};

export default SubscriptionRoute;
