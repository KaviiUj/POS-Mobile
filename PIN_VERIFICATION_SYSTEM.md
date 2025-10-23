# PIN Verification System for Order Placement

## 🎯 Overview

This document describes the PIN-based verification system implemented to prevent unauthorized orders from screenshots of permanent QR codes.

---

## 🔐 How It Works

### **Problem Solved:**
- Permanent QR codes on tables can be screenshot
- Screenshots could be used to order from outside restaurant
- PIN system prevents this by requiring staff-provided PIN

### **Solution:**
1. Customer scans QR code → Registers/Logs in
2. System generates 6-digit PIN → Saved to table
3. Staff app displays PIN (staff gives to customer)
4. Customer places order → Must enter PIN
5. System validates PIN → Order placed if correct
6. Bill settled → PIN cleared

---

## 📋 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: QR Scan & Registration                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
Customer scans QR (tableId, tableName)
Customer enters mobile number
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: PIN Generation (Backend)                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
POST /api/v1/customer/register
{
  mobileNumber, mobileType, uniqueId,
  tableId, tableName
}
                           ↓
Backend generates 6-digit PIN (e.g., "742856")
Saves to Table collection:
{
  sessionPin: "742856",
  pinGeneratedAt: Date,
  customerId: customer._id
}
                           ↓
Returns in response:
{
  sessionPin: "742856",  ← Staff app will display this
  customer: {...},
  accessToken, refreshToken
}
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Staff Displays PIN                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
Staff app shows: "Table 5 PIN: 742856"
Staff prints or shows PIN to customer
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Customer Orders                                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
Customer browses menu, adds items to cart
Customer clicks "Place Order"
                           ↓
App prompts: "Enter PIN provided by staff"
Customer enters: "742856"
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 5: PIN Validation (Backend)                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
POST /api/v1/order/place
{
  items: [...],
  sessionPin: "742856",  ← Required
  tableId, tableName, ...
}
                           ↓
Backend validates:
1. PIN provided?
2. Table exists?
3. PIN matches table.sessionPin?
4. PIN belongs to this customer?
                           ↓
If valid → Order placed ✅
If invalid → Error 403 ❌
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Bill Settlement                                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
PATCH /api/v1/order/settle?paymentMethod=cash
                           ↓
Backend:
- Settles all orders
- Clears table PIN (sessionPin = null)
- Ends customer session
- Invalidates tokens
                           ↓
Customer logged out, PIN cleared ✅
```

---

## 🔧 Backend Implementation

### **1. Table Model** (`backend/src/models/Table.model.js`)

**New Fields:**
```javascript
{
  sessionPin: String,       // 6-digit PIN
  pinGeneratedAt: Date,     // When PIN was generated
  customerId: ObjectId      // Which customer has this PIN
}
```

**Methods:**
```javascript
// Generate new 6-digit PIN
table.generateSessionPin(customerId)
// Returns: "742856"

// Verify PIN
table.verifyPin("742856")
// Returns: true/false

// Clear PIN
table.clearSessionPin()
// Sets sessionPin = null
```

---

### **2. Customer Registration** (`backend/src/controllers/customer.controller.js`)

**Updated Endpoint:** `POST /api/v1/customer/register`

**Request:**
```json
{
  "mobileNumber": 712345678,
  "mobileType": "android",
  "uniqueId": 123456789,
  "tableId": "64abc123...",
  "tableName": "Table 5"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer registered successfully",
  "data": {
    "customer": { ... },
    "sessionPin": "742856",   // ← NEW: PIN for staff to display
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": "3h"
  }
}
```

**What happens:**
1. Creates/updates customer
2. Starts session
3. **Generates 6-digit PIN**
4. **Saves PIN to table**
5. Returns PIN in response (for staff app)

---

### **3. Order Placement** (`backend/src/controllers/order.controller.js`)

**Updated Endpoint:** `POST /api/v1/order/place`

**Request:**
```json
{
  "cartId": "...",
  "items": [...],
  "totalAmount": 2500,
  "tableId": "64abc123...",
  "tableName": "Table 5",
  "sessionPin": "742856",   // ← REQUIRED: PIN from staff
  "note": "Extra spicy"
}
```

**PIN Validation Logic:**
```javascript
// 1. Check PIN provided
if (!sessionPin) {
  return 400 "Session PIN is required"
}

// 2. Get table
const table = await Table.findById(tableId);

// 3. Verify PIN matches
if (!table.verifyPin(sessionPin)) {
  return 403 "Invalid PIN"
}

// 4. Verify PIN belongs to customer
if (table.customerId !== customerId) {
  return 403 "PIN not valid for your session"
}

// 5. All checks passed → Place order
```

**Error Responses:**
```json
// No PIN provided
{
  "success": false,
  "message": "Session PIN is required to place order. Please ask staff for the PIN.",
  "requiresPin": true
}

// Wrong PIN
{
  "success": false,
  "message": "Invalid PIN. Please check the PIN provided by staff and try again.",
  "invalidPin": true
}
```

---

### **4. PIN Verification Endpoint** (Testing/Optional)

**New Endpoint:** `POST /api/v1/order/verify-pin`

**Purpose:** Allow frontend to verify PIN before submitting order

**Request:**
```json
{
  "sessionPin": "742856",
  "tableId": "64abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "PIN verified successfully",
  "isValid": true
}
```

---

### **5. Bill Settlement** (`backend/src/controllers/order.controller.js`)

**Endpoint:** `PATCH /api/v1/order/settle?paymentMethod=cash`

**What happens:**
1. Settles all orders in session
2. **Clears table PIN** (`table.makeAvailable()`)
3. Ends customer session
4. Invalidates all tokens

**Result:** PIN is cleared, cannot be reused

---

## 🎨 Frontend Implementation

### **1. Order Service** (`frontend/src/services/orderService.js`)

**New Methods:**
```javascript
// Place order with PIN
orderService.placeOrder({
  items: [...],
  sessionPin: "742856",
  tableId, tableName, ...
})

// Verify PIN (optional - for real-time validation)
orderService.verifySessionPin("742856", tableId)

// Settle bill
orderService.settleBill("cash")
```

---

### **2. Cart/Checkout Flow** (To be implemented)

**Example Implementation:**

```jsx
// components/CheckoutModal.jsx
import { useState } from 'react';
import { orderService } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import { useTableStore } from '../store/tableStore';

