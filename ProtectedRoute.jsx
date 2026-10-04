import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FullPageLoader } from './ui'

// Melindungi route per peran. (Pembatasan data sebenarnya tetap ditegakkan oleh RLS di database.)
export default function ProtectedRoute({ roles, children }) {
  const { profile, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (!profile) return <Navigate to="/" replace />
  if (roles && !roles.includes(profile.role)) return <Navigate to={`/${profile.role}`} replace />
  return children
}
