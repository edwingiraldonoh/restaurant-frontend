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

    // Simulamos una respuesta con el usuario actual
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
      role: 'admin' // Por defecto asumimos admin
    }];

    // Retornar en formato compatible con el componente
    return { users, total: users.length };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw new Error('Error al obtener usuarios de Firebase');
  }
}

// Crear nuevo usuario
export async function createUser(data) {
  try {
    const { email, password, displayName, role } = data;
    
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

    const { displayName, photoURL } = data;
    await updateProfile(currentUser, { displayName, photoURL });

    return {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL
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
