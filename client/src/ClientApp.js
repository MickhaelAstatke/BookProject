import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Catalogue from './Catalogue';
import Account from './Account';
import Admin from './Admin';
import Cart from './Cart';

const router = createBrowserRouter([
  { path: '/app', element: <App /> },
  { path: '/app/catalogue', element: <Catalogue /> },
  { path: '/app/account', element: <Account /> },
  { path: '/app/admin', element: <Admin /> },
  { path: '/app/cart', element: <Cart /> }
]);

function ClientApp() {
  return <RouterProvider router={router} />;
}

export default ClientApp;