# Session Management System

## Overview

This document describes the comprehensive session management system implemented to secure customer access and prevent unauthorized usage after leaving the restaurant.

## Problem Statement

Previously, customers who scanned a QR code and placed orders could return hours or days later with valid JWT tokens and potentially access the system from outside the restaurant. This created security and business logic issues.

## Solution: Hybrid Session-Based Authentication

The system now implements a **hybrid approach** combining:
1. Session invalidation on bill settlement
2. Table-session binding
3. Time-based auto-expiration for unused sessions
4. Strict session validation on every request

---

## How It Works

### 1. **Session Lifecycle**

#### **Session Start (QR Code Scan)**
- Customer scans QR code containing encrypted table data (tableId, tableName)
- Customer enters mobile number and authenticates
- A new session is created with:
  - `sessionActive = true`
  - `sessionStartedAt = current timestamp`
  - `tableId` and `tableName` stored
  - `activeOrderIds = []` (empty array)

**Important:** If customer already has an active session (rescanning QR), the old session is terminated and all existing tokens are invalidated before starting new session.

#### **Placing Orders**
- Customer can place multiple orders during the session
- Each order's `orderNumber` is added to `customer.activeOrderIds[]`
- Table becomes occupied (`isAvailable = false`) when first order is placed
- Subsequent orders are added to the same session without changing table status

#### **Session End (Bill Settlement)**
- When customer settles the bill, ALL orders in the session are settled together
- Total bill amount is calculated from all orders
- Actions taken:
  1. All orders marked as `billIsSettle = true` and `orderStatus = completed`
  2. Table marked as available (`isAvailable = true`, `orderId = null`)
  3. Customer session ended (`sessionActive = false`, `sessionEndedAt = timestamp`)
  4. All customer tokens (access & refresh) are blacklisted/invalidated
  5. Customer's `activeOrderIds` cleared

**Result:** Customer is immediately locked out. Any subsequent API calls return 401 with `sessionEnded: true`.

---

### 2. **Session Validation (Security)**

On every protected API request, the middleware checks:

1. **Token Validity** ✓ Is JWT token valid and not expired?
2. **Token Not Blacklisted** ✓ Is token in blacklist?
3. **Customer Exists** ✓ Does customer record exist?
4. **Session Active** ✓ Is `customer.sessionActive === true`?
5. **Session Timeout** ✓ If no orders placed, has session exceeded 30 minutes?

If ANY check fails → **401 Unauthorized** with appropriate message.

---

### 3. **Auto-Cleanup (Scheduled Tasks)**

The system runs automated cleanup every hour:

#### **Expired Sessions Cleanup**
- Finds sessions that are active but have no orders
- If session age > 30 minutes → auto-expire
- Invalidates all tokens for those customers

#### **Old Ended Sessions Cleanup**
- Removes session metadata for sessions ended > 7 days ago
- Cleans up database

#### **Expired Tokens Cleanup**
- Removes blacklisted tokens that have already expired
- Removes expired refresh tokens

**Configuration** (see `backend/src/utils/sessionCleanup.js`):
```javascript
UNUSED_SESSION_TIMEOUT: 30 minutes
ENDED_SESSION_RETENTION: 7 days
CLEANUP_INTERVAL: 1 hour
```

---

## Implementation Details

### Backend Changes

#### 1. **Customer Model** (`backend/src/models/Customer.model.js`)
New fields:
```javascript
{
  sessionActive: Boolean,          // Is session currently active?
  sessionStartedAt: Date,           // When did session start?
  sessionEndedAt: Date,             // When did session end?
  activeOrderIds: [String],         // Array of order numbers in session
  lastOrderId: String               // Last order placed
}
```

Helper methods:
- `customer.startSession(tableId, tableName)` - Initialize new session
- `customer.endSession()` - Terminate session
- `customer.addOrderToSession(orderNumber)` - Add order to session

#### 2. **Customer Controller** (`backend/src/controllers/customer.controller.js`)

**Updated:** `registerCustomer()`
- Now accepts `tableId` and `tableName` from request body
- Ends any existing active session before starting new one
- Invalidates old tokens when new session starts

**New:** `logoutCustomer()`
- Manual logout endpoint
- Ends session and invalidates tokens
- Can be called by customer or admin

#### 3. **Customer Auth Middleware** (`backend/src/middleware/customerAuth.middleware.js`)

**Enhanced Validation:**
- Checks `sessionActive` status
- Validates session timeout (30 min if no orders)
- Auto-expires timed-out sessions
- Returns detailed error responses with flags:
  - `sessionEnded: true`
  - `sessionExpired: true`
  - `requiresNewScan: true`

