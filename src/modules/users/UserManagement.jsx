// Componente principal para la gestión de usuarios


import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { deactivateUser } from "./usersService";

import DefaultUserAvatar from "./DefaultUserAvatar";
import Pagination from "./Pagination";
import { getUsers } from "./usersService";
import { useNavigate } from "react-router-dom";

const statusColors = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  Inactive: "bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-500",
};

const UserManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // TODO: agregar filtros y paginación real

  useEffect(() => {
    setLoading(true);
    getUsers()
      .then((res) => {
        // Ajustar según la estructura real de la respuesta
        const data = res.data || res.users || res;
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Error al cargar usuarios");
        setLoading(false);
      });
  }, []);

  const navigate = useNavigate();
  // Obtener roles y estados únicos
  const allRoles = Array.from(new Set(users.map(u => u.role || u.customClaims?.role || '').filter(Boolean)));
  const allStatuses = Array.from(new Set(users.map(u => u.status || 'Active')));

  // Filtrar usuarios por nombre/correo, rol y estado
  const filteredUsers = users.filter(user => {
    const term = search.trim().toLowerCase();
    const name = (user.displayName || user.name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const role = (user.role || user.customClaims?.role || '').toLowerCase();
    const status = (user.status || 'Active').toLowerCase();
    let match = true;
    if (term) {
      match = name.includes(term) || email.includes(term);
    }
    if (roleFilter) {
      match = match && (role === roleFilter.toLowerCase());
    }
    if (statusFilter) {
      match = match && (status === statusFilter.toLowerCase());
    }
    return match;
  });

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-slate-950 group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-row">  
        <main className="flex-1 p-8 ml-64">
          <div className="layout-content-container flex flex-col w-full">
            {/* Header */}
            <header className="flex flex-wrap justify-between gap-4 items-center mb-6">
              <div className="flex flex-col gap-1">
                <p className="text-white text-3xl font-bold leading-tight tracking-tight">{t('users.managementTitle', 'Gestión de usuarios')}</p>
                <p className="text-gray-400 text-base font-normal leading-normal">{t('users.managementSubtitle', 'Gestiona todos los usuarios, sus roles y acceso al sistema.')}</p>
              </div>
              <button
                onClick={() => navigate('/users/new')}
                className="flex min-w-[84px] items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined mr-2">add</span>
                <span className="truncate">{t('users.addNewUser', 'Agregar usuario')}</span>
              </button>
            </header>
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {/* SearchBar */}
              <div className="flex-grow min-w-[20rem]">
                <label className="flex flex-col min-w-40 h-12 w-full">
                  <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-slate-800 shadow-sm">
                    <div className="text-gray-400 flex items-center justify-center pl-4">
                      <span className="material-symbols-outlined">search</span>
                    </div>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-gray-500 px-4 pl-2 text-sm font-normal leading-normal"
                      placeholder={t('users.searchPlaceholder', 'Buscar por nombre o correo...')}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </label>
              </div>
              {/* Dropdowns */}
              <div className="flex gap-3">
                {/* Filtro por rol */}
                <select
                  className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f5f1f0] dark:bg-[#2A1C16] px-4 shadow-sm text-[#181210] dark:text-gray-300 text-sm font-medium leading-normal hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                >
                  <option value="">{t('users.role', 'Rol')}</option>
                  {allRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {/* Filtro por estado */}
                <select
                  className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f5f1f0] dark:bg-[#2A1C16] px-4 shadow-sm text-[#181210] dark:text-gray-300 text-sm font-medium leading-normal hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">{t('users.status', 'Estado')}</option>
                  {allStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Table */}
            <div className="w-full rounded-xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden min-h-[200px]">
              {loading ? (
                <div className="p-8 text-center text-gray-500">{t('users.loading', 'Cargando usuarios...')}</div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">{error}</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-gray-300 text-xs font-medium uppercase tracking-wider">{t('users.user', 'Usuario')}</th>
                      <th className="px-6 py-4 text-left text-gray-300 text-xs font-medium uppercase tracking-wider">{t('users.email', 'Correo')}</th>
                      <th className="px-6 py-4 text-left text-gray-300 text-xs font-medium uppercase tracking-wider">{t('users.role', 'Rol')}</th>
                      <th className="px-6 py-4 text-left text-gray-300 text-xs font-medium uppercase tracking-wider">{t('users.status', 'Estado')}</th>
                      <th className="px-6 py-4 text-left text-gray-300 text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">{t('users.noUsersFound', 'No users found')}</td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id || user.uid} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.displayName || user.name} className="rounded-full w-10 h-10 object-cover" />
                              ) : (
                                <DefaultUserAvatar />
                              )}
                              <span className="text-white text-sm font-medium">{user.displayName || user.name || user.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm font-normal">{user.email}</td>
                          <td className="px-6 py-4 text-gray-400 text-sm font-normal">{user.role || user.customClaims?.role || "-"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status || "Active"]}`}>{user.status || "Active"}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {String(user.status || '').toLowerCase() !== 'desactivado' && (
                                <>
                                  <button
                                    className="p-2 rounded-md hover:bg-slate-800 transition-colors"
                                    onClick={() => navigate(`/users/${user.id || user.uid}`)}
                                    title="Editar usuario"
                                  >
                                    <span className="material-symbols-outlined text-lg text-white hover:text-gray-200">edit</span>
                                  </button>
                                  <button
                                    className="p-2 rounded-md hover:bg-red-900/20 transition-colors"
                                    onClick={() => {
                                      setUserToDeactivate(user);
                                      setShowDeactivateModal(true);
                                    }}
                                    title="Desactivar usuario"
                                  >
                                    <span className="material-symbols-outlined text-lg text-white hover:text-red-500">delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {/* Footer: paginación y resultados */}
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-gray-400">
                Showing <span className="font-medium text-white">1</span> to <span className="font-medium text-white">{users.length}</span> of <span className="font-medium text-white">{users.length}</span> results
              </p>
              <div className="flex gap-2">
                <button className="flex items-center justify-center h-10 px-4 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-medium hover:bg-slate-700 transition-colors">
                  {t('users.previous', 'Anterior')}
                </button>
                <button className="flex items-center justify-center h-10 px-4 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-medium hover:bg-slate-700 transition-colors">
                  {t('users.next', 'Siguiente')}
                </button>
              </div>
            </div>
          </div>
        {/* Modal de confirmación de desactivación */}
        {showDeactivateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-slate-900 rounded-lg shadow-xl p-8 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-white">{t('users.deactivateTitle', '¿Desactivar usuario?')}</h2>
              <p className="mb-6 text-gray-400">{t('users.deactivateConfirm', '¿Estás seguro de que deseas desactivar a')} <span className="font-semibold">{userToDeactivate?.displayName || userToDeactivate?.name || userToDeactivate?.email}</span>? {t('users.deactivateWarning', 'El usuario no podrá acceder al sistema.')}</p>
              <div className="flex justify-end gap-4">
                <button
                  className="px-4 py-2 rounded-md bg-slate-700 text-white font-medium hover:bg-slate-600"
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setUserToDeactivate(null);
                  }}
                  disabled={deactivating}
                >{t('users.deactivateCancel', 'Cancelar')}</button>
                <button
                  className="px-4 py-2 rounded-md bg-red-600 text-white font-bold hover:bg-red-700"
                  onClick={async () => {
                    setDeactivating(true);
                    try {
                      await deactivateUser(userToDeactivate.id || userToDeactivate.uid);
                      setUsers(users => users.map(u => (u.id === userToDeactivate.id || u.uid === userToDeactivate.uid) ? { ...u, status: 'Inactive' } : u));
                      setShowDeactivateModal(false);
                      setUserToDeactivate(null);
                    } catch (err) {
                      alert(t('users.deactivateError', 'Error al desactivar usuario'));
                    } finally {
                      setDeactivating(false);
                    }
                  }}
                  disabled={deactivating}
                >{deactivating ? t('users.deactivating', 'Desactivando...') : t('users.deactivateButton', 'Confirmar')}</button>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default UserManagement;
