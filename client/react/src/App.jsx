import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserManager from './UserManager';
import Login from './components/Login';
import PrivateRoute from './routes/PrivateRoute';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/login' element={<Login/>} />

        <Route path="/" element={<PrivateRoute><UserManager /> </PrivateRoute>} />
     
      </Routes>
    </Router>
  );
};

export default App;
