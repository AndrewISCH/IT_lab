import {createBrowserRouter, Navigate} from "react-router-dom";
import {ProtectedRoute} from "./ProtectedRoute";
import {AuthLayout} from "../layouts/AuthLayout";
import {MainLayout} from "../layouts/MainLayout";

import LoginPage from "../pages/Login";
import RegisterPage from "../pages/Register";
import DatabasesPage from "../pages/Databases";
import DatabaseDetailPage from "../pages/DatabaseDetailed";
import TablePage from "../pages/Table";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/databases" replace />,
  },
  {
    path: "/login",
    element: (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: "/register",
    element: (
      <AuthLayout>
        <RegisterPage />
      </AuthLayout>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "databases",
        element: <DatabasesPage />,
      },
      {
        path: "databases/:databaseId",
        element: <DatabaseDetailPage />,
      },
      {
        path: "databases/:databaseId/tables/:tableName",
        element: <TablePage />,
      },
    ],
  },
]);
