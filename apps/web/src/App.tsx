import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import VehiclesList from './pages/VehiclesList';
import VehicleDetail from './pages/VehicleDetail';
import CostEntriesList from './pages/CostEntriesList';
import TodoList from './pages/TodoList';
import { Setup } from './pages/Setup';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
        {/* Public routes */}
        <Route path="/setup" element={<Setup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <Layout>
                <VehiclesList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <VehicleDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles/:vehicleId/costs"
          element={
            <ProtectedRoute>
              <Layout>
                <CostEntriesList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles/:vehicleId/todos"
          element={
            <ProtectedRoute>
              <Layout>
                <TodoList />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
