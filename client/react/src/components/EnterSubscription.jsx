import React, { useState } from 'react';
import { activateLicense } from '../utils/activate'; // Import the activation function
import { useNavigate } from 'react-router-dom'; // Use useNavigate instead of useHistory

export default function EnterSubscription() {
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Use useNavigate for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await activateLicense(licenseKey);
      navigate('/premium'); // Redirect to the main app if the license is activated successfully
    } catch (err) {
      setError('License is invalid or expired');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Enter Your Subscription Key</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Enter License Key"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            required
            style={{
              padding: '10px',
              width: '80%',
              fontSize: '16px',
              marginBottom: '10px',
              borderRadius: '5px',
            }}
          />
        </div>
        {error && (
          <div style={{ color: 'red', marginBottom: '10px' }}>
            <p>{error}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          {loading ? 'Validating...' : 'Activate Subscription'}
        </button>
      </form>
    </div>
  );
}