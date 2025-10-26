import React, { useState, useEffect, useRef } from 'react';
import { useTableStore } from '../store/tableStore';
import Button from './Button';

const PinVerificationModal = ({ isOpen, onClose, onVerify, tableNumber }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);
  const { tableName } = useTableStore();

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      // Focus first input when modal opens
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }
  }, [isOpen]);

  const handleInputChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newPin = pin.split('');
    newPin[index] = value;
    const updatedPin = newPin.join('');
    setPin(updatedPin);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setPin(pastedData);
    setError('');
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    if (pin.length !== 6) {
      setError('Please enter a 6-digit PIN');
      return;
    }

    setIsLoading(true);
    try {
      await onVerify(pin);
    } catch (error) {
      setError('Invalid PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-secondary rounded-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-light hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Table Info */}
        <div className="text-center mb-6">
          <p className="text-neutral-light mb-2">{tableName || 'Table N/A'}</p>
          <p className="text-white text-sm">Enter the 6-digit PIN to continue</p>
        </div>

        {/* PIN Input */}
        <div className="flex justify-center space-x-3 mb-6">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="1"
              value={pin[index] || ''}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-12 text-center text-white text-xl font-semibold bg-background-primary border border-neutral-medium rounded-lg focus:border-accent focus:outline-none"
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center mb-4">
            <p className="text-primary text-sm">{error}</p>
          </div>
        )}


        {/* Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleVerify}
            disabled={pin.length !== 6 || isLoading}
            className="w-full"
          >
            {isLoading ? 'Placing Order...' : 'Place Order'}
          </Button>
          <Button 
            onClick={handleClose}
            variant="secondary"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PinVerificationModal;
