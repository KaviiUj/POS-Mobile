import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { MOBILE_PREFIX } from '../utils/constants';
import { customerService } from '../services/customerService';
import { outletService } from '../services/outletService';
import { useAuthStore } from '../store/authStore';
import { useTableStore } from '../store/tableStore';
import { useOutletStore } from '../store/outletStore';
import { getDeviceType, getUniqueDeviceId } from '../utils/device';
import { extractEncryptedParams, clearUrlParamsWithHistory } from '../utils/urlParams';

const Login = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { tableId, tableName, setTable } = useTableStore();
  const { setOutletConfig } = useOutletStore();
  const [searchParams] = useSearchParams();

  // Extract encrypted params from URL on component mount
  useEffect(() => {
    // Check for session-ended message from API interceptor
    const message = searchParams.get('message');
    if (message) {
      setError(decodeURIComponent(message));
      // Clear the message after showing it
      setTimeout(() => {
        setError('');
      }, 5000);
    }

    const params = extractEncryptedParams(searchParams);
    
    // DEBUG: Print decrypted data
    if (params.tableName || params.tableId) {
      const debugData = {
        tableName: params.tableName,
        tableId: params.tableId,
        mobileNumber: params.mobileNumber
      };
      console.log('🔓 Decrypted Table Data:', debugData);
      setDebugInfo(debugData);
      
      // Hide debug info after 5 seconds
      setTimeout(() => setDebugInfo(null), 5000);
    }
    
    // If we have table information, store it
    if (params.tableName || params.tableId) {
      setTable(params.tableId, params.tableName, params.tableName);
    }

    // If mobile number is provided in params, pre-fill it
    if (params.mobileNumber) {
      setMobileNumber(params.mobileNumber);
    }

    // Clear URL params to keep URL clean
    if (searchParams.toString()) {
      clearUrlParamsWithHistory();
    }
  }, [searchParams, setTable]);

  const handleMobileNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Remove leading zeros
    value = value.replace(/^0+/, '');
    
    setMobileNumber(value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate mobile number
    if (!mobileNumber) {
      setError('Please enter a mobile number');
      return;
    }

    if (mobileNumber.length < 9) {
      setError('Please enter a valid mobile number');
      return;
    }

    // Validate table information
    if (!tableName || !tableId) {
      setError('Invalid entry!');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const mobileType = getDeviceType();
      const uniqueId = getUniqueDeviceId();
      
      const response = await customerService.register(
        mobileNumber,
        mobileType,
        uniqueId,
        tableId,
        tableName
      );

      if (response.success) {
        const { customer, accessToken, refreshToken } = response.data;
        
        // Save authentication data
        setAuth(customer, accessToken, refreshToken);
        
        // Log saved data for debugging
        console.log('✅ Login successful - Data saved:', {
          customer,
          tableName,
          tableId,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
        });
        
        // Fetch and save outlet configuration
        try {
          const outletConfigResponse = await outletService.getOutletConfig();
          if (outletConfigResponse.success) {
            console.log('🔍 Raw outlet config response:', outletConfigResponse.data);
            setOutletConfig(outletConfigResponse.data);
            console.log('✅ Outlet config loaded:', outletConfigResponse.data);
          }
        } catch (outletError) {
          console.error('Failed to fetch outlet config:', outletError);
          // Continue anyway, don't block user
        }
        
        navigate('/home');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary px-4">
      {/* Debug Info Display */}
      {debugInfo && (
        <div className="fixed top-4 left-4 right-4 bg-accent text-white p-4 rounded-lg shadow-lg z-50 text-xs">
          <p className="font-bold mb-2">🔓 Decrypted Data:</p>
          <p>Table Name: {debugInfo.tableName}</p>
          <p>Table ID: {debugInfo.tableId}</p>
          {debugInfo.mobileNumber && <p>Mobile: {debugInfo.mobileNumber}</p>}
        </div>
      )}
      
      <Card className="w-full max-w-md" useItemSurface={true}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome</h1>
          {tableName ? (
            <p className="text-neutral-light">
              Table: <span className="text-accent font-semibold">{tableName}</span>
            </p>
          ) : (
            <p className="text-neutral-light">Enter your mobile number to continue</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-light font-medium">
                {MOBILE_PREFIX}
              </span>
              <Input
                type="tel"
                placeholder="71 234 5678"
                value={mobileNumber}
                onChange={handleMobileNumberChange}
                name="mobileNumber"
                className="pl-16"
                maxLength={9}
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-primary">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !mobileNumber}
            variant="primary"
          >
            {loading ? 'Please wait...' : 'Continue'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;

