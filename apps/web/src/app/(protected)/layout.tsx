import { ProtectedRoute } from '../../components/ProtectedRoute';
import Layout from '../../components/Layout';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}
