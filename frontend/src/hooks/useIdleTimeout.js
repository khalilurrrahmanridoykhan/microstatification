import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const useIdleTimeout = (timeoutMinutes = 5) => {
  const navigate = useNavigate();
  const timeoutIdRef = useRef(null);
  const warningTimeoutIdRef = useRef(null);

  const logout = () => {
    // Clear all auth data
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userInfo');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    
    // Navigate to login
    navigate('/login', { replace: true });
  };

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (warningTimeoutIdRef.current) {
      clearTimeout(warningTimeoutIdRef.current);
    }

    // Set new timeout (5 minutes in milliseconds)
    timeoutIdRef.current = setTimeout(() => {
      logout();
    }, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    // Only run if user is authenticated
    const authToken = sessionStorage.getItem('authToken');
    if (!authToken) {
      return;
    }

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Reset timer on any user activity
    const handleActivity = () => {
      resetTimer();
    };

    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (warningTimeoutIdRef.current) {
        clearTimeout(warningTimeoutIdRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [timeoutMinutes, navigate]);
};

export default useIdleTimeout;
