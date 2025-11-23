# Real-Time Cashier System Integration Guide

This document explains how the cashier system can receive real-time notifications when PINs are generated and orders are placed in the POS Mobile system.

## Overview

The POS Mobile backend uses **WebSocket (Socket.io)** to broadcast real-time events to connected cashier systems. When a PIN is generated or an order is placed, the backend automatically emits events that all connected cashier systems can listen to.

## Connection Details

### WebSocket Endpoint
- **URL**: `ws://your-backend-url/socket.io`
- **Protocol**: Socket.io (WebSocket with polling fallback)
- **Port**: Same as your HTTP server (default: 5001)

### Connection Example

```javascript
// Using Socket.io client library
import io from 'socket.io-client';

const socket = io('http://your-backend-url:5001', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Handle connection
socket.on('connect', () => {
  console.log('Connected to POS Mobile real-time updates');
});

// Handle disconnection
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

## Available Events

### 1. PIN Generated Event

**Event Name**: `pin_generated`

**Triggered When**: 
- A customer scans a QR code and registers/logs in
- A session PIN is generated for a table

**Event Data Structure**:
```javascript
{
  timestamp: "2024-01-15T10:30:45.123Z",  // ISO timestamp
  event: "pin_generated",
  data: {
    tableId: "65a1b2c3d4e5f6g7h8i9j0k1",  // Table MongoDB ID
    tableName: "Table 5",                  // Table name
    sessionPin: "742856",                  // 6-digit PIN
    customerId: "65a1b2c3d4e5f6g7h8i9j0k2", // Customer MongoDB ID
    customerMobileNumber: 987654321,       // Customer mobile number
    pinGeneratedAt: "2024-01-15T10:30:45.000Z" // PIN generation timestamp
  }
}
```

**Example Listener**:
```javascript
socket.on('pin_generated', (eventData) => {
  console.log('New PIN Generated:', eventData);
  
  // Display PIN on cashier screen
  const { tableName, sessionPin, customerMobileNumber } = eventData.data;
  
  // Show notification or update UI
  showNotification(`PIN for ${tableName}: ${sessionPin}`);
  displayPinOnScreen({
    table: tableName,
    pin: sessionPin,
    customer: customerMobileNumber
  });
});
```

### 2. Order Created Event

**Event Name**: `order_created`

**Triggered When**: 
- A new order is placed by a customer
- Items are added to an existing order (when `isUpdate: true`)

**Event Data Structure**:
```javascript
{
  timestamp: "2024-01-15T10:35:20.456Z",  // ISO timestamp
  event: "order_created",
  data: {
    orderId: "65a1b2c3d4e5f6g7h8i9j0k3",   // Order MongoDB ID
    orderNumber: "20240115-103520-1234",   // Unique order number
    tableId: "65a1b2c3d4e5f6g7h8i9j0k1",   // Table MongoDB ID (or null)
    tableName: "Table 5",                   // Table name (or null)
    customerId: "65a1b2c3d4e5f6g7h8i9j0k2", // Customer MongoDB ID
    customerMobileNumber: 987654321,        // Customer mobile number
    items: [                                // Array of order items
      {
        itemId: "65a1b2c3d4e5f6g7h8i9j0k4",
        itemName: "Pizza Margherita",
        itemImage: "https://...",
        quantity: 2,
        price: 15.99,                       // Discounted price per item
        actualPrice: 18.99,                 // Original price before discount
        discount: 15,                       // Discount percentage
        selectedModifiers: [                // Modifiers/add-ons
          {
            modifierName: "Extra Cheese",
            modifierPrice: 2.50
          }
        ],
        itemTotal: 33.48                    // Total for this item (price + modifiers) * quantity
      }
    ],
    subtotal: 33.48,                       // Subtotal before discount
    discount: 6.00,                        // Total discount amount
    tax: 0,                                // Tax amount
    total: 33.48,                          // Final total
    paymentStatus: "pending",              // Payment status: "pending" | "completed" | "cancelled" | "refunded"
    orderStatus: "new",                    // Order status: "new" | "preparing" | "ready" | "served" | "completed" | "cancelled"
    createdAt: "2024-01-15T10:35:20.000Z", // Order creation timestamp
    isUpdate: false                        // true if items added to existing order, false if new order
  }
}
```

**Example Listener**:
```javascript
socket.on('order_created', (eventData) => {
  console.log('New Order Created:', eventData);
  
  const order = eventData.data;
  
  // Update cashier UI
  if (order.isUpdate) {
    showNotification(`Order ${order.orderNumber} updated - Items added`);
  } else {
    showNotification(`New order ${order.orderNumber} from ${order.tableName || 'Customer'}`);
  }
  
  // Add order to cashier display/list
  addOrderToDisplay({
    orderNumber: order.orderNumber,
    tableName: order.tableName,
    items: order.items,
    total: order.total,
    status: order.orderStatus,
    createdAt: order.createdAt
  });
});
```

## Complete Integration Example

```javascript
import io from 'socket.io-client';

