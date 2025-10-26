import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useOutletStore } from '../store/outletStore';
import { orderService } from '../services/orderService';
import Button from '../components/Button';

const Orders = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const { outletCurrency } = useOutletStore();
  const [orders, setOrders] = useState([]);
  
  // Get currency from outlet config, fallback to 'Rs' if not available
  const currency = outletCurrency || 'Rs';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accessToken) {
      fetchOrders();
    }
  }, [accessToken]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Get stored orderIds from localStorage
      const orderIds = JSON.parse(localStorage.getItem('orderIds') || '[]');
      
      if (orderIds.length === 0) {
        setOrders([]);
        return;
      }
      
      // Fetch each order individually
      const orderPromises = orderIds.map(orderId => 
        orderService.getOrderById(orderId).catch(error => {
          console.error(`Error fetching order ${orderId}:`, error);
          return null; // Return null for failed requests
        })
      );
      
      const orderResponses = await Promise.all(orderPromises);
      
      // Filter out null responses and extract data
      const validOrders = orderResponses
        .filter(response => response && response.success)
        .map(response => response.data);
      
      // Remove duplicates based on order ID
      const uniqueOrders = validOrders.filter((order, index, self) => 
        index === self.findIndex(o => o._id === order._id)
      );
      
      setOrders(uniqueOrders);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'text-accent';
      case 'preparing':
        return 'text-yellow-500';
      case 'ready':
        return 'text-green-500';
      case 'completed':
        return 'text-neutral-light';
      default:
        return 'text-neutral-light';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'new':
        return 'New Order';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-background-secondary">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-semibold">My Orders</h1>
          <div className="w-8"></div>
        </div>

        {/* Loading */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-neutral-light">Loading orders...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-primary flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-background-secondary">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-semibold">My Orders</h1>
          <div className="w-8"></div>
        </div>

        {/* Error */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 bg-background-secondary rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Error Loading Orders</h2>
          <p className="text-neutral-light text-center mb-6">
            {error}
          </p>
          <Button onClick={fetchOrders}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background-primary flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-background-secondary">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-semibold">My Orders</h1>
          <div className="w-8"></div>
        </div>

        {/* Empty Orders */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 bg-background-secondary rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-neutral-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-neutral-light text-center mb-6">
            Your order history will appear here
          </p>
          <Button onClick={() => navigate('/home')}>
            Browse Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-background-secondary">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white text-xl font-semibold">My Orders</h1>
        <div className="w-8"></div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-background-secondary rounded-2xl p-6">
              {/* Order Header */}
              <div className="mb-4">
                <h3 className="text-white text-lg font-semibold">
                  Order #{order.orderNumber || order._id.slice(-6)}
                </h3>
              </div>

              {/* Order Items */}
              <div className="space-y-2 mb-4">
                {order.items?.map((item, index) => {
                  const quantity = item.quantity || 1;
                  const discount = item.discount || 0;
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-neutral-light text-sm mr-2">
                            {quantity}x
                          </span>
                          <span className="text-white text-sm">
                            {item.itemName}
                          </span>
                        </div>
                        <div className="text-right">
                          {discount > 0 && item.actualPrice ? (
                            <div className="flex flex-col items-end">
                              <span className="text-neutral-light text-sm line-through">
                                {currency} {item.actualPrice.toFixed(2)}
                              </span>
                              <span className="text-white text-sm font-medium">
                                {currency} {item.itemTotal.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-light text-sm">
                              {currency} {item.itemTotal.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Show modifiers if they exist */}
                      {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                        <div className="ml-6 space-y-1">
                          {item.selectedModifiers.map((modifier, modIndex) => (
                            <div key={modIndex} className="flex items-center justify-between">
                              <span className="text-neutral-light text-xs">
                                + {modifier.modifierName}
                              </span>
                              {modifier.modifierPrice > 0 && (
                                <span className="text-neutral-light text-xs">
                                  +{currency} {modifier.modifierPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Discount Display */}
              {order.discount > 0 && (
                <div className="mb-4 p-3 bg-background-primary rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-light text-sm">Discount Applied</span>
                    <span className="text-green-500 text-sm font-medium">
                      -{currency} {order.discount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Order Footer */}
              <div className="pt-4 border-t border-neutral-dark">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-neutral-light text-sm">
                    Table: {order.tableName || 'N/A'}
                  </div>
                  <div className="text-neutral-light text-sm">
                    {order.items?.length || 0} items
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-neutral-light text-sm">
                    {formatDate(order.createdAt)}
                  </div>
                  <div className="text-white text-lg font-semibold">
                    {currency} {order.total?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;