#### 4. **Order Controller** (`backend/src/controllers/order.controller.js`)

**Updated:** `placeOrder()`
- Adds order to customer's `activeOrderIds`
- Marks table as occupied only on first order
- Logs subsequent orders without changing table status

**Updated:** `settleBill()`
- Now settles ALL orders in customer's session (not just one)
- Calculates total bill from all orders
- Ends session after settlement
- Invalidates all tokens
- Makes table available

#### 5. **Session Cleanup Utility** (`backend/src/utils/sessionCleanup.js`)

**Functions:**
- `cleanupExpiredSessions()` - Auto-expire unused sessions
- `cleanupOldEndedSessions()` - Remove old session data
- `cleanupExpiredTokens()` - Remove expired blacklisted tokens
- `cleanupExpiredRefreshTokens()` - Remove expired refresh tokens
- `runAllCleanupTasks()` - Execute all cleanup tasks
- `initializeScheduledCleanup()` - Start scheduled cleanup (runs every hour)

**Initialization:** Added to `backend/src/server.js` on startup.

---

### Frontend Changes

#### 1. **API Interceptor** (`frontend/src/services/api.js`)

**Enhanced Response Interceptor:**
- Detects session-ended responses (`sessionEnded`, `sessionExpired`, `requiresNewScan`)
- Automatically logs out user
- Redirects to login/QR scan page with message
- Implements token refresh on `requiresRefresh` flag

#### 2. **Customer Service** (`frontend/src/services/customerService.js`)

**Updated:** `register()`
- Now accepts `tableId` and `tableName` parameters
- Passes table data to backend for session binding

**New Methods:**
- `logout()` - Manual logout
- `getMe()` - Get customer info

#### 3. **Login Page** (`frontend/src/pages/Login.jsx`)

**Updated:**
- Passes `tableId` and `tableName` to registration
- Displays session-ended messages from URL params
- Shows error messages for 5 seconds

---

## API Endpoints

### Customer Routes (`/api/v1/customer`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Register/login customer, start session |
| POST | `/refresh-token` | Public | Refresh access token |
| GET | `/me` | Protected | Get customer info |
| POST | `/logout` | Protected | Logout and end session |

**New Request Format for `/register`:**
```json
{
  "mobileNumber": 712345678,
  "mobileType": "android",
  "uniqueId": 123456789,
  "tableId": "64abc123...",
  "tableName": "Table 5"
}
```

### Order Routes (`/api/v1/order`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/place` | Protected | Place order |
| PATCH | `/settle?paymentMethod=cash` | Protected | Settle ALL session orders |

**Updated Response for `/settle`:**
```json
{
  "success": true,
  "message": "Bill settled successfully. Thank you for your visit!",
  "data": {
    "settledOrders": ["ORD-20251023-0001", "ORD-20251023-0002"],
    "totalAmount": 2500,
    "orderCount": 2
  },
  "sessionEnded": true,
  "requiresNewScan": true
}
```

---

## Error Responses

### Session Ended
```json
{
  "success": false,
  "message": "Your session has ended. Please scan the QR code again.",
  "sessionEnded": true,
  "requiresNewScan": true
}
```

### Session Expired (Timeout)
```json
{
  "success": false,
  "message": "Your session has expired. Please scan the QR code again.",
  "sessionExpired": true,
  "requiresNewScan": true
}
```

### Token Expired (Refresh Available)
```json
{
  "success": false,
  "message": "Token has expired. Please refresh your token.",
  "requiresRefresh": true
}
```

---

## User Flows

### Happy Path: Customer Orders and Pays

1. Customer scans QR code → Redirected to login with encrypted table data
2. Customer enters mobile number → Session created, tokens issued
3. Customer browses menu and places order #1 → Table marked occupied, order added to session
4. Customer places order #2 → Added to same session
5. Customer requests bill settlement → Both orders settled, session ended, tokens invalidated
6. Customer closes browser
7. **Customer returns hours later** → Opens old browser tab
8. App makes API request → **401 Unauthorized: Session ended**
9. Customer redirected to login with message "Your session has ended. Please scan the QR code again."

### Edge Case: Customer Never Orders

1. Customer scans QR code and logs in → Session created
2. Customer browses but never places order
3. After 30 minutes → Session auto-expires
4. Customer tries to interact → **401 Unauthorized: Session expired**
5. Redirected to scan QR again

### Edge Case: Customer Scans QR Twice

