import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTableStore } from '../store/tableStore';
import { customerService } from '../services/customerService';

/**
 * Hook to periodically check if customer session is still active
 * If session ended (bill settled), redirects to login with thank you message
 */
export function useSessionCheck() {
  const { accessToken, customer, logout } = useAuthStore();
  const intervalRef = useRef(null);
  const checkCountRef = useRef(0);

  useEffect(() => {
    // Only check if user is logged in
    if (!accessToken || !customer) {
      // Clear interval if logged out
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Function to check session status
    const checkSession = async () => {
      try {
        // Check customer info - if session ended, this will return 401
        const response = await customerService.getMe();
        
        // If we get a successful response, session is still active
        if (response.success) {
          checkCountRef.current = 0; // Reset check count on success
        }
      } catch (error) {
        const response = error.response;
        
        // Check if session has ended
        if (response?.status === 401) {
          const data = response.data;
          
          if (data?.sessionEnded || data?.sessionExpired || data?.requiresNewScan) {
            // Session has ended - logout and redirect
            logout();
            
            // Clear table store since session is ended
            useTableStore.getState().clearTable();
            
            const message = 'Thank you for ordering with us!';
            window.location.href = `/login?message=${encodeURIComponent(message)}`;
            
            // Clear interval
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return;
          }
        }

        // Increment check count on error
        checkCountRef.current++;
        
        // If we get too many consecutive errors (not 401), stop checking
        if (checkCountRef.current > 3) {
          console.warn('Too many session check failures, stopping periodic check');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    };

    // Check immediately on mount
    checkSession();

    // Set up periodic check every 10 seconds
    intervalRef.current = setInterval(() => {
      checkSession();
    }, 10000); // Check every 10 seconds

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [accessToken, customer, logout]);

  return null;
}

