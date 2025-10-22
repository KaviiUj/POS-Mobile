# POS Mobile - Point of Sale System

A modern, full-stack Point of Sale (POS) system built with the MERN stack (MongoDB, Express.js, React, Node.js).

## 🚀 Features

- **User Authentication & Authorization** - Secure login with JWT tokens and role-based access control
- **Product Management** - Add, edit, delete, and manage products with categories
- **Category Management** - Organize products into customizable categories
- **Point of Sale Interface** - Intuitive POS interface for quick sales
- **Order Management** - Track and view order history
- **Real-time Inventory** - Automatic stock updates with each sale
- **Dashboard Analytics** - View sales statistics and performance metrics
- **Responsive Design** - Mobile-first design that works on all devices

## 📁 Project Structure

```
POS-Mobile/
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── config/         # Configuration files (database, etc.)
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware (auth, etc.)
│   │   └── server.js       # Entry point
│   └── package.json
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # State management (Zustand)
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Icons** - Icons
- **React Toastify** - Notifications

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
API_VERSION=v1
```

4. Start the backend server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
VITE_API_URL=http://localhost:5000/api/v1
```

4. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🔑 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

### Products
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/:id` - Get single product
- `POST /api/v1/products` - Create product (Admin/Manager)
- `PUT /api/v1/products/:id` - Update product (Admin/Manager)
- `DELETE /api/v1/products/:id` - Delete product (Admin)

### Categories
- `GET /api/v1/categories` - Get all categories
- `GET /api/v1/categories/:id` - Get single category
- `POST /api/v1/categories` - Create category (Admin/Manager)
- `PUT /api/v1/categories/:id` - Update category (Admin/Manager)
- `DELETE /api/v1/categories/:id` - Delete category (Admin)

### Orders
- `GET /api/v1/orders` - Get all orders
- `GET /api/v1/orders/:id` - Get single order
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/stats/summary` - Get order statistics (Admin/Manager)

### Users
- `GET /api/v1/users` - Get all users (Admin)
- `GET /api/v1/users/:id` - Get single user (Admin)
- `PUT /api/v1/users/:id` - Update user (Admin)
- `DELETE /api/v1/users/:id` - Delete user (Admin)

## 👥 User Roles

- **Admin** - Full access to all features
- **Manager** - Manage products, categories, and view reports
- **Cashier** - Process sales and view orders

## 🎨 Screenshots

*(Add screenshots of your application here)*

## 🚧 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

## 📝 Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT
- `JWT_EXPIRE` - JWT expiration time

### Frontend (.env)
- `VITE_API_URL` - Backend API URL

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Your Name

## 🙏 Acknowledgments

- React Icons for beautiful icons
- Tailwind CSS for styling
- MongoDB Atlas for database hosting
- Vite for fast development experience

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

---

Made with ❤️ by Your Name

