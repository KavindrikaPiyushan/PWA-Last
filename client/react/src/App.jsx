import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate  } from 'react-router-dom';
import UserManager from './UserManager';
import Login from './components/Login';
import PrivateRoute from './routes/PrivateRoute';
import SubscriptionRoute from './routes/SubscriptionRoute';
import EnterSubscription from './components/EnterSubscription';
import PremiumFeatures from './components/PremiumFeatures';




const App = () => {

  return (
    <Router>
      
      <Routes>
        <Route path="/subscription" element={<PrivateRoute> <EnterSubscription/></PrivateRoute>}/>
        <Route
          path="/premium"
          element={
            <PrivateRoute>
              <SubscriptionRoute>
                <PremiumFeatures />
              </SubscriptionRoute>
            </PrivateRoute>
          }
        />
        <Route path='/login' element={<Login/>} />
        <Route path="/" element={<PrivateRoute><UserManager /> </PrivateRoute>} />
     
      </Routes>
    </Router>
  );
};

export default App;
