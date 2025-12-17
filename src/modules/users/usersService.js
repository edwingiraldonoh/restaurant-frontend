// Servicio para gestión de usuarios usando Firebase Authentication directamente
import { auth } from '../../firebaseConfig';
import { 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser as firebaseDeleteUser
} from 'firebase/auth';

// Obtener todos los usuarios de Firebase Auth
// Nota: Firebase Auth no permite listar usuarios desde el cliente por seguridad
// Por ahora retornamos una lista simulada basada en el usuario actual
export async function getUsers(params) {
  try {
    // En un entorno real, necesitarías Firebase Admin SDK en el backend
    // Por ahora, retornamos el usuario actual si existe
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { users: [], total: 0 };
    }

    // Obtener el token actual con customClaims frescos
    const tokenResult = await currentUser.getIdTokenResult(true); // true para forzar refresh
    const customClaims = tokenResult.claims;
    
    console.log('CustomClaims obtenidos:', customClaims);

    // Si el usuario tiene claim admin o role ADMIN, intentar obtener la lista completa desde el backend admin
    const isAdmin = (customClaims.admin || (customClaims.role && String(customClaims.role).toUpperCase() === 'ADMIN'));
    
    if (isAdmin) {
      try {
        const adminApiUrl = (import.meta && import.meta.env && import.meta.env.VITE_ADMIN_API_URL) ? import.meta.env.VITE_ADMIN_API_URL : 'http://localhost:4001';
        // API key opcional almacenada en localStorage bajo 'adminApiKey'
        const apiKey = localStorage.getItem('adminApiKey') || 'changeme';
        const res = await fetch(`${adminApiUrl.replace(/\/$/, '')}/list-users`, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          }
        });
        if (!res.ok) {
          console.warn('Admin API returned', res.status);
        } else {
          const body = await res.json();
          const data = body.users || [];
          return { users: Array.isArray(data) ? data : [], total: Array.isArray(data) ? data.length : 0 };
        }
      } catch (err) {
        console.error('Error fetching admin user list:', err);
        // continuar con fallback al usuario actual
      }
    }

    // Fallback: retornar únicamente el usuario actual (simulado)
    const users = [{
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName || 'Sin nombre',
      photoURL: currentUser.photoURL,
      emailVerified: currentUser.emailVerified,
      disabled: false,
      status: 'Active', // Estado del usuario
      createdAt: currentUser.metadata.creationTime,
      lastLoginAt: currentUser.metadata.lastSignInTime,
      // Incluir customClaims frescos del token
      customClaims: customClaims,
      role: customClaims.admin ? 'ADMIN' : (customClaims.role ? String(customClaims.role).toUpperCase() : '')
    }];

    return { users, total: users.length };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw new Error('Error al obtener usuarios de Firebase');
  }
}

// Crear nuevo usuario
export async function createUser(data) {
  try {
    const { email, password, role } = data;
    const displayName = data.displayName || data.name || '';
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Actualizar perfil con nombre
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Nota: Para asignar custom claims (roles), necesitas Firebase Admin SDK
    // Esto debería hacerse desde el backend

    return {
      uid: user.uid,
      email: user.email,
      displayName: displayName || '',
      role: role || 'user',
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('El correo electrónico ya está en uso');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('La contraseña es muy débil');
    }
    throw new Error('Error al crear usuario');
  }
}

// Actualizar usuario
export async function updateUser(uid, data) {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser || currentUser.uid !== uid) {
      throw new Error('No tienes permisos para actualizar este usuario');
    }

    const { displayName, photoURL, role } = data;
    
    // Actualizar el perfil del usuario
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    
    if (Object.keys(updateData).length > 0) {
      await updateProfile(currentUser, updateData);
    }

    // Forzar refresh del token para obtener los datos actualizados
    await currentUser.reload();
    
    // Obtener customClaims actualizados
    const tokenResult = await currentUser.getIdTokenResult(true);
    const customClaims = tokenResult.claims;

    return {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
      customClaims: customClaims,
      role: customClaims.admin ? 'ADMIN' : (customClaims.role ? String(customClaims.role).toUpperCase() : '')
    };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw new Error('Error al actualizar usuario');
  }
}

// Desactivar usuario
export async function deactivateUser(uid) {
  try {
    // Firebase Auth no permite desactivar usuarios desde el cliente
    // Esto requiere Firebase Admin SDK en el backend
    throw new Error('Esta operación requiere permisos de administrador en el servidor');
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    throw error;
  }
}

// Resetear contraseña
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { message: 'Correo de recuperación enviado exitosamente' };
  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    if (error.code === 'auth/user-not-found') {
      throw new Error('Usuario no encontrado');
    }
    throw new Error('Error al enviar correo de recuperación');
  }
}

// Eliminar usuario
export async function deleteUser(uid) {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser || currentUser.uid !== uid) {
      throw new Error('No tienes permisos para eliminar este usuario');
    }

    await firebaseDeleteUser(currentUser);
    return { message: 'Usuario eliminado exitosamente' };
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw new Error('Error al eliminar usuario');
  }
}
