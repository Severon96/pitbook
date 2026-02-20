import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import VehiclesList from './pages/VehiclesList';
import VehicleDetail from './pages/VehicleDetail';
import CostEntriesList from './pages/CostEntriesList';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vehicles" element={<VehiclesList />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/vehicles/:vehicleId/costs" element={<CostEntriesList />} />
      </Routes>
    </Layout>
  );
}

export default App;
