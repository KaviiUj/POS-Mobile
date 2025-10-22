# POS Mobile Frontend

Frontend application for POS Mobile built with React, Vite, and Tailwind CSS.

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the API URL if needed (default: `http://localhost:5000/api/v1`).

## Running the Application

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Features

- **User Authentication** - Secure login with JWT
- **Dashboard** - Sales overview and statistics
- **POS Interface** - Quick and easy point of sale
- **Product Management** - CRUD operations for products
- **Category Management** - Organize products by categories
- **Order Management** - View and track orders
- **Responsive Design** - Works on mobile, tablet, and desktop

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router 6** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Icon library
- **React Toastify** - Toast notifications

## Project Structure

```
frontend/
├── public/            # Static assets
├── src/
│   ├── components/   # Reusable components
│   │   └── Layout.jsx
│   ├── pages/        # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── POS.jsx
│   │   ├── Products.jsx
│   │   ├── Categories.jsx
│   │   └── Orders.jsx
│   ├── services/     # API services
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── categoryService.js
│   │   └── orderService.js
│   ├── store/        # State management
│   │   ├── authStore.js
│   │   └── cartStore.js
│   ├── utils/        # Utility functions
│   ├── App.jsx       # Main app component
│   ├── main.jsx      # Entry point
│   └── index.css     # Global styles
├── .env.example      # Environment variables template
├── .eslintrc.cjs     # ESLint configuration
├── .gitignore
├── index.html        # HTML template
├── package.json
├── postcss.config.js # PostCSS configuration
├── tailwind.config.js # Tailwind configuration
├── vite.config.js    # Vite configuration
└── README.md
```

## Available Routes

- `/login` - Login page
- `/dashboard` - Dashboard overview
- `/pos` - Point of Sale interface
- `/products` - Product management
- `/categories` - Category management
- `/orders` - Order history

## State Management

The application uses Zustand for state management with two stores:

### Auth Store
- Manages user authentication state
- Persists to localStorage
- Methods: `setAuth()`, `logout()`

### Cart Store
- Manages shopping cart in POS
- Methods: `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`, `getTotal()`, `getItemCount()`

## Styling

The application uses Tailwind CSS for styling with a custom color palette defined in `tailwind.config.js`.

## Development

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

The build output will be in the `dist/` directory.