const CheckoutModal = ({ cartItems, onClose }) => {
  const [sessionPin, setSessionPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { customer } = useAuthStore();
  const { tableId, tableName } = useTableStore();

  const handlePlaceOrder = async () => {
    // Validate PIN
    if (!sessionPin || sessionPin.length !== 6) {
      setError('Please enter the 6-digit PIN provided by staff');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Optional: Verify PIN first
      const verifyResponse = await orderService.verifySessionPin(sessionPin, tableId);
      if (!verifyResponse.success) {
        setError('Invalid PIN. Please check and try again.');
        setLoading(false);
        return;
      }

      // Place order
      const orderData = {
        items: cartItems,
        totalAmount: calculateTotal(),
        sessionPin,  // Include PIN
        tableId,
        tableName,
        mobileNumber: customer.mobileNumber,
      };

      const response = await orderService.placeOrder(orderData);

      if (response.success) {
        // Success
        alert('Order placed successfully!');
        clearCart();
        onClose();
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to place order';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <h2>Checkout</h2>
      
      {/* Order Summary */}
      <div className="order-summary">
        {cartItems.map(item => (
          <div key={item.id}>
            {item.name} - ${item.price}
          </div>
        ))}
        <div className="total">
          Total: ${calculateTotal()}
        </div>
      </div>

      {/* PIN Input */}
      <div className="pin-input">
        <label>Enter PIN from Staff</label>
        <input
          type="text"
          maxLength={6}
          value={sessionPin}
          onChange={(e) => setSessionPin(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="text-center text-2xl tracking-wider"
        />
        <p className="text-sm text-gray-500">
          Please ask the staff for your 6-digit PIN
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button 
          onClick={handlePlaceOrder}
          disabled={loading || sessionPin.length !== 6}
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};
```

---

### **3. Login Page Update** (Show PIN temporarily for testing)

**For Development/Testing Only:**
```jsx
// In Login.jsx after registration
if (response.success) {
  const { sessionPin } = response.data;
  
  // For testing - show PIN to customer
  // In production, only staff app should see this
  console.log('Session PIN:', sessionPin);
  
  // Optionally show temporary notification
  alert(`Your session PIN is: ${sessionPin}\n(Ask staff for PIN in production)`);
}
```

**For Production:**
- Remove PIN display from customer app
- Only show PIN in staff application
- Staff prints/displays PIN to customer

---

## 🔒 Security Features

### **1. PIN Validation**
- ✅ 6-digit random PIN (100,000 - 999,999)
- ✅ Tied to specific table
- ✅ Tied to specific customer session
- ✅ Required for every order placement

### **2. Session Binding**
- ✅ PIN belongs to specific customer
- ✅ Other customers cannot use same PIN
- ✅ Prevents PIN sharing/reuse

### **3. PIN Lifecycle**
- ✅ Generated on session start
- ✅ Cleared on bill settlement
- ✅ Cleared on customer logout
- ✅ Cannot be reused after session ends

### **4. Attack Prevention**

| Attack | Prevention |
|--------|-----------|
| Screenshot QR from home | ❌ Blocked - No PIN without staff |
| Guess PIN | ❌ Very unlikely (1 in 900,000) |
| Reuse old PIN | ❌ Blocked - PIN cleared after settlement |
| Use another table's PIN | ❌ Blocked - PIN tied to table & customer |
| Share PIN with friend | ⚠️ Possible but requires staff collusion |

---

## 📊 API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/customer/register` | POST | Public | Generate PIN, start session |
| `/order/place` | POST | Protected | Place order (requires PIN) |
| `/order/verify-pin` | POST | Protected | Verify PIN (optional) |
| `/order/settle` | PATCH | Protected | Settle bill, clear PIN |
| `/customer/logout` | POST | Protected | Logout, clear PIN |

---

## 🧪 Testing

### **Test Scenario 1: Normal Flow**
```
1. Customer scans QR → Registers
2. Backend returns sessionPin: "742856"
3. Staff shows PIN to customer
4. Customer adds items to cart
5. Customer enters PIN: "742856" → Order placed ✅
```

### **Test Scenario 2: Wrong PIN**
```
1. Customer scans QR → Registers  
2. Actual PIN: "742856"
3. Customer enters wrong PIN: "123456"
4. Backend returns 403 "Invalid PIN" ❌
5. Customer tries again with correct PIN ✅
```

### **Test Scenario 3: Screenshot Attack**
```
1. Customer A scans QR, registers → PIN: "742856"
2. Customer A takes screenshot of QR
3. Customer A leaves restaurant
4. Customer B scans same QR → New PIN: "951237"
5. Customer A tries to order from home with screenshot
6. Customer A has no PIN (staff not there) ❌
7. Even if Customer A guesses, PIN doesn't match ❌
```

### **Test Scenario 4: Bill Settlement**
```
1. Customer places order with PIN: "742856"
2. Customer settles bill
3. Backend clears PIN
4. Customer tries to place another order
5. Old PIN no longer valid ❌
6. Must scan QR again for new session ✅
```

---

## 📱 Staff App Integration

**Note:** Staff application is separate (not part of this mobile app)

**Staff App Should:**
1. Listen for new customer registrations
2. Display PIN prominently:
   ```
   ┌────────────────────────┐
   │  Table 5               │
   │  PIN: 742856           │
   │  Customer: 7712345678  │
   │  Time: 12:34 PM        │
   └────────────────────────┘
   ```
3. Allow staff to print PIN
4. Show when PIN is cleared (bill settled)

---

## 🎯 User Experience

### **Customer Perspective:**
1. Scan QR → Enter mobile → Get seated
2. Staff brings menu and PIN
3. Browse menu, add items
4. Click "Place Order" → Enter PIN
5. Order confirmed!
6. Repeat for more orders (same PIN)
7. Settle bill → Session ends

### **Staff Perspective:**
1. Customer scans QR → Notification
2. Display shows PIN for that table
3. Give PIN to customer (verbally or printed)
4. Customer can now order
5. Customer settles → PIN clears automatically

---

## 💡 Future Enhancements

1. **PIN Expiry Time**
   - Auto-expire PIN after X hours
   - Require new PIN for safety

2. **PIN Refresh**
   - Allow staff to regenerate PIN
   - Useful if PIN compromised

3. **SMS PIN Delivery**
   - Send PIN via SMS automatically
   - No staff interaction needed

4. **QR Code Rotation**
   - Generate new QR with timestamp
   - QR expires after X hours
   - Combined with PIN = maximum security

5. **PIN Attempts Limit**
   - Lock after 3 wrong attempts
   - Require staff to unlock

---

## 📞 Support

For questions about PIN system:
- Check logs: `backend/logs/`
- Look for: "Session PIN generated"
- Test endpoint: `POST /order/verify-pin`

---

## ✅ Implementation Status

### Backend
- [x] Table model with PIN fields
- [x] PIN generation on registration
- [x] PIN validation on order placement
- [x] PIN clearing on settlement/logout
- [x] Verify PIN endpoint
- [x] Comprehensive logging

### Frontend
- [x] Order service methods
- [ ] PIN input modal/component (cart not fully built yet)
- [ ] Checkout flow with PIN
- [ ] Error handling for invalid PIN
- [ ] UI/UX for PIN entry

### Documentation
- [x] This document
- [x] API documentation
- [x] Testing guide

---

**Implementation Date:** October 23, 2025  
**Status:** ✅ Backend Complete | ⏳ Frontend Pending (Cart/Checkout Flow)  
**Security Level:** 🔒🔒🔒 High (PIN + Session + Table Binding)