1. Customer scans QR code → Session 1 created
2. Customer places order
3. Customer scans SAME or DIFFERENT QR code again
4. New session creation → **Old session terminated, old tokens invalidated**
5. Customer continues with new session

---

## Configuration

### Environment Variables

No new environment variables required. Uses existing:
- `JWT_SECRET` - For token generation/verification
- `PORT` - Server port
- `MONGODB_URI` - Database connection

### Timeouts & Retention

Located in `backend/src/utils/sessionCleanup.js`:

```javascript
CLEANUP_CONFIG = {
  UNUSED_SESSION_TIMEOUT: 30 * 60 * 1000,      // 30 minutes
  ENDED_SESSION_RETENTION: 7 * 24 * 60 * 60 * 1000,  // 7 days
}
```

**To modify:**
1. Edit values in `sessionCleanup.js`
2. Restart server
3. Changes apply to all new sessions

---

## Testing

### Manual Testing Checklist

- [ ] Customer can scan QR and login successfully
- [ ] Customer can place multiple orders in one session
- [ ] Table shows as occupied after first order
- [ ] Bill settlement settles all orders in session
- [ ] Customer is logged out after bill settlement
- [ ] Customer cannot access app after bill settlement
- [ ] Session expires after 30 min with no orders
- [ ] Scanning new QR invalidates old session
- [ ] Cleanup tasks run every hour (check logs)

### Test Scenarios

**Scenario 1: Normal Flow**
```
1. Scan QR → Login → Place order → Settle → Try to access → BLOCKED ✓
```

**Scenario 2: Multiple Orders**
```
1. Scan QR → Login → Place order 1 → Place order 2 → Settle
2. Verify both orders settled together ✓
```

**Scenario 3: Session Timeout**
```
1. Scan QR → Login → Wait 31 minutes → Try to order → BLOCKED ✓
```

**Scenario 4: Rescan QR**
```
1. Scan QR → Login (Session 1) → Scan QR again → Login (Session 2)
2. Session 1 tokens should be invalid ✓
```

---

## Logging

All session-related actions are logged with Winston:

**Session Created:**
```
[INFO] New session started {
  customerId, tableId, tableName, sessionStartedAt
}
```

**Session Ended:**
```
[INFO] Customer session ended after bill settlement {
  customerId
}
```

**Session Expired:**
```
[WARN] Customer access denied: Session timed out without order {
  customerId, sessionStartedAt, sessionAge
}
```

**Cleanup:**
```
[INFO] Expired sessions cleanup completed {
  cleanedCount, customerIds
}
```

---

## Security Considerations

1. **Token Blacklisting:** All invalidated tokens stored in blacklist until natural expiry
2. **Session Binding:** Session tied to specific table during active period
3. **Auto-Expiration:** Unused sessions automatically cleaned up
4. **Multi-Order Support:** All orders in session settled atomically
5. **No Order History Access:** Customers cannot view past orders after session ends

---

## Troubleshooting

### Issue: Customer blocked immediately after login
**Cause:** Session not properly started
**Fix:** Check that `tableId` and `tableName` are passed in registration request

### Issue: Cleanup not running
**Cause:** Server not calling `initializeScheduledCleanup()`
**Fix:** Verify `server.js` imports and calls the function

### Issue: Tokens still valid after bill settlement
**Cause:** Blacklist not working or tokens not being invalidated
**Fix:** Check `TokenBlacklist` and `RefreshToken` updates in `settleBill()`

### Issue: Session expires too quickly/slowly
**Cause:** Incorrect timeout configuration
**Fix:** Adjust `UNUSED_SESSION_TIMEOUT` in `sessionCleanup.js`

---

## Future Enhancements

1. **Admin Dashboard:** View active sessions, force-end sessions
2. **Session Analytics:** Track average session duration, orders per session
3. **Configurable Timeouts:** Make timeouts configurable via settings API
4. **Grace Period:** Allow brief re-entry after bill settlement (e.g., 5 minutes)
5. **Push Notifications:** Notify customer before session expires

---

## Conclusion

This session management system ensures customers can only access the app while actively dining at the restaurant. Once the bill is settled or the session expires, access is immediately revoked, requiring a fresh QR scan to start a new session.

**Key Benefits:**
- ✅ Prevents unauthorized access after leaving restaurant
- ✅ Supports multiple orders per session
- ✅ Auto-cleanup of abandoned sessions
- ✅ Strong security with token blacklisting
- ✅ Clear user feedback on session status

For questions or issues, consult the logs or refer to the implementation files listed above.

