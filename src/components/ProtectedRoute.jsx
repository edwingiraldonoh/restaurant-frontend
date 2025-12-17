import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// Usa tu contexto real de autenticación
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles, requireAdmin }) {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useContext(AuthContext);

  // Si requireAdmin es true, solo permitir ADMIN
  const rolesPermitidos = requireAdmin ? ['ADMIN'] : allowedRoles;

  // Normaliza roles permitidos a mayúsculas
  const normalizedAllowedRoles = rolesPermitidos ? rolesPermitidos.map(r => r.toUpperCase()) : null;
  const userRole = (user?.role || '').toUpperCase();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    } else if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(userRole)) {
      // Redirigir al cocinero a /kitchen si intenta acceder a rutas de admin
      if (userRole === 'KITCHEN') {
        navigate('/kitchen');
      } else {
        navigate('/');
      }
    }
  }, [isLoggedIn, userRole, normalizedAllowedRoles, navigate]);

  if (!isLoggedIn) return null;
  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(userRole)) return null;
  return children;
}

export default ProtectedRoute;