class CashierRealtimeClient {
  constructor(serverUrl) {
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to POS Mobile real-time server');
      this.onConnected();
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      this.onDisconnected(reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
    
    // Authentication response (optional)
    this.socket.on('authenticated', (data) => {
      console.log('Authenticated:', data);
    });
    
    // Business events
    this.socket.on('pin_generated', (eventData) => {
      this.handlePinGenerated(eventData);
    });
    
    this.socket.on('order_created', (eventData) => {
      this.handleOrderCreated(eventData);
    });
  }
  
  // Optional: Send authentication (if implemented)
  authenticate(authToken) {
    this.socket.emit('authenticate', {
      token: authToken,
      clientType: 'cashier'
    });
  }
  
  // Handle PIN generated event
  handlePinGenerated(eventData) {
    const { tableName, sessionPin, customerMobileNumber } = eventData.data;
    
    // Display on cashier screen
    this.displayPin({
      table: tableName,
      pin: sessionPin,
      customer: customerMobileNumber,
      timestamp: eventData.timestamp
    });
    
    // Optional: Play sound notification
    this.playNotificationSound();
  }
  
  // Handle order created event
  handleOrderCreated(eventData) {
    const order = eventData.data;
    
    // Update order list/queue
    this.addOrUpdateOrder(order);
    
    // Show notification
    this.showOrderNotification({
      orderNumber: order.orderNumber,
      tableName: order.tableName,
      total: order.total,
      itemCount: order.items.length,
      isUpdate: order.isUpdate
    });
    
    // Optional: Play sound notification
    this.playNotificationSound();
  }
  
  // Implement these methods based on your UI framework
  onConnected() {
    // Update UI to show connected status
  }
  
  onDisconnected(reason) {
    // Update UI to show disconnected status
    // Implement reconnection logic if needed
  }
  
  displayPin(pinData) {
    // Update UI to show PIN
    // Example: Update a table status panel
  }
  
  addOrUpdateOrder(order) {
    // Add/update order in your order management UI
  }
  
  showOrderNotification(orderInfo) {
    // Show toast/alert notification
  }
  
  playNotificationSound() {
    // Play audio notification
  }
  
  disconnect() {
    this.socket.disconnect();
  }
}

// Usage
const cashierClient = new CashierRealtimeClient('http://localhost:5001');

// Optional: Authenticate if needed
// cashierClient.authenticate('your-auth-token');
```

## Event Flow Diagram

```
Mobile POS                    Backend                    Cashier System
    |                            |                            |
    | 1. Customer scans QR       |                            |
    |--------------------------->|                            |
    |                            |                            |
    | 2. PIN Generated           |                            |
    |<---------------------------|                            |
    |                            |                            |
    |                            | 3. Emit 'pin_generated'    |
    |                            |--------------------------->|
    |                            |                            | Display PIN
    |                            |                            |
    | 4. Customer places order   |                            |
    |--------------------------->|                            |
    |                            |                            |
    | 5. Order Created           |                            |
    |<---------------------------|                            |
    |                            |                            |
    |                            | 6. Emit 'order_created'    |
    |                            |--------------------------->|
    |                            |                            | Update Order List
```

## Error Handling

The Socket.io client automatically handles reconnection. However, you should implement proper error handling:

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  // Show error message to cashier
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Reconnection attempt ${attemptNumber}`);
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
  // Show critical error - manual refresh may be needed
});
```

## Security Considerations

1. **CORS**: Currently, the backend allows all origins (`origin: '*'`). In production, restrict this to your cashier system's domain:
   ```javascript
   cors: {
     origin: 'https://your-cashier-domain.com',
     credentials: true,
   }
   ```

2. **Authentication**: Currently, all connections are accepted. You can implement authentication by:
   - Passing a token in the connection query: `io('http://...', { query: { token: '...' } })`
   - Handling authentication in the `authenticate` event handler

3. **Rate Limiting**: Consider implementing rate limiting for Socket.io connections.

## Testing

You can test the connection using a simple HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Cashier Test Client</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Cashier Real-Time Test</h1>
  <div id="status">Connecting...</div>
  <div id="events"></div>

  <script>
    const socket = io('http://localhost:5001');
    const statusDiv = document.getElementById('status');
    const eventsDiv = document.getElementById('events');

    socket.on('connect', () => {
      statusDiv.textContent = '✅ Connected';
      statusDiv.style.color = 'green';
    });

    socket.on('disconnect', () => {
      statusDiv.textContent = '❌ Disconnected';
      statusDiv.style.color = 'red';
    });

    socket.on('pin_generated', (data) => {
      const eventDiv = document.createElement('div');
      eventDiv.innerHTML = `<strong>PIN Generated:</strong><br>
        Table: ${data.data.tableName}<br>
        PIN: ${data.data.sessionPin}<br>
        Customer: ${data.data.customerMobileNumber}`;
      eventsDiv.insertBefore(eventDiv, eventsDiv.firstChild);
    });

    socket.on('order_created', (data) => {
      const eventDiv = document.createElement('div');
      eventDiv.innerHTML = `<strong>Order Created:</strong><br>
        Order: ${data.data.orderNumber}<br>
        Table: ${data.data.tableName || 'N/A'}<br>
        Total: $${data.data.total}<br>
        Items: ${data.data.items.length}`;
      eventsDiv.insertBefore(eventDiv, eventsDiv.firstChild);
    });
  </script>
</body>
</html>
```

## Troubleshooting

1. **Connection fails**: 
   - Check if backend server is running
   - Verify CORS settings
   - Check firewall/network settings

2. **Events not received**:
   - Verify connection is established (`socket.connected`)
   - Check browser console for errors
   - Verify event names match exactly

3. **Performance issues**:
   - Monitor number of connected clients
   - Consider using rooms/namespaces for different cashier stations
   - Implement message queuing for offline periods

## Support

For issues or questions, check the backend logs for Socket.io events and connection information.

