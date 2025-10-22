# POS Mobile Backend

Backend API for POS Mobile application built with Node.js, Express, and MongoDB.

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the environment variables with your MongoDB connection string and JWT secret.

## Running the Application

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All routes except `/auth/login` and `/auth/register` require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Available Routes

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user (Protected)

#### Products
- `GET /products` - Get all products (Protected)
- `GET /products/:id` - Get single product (Protected)
- `POST /products` - Create product (Admin/Manager)
- `PUT /products/:id` - Update product (Admin/Manager)
- `DELETE /products/:id` - Delete product (Admin)

#### Categories
- `GET /categories` - Get all categories (Protected)
- `GET /categories/:id` - Get single category (Protected)
- `POST /categories` - Create category (Admin/Manager)
- `PUT /categories/:id` - Update category (Admin/Manager)
- `DELETE /categories/:id` - Delete category (Admin)

#### Orders
- `GET /orders` - Get all orders (Protected)
- `GET /orders/:id` - Get single order (Protected)
- `POST /orders` - Create order (Protected)
- `GET /orders/stats/summary` - Get order statistics (Admin/Manager)

#### Users
- `GET /users` - Get all users (Admin)
- `GET /users/:id` - Get single user (Admin)
- `PUT /users/:id` - Update user (Admin)
- `DELETE /users/:id` - Delete user (Admin)

## User Roles

- **admin** - Full access to all resources
- **manager** - Can manage products, categories, and view statistics
- **cashier** - Can process orders and view products

## Testing

```bash
npm test
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.js  # MongoDB connection
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   │   └── auth.middleware.js
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   └── server.js       # Entry point
├── .env.example        # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

