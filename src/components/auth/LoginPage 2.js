import React, { useState } from 'react';
import { loginApi } from '../../api/auth/auth';
import './LoginPage.css'; // Import the CSS file

/**
 * LoginPage Component
 */
function LoginPage() {
  const [username, setusername] = useState('');
  const [password, setPassword] = useState('');

  /**
   * Handles login button click event.
   */
  const handleLoginClick = () => {
    loginApi(username, password)
        .then((response) => {
          const authorizationHeader = response['token'];
          console.log('Authorization Header:', authorizationHeader);
        })
        .catch((error) => {
          console.error('Login failed:', error.message);
        });
  };

  return (
    <div className="login-container">
      <h3 className="login-header">Sign In</h3>

      <div className="input-group">
        <label htmlFor="email" className="input-label">Email Address</label>
        <input
          type="email"
          id="email"
          value={username}
          onChange={(e) => setusername(e.target.value)}
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

      <div className="row">
        <label>
          <input type="checkbox" /> Remember me
        </label>
        <a href="#!" className="link">Forgot password?</a>
      </div>

      <button
        onClick={handleLoginClick}
        className="sign-in-button"
>
        Sign In
      </button>

      <div className="footer">
        <p>
          Not a member?{' '}
          <a href="/register" className="link">Register</a>
        </p>
        <p>or sign up with:</p>
        <div className="social-container">
          {['Facebook', 'Twitter', 'Google', 'GitHub'].map((platform) => (
            <button key={platform} className="social-button">
              {platform}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
