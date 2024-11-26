import React, { useState } from 'react';
import { signUpApi } from '../../api/auth/auth';
import './RegisterPage.css'; // Import the CSS file

/**
 * RegisterPage Component
 * Demonstrates a registration interface for creating a new user.
 */
function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Validates form input before making the API call.
   * @returns {boolean} Whether the input is valid.
   */
  const validateInputs = () => {
    if (!email) {
      setError('Email is required.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!username) {
      setError('Username is required.');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    return true;
  };

  /**
   * Handles register button click event.
   */
  const handleRegisterClick = () => {
    setError(null);
    setSuccess(false);

    if (!validateInputs()) {
      return;
    }

    signUpApi(username, email, password)
      .then((response) => {
        console.log('Registration successful:', response.data);
        setSuccess(true);
        // Clear form fields after success
        setEmail('');
        setUsername('');
        setPassword('');
      })
      .catch((error) => {
        console.error('Registration failed:', error.message);
        setError(
          error.response?.data?.message || 'Registration failed. Please try again.'
        );
      });
  };

  return (
    <div className="register-container">
      <h3 className="register-header">Register</h3>

      {error && <p className="error-message">{error}</p>}
      {success && (
        <p className="success-message">Registration successful! You can now log in.</p>
      )}

      <div className="input-group">
        <label htmlFor="email" className="input-label">Email Address</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="input-group">
        <label htmlFor="username" className="input-label">Username</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="input-group">
        <label htmlFor="password" className="input-label">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
      </div>

      <button
        onClick={handleRegisterClick}
        className="register-button"
      >
        Register
      </button>
    </div>
  );
}

export default RegisterPage;
