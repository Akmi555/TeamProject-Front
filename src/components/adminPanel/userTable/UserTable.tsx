import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./UserTable.module.css";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isBlocked: boolean;
};

const UserTable: React.FC = () => {
  const token = localStorage.getItem("token");
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/admin/users",{
            headers: {
              Authorization: `Bearer ${token}`,
            }
          });
        setUsers(response.data);
        setError(null);
      } catch (err) {
        setError("Ошибка при загрузке пользователей");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const updateUserRole = async (id: number, role: string) => {
    try {
      const response = await axios.put(`/api/admin/give-role/${id}`, null, {
        params: { role },
      });
      const updatedUser = response.data;

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === updatedUser.id ? { ...user, role: updatedUser.role } : user
        )
      );
    } catch {
      setError("Ошибка при изменении роли пользователя");
    }
  };

  const toggleBlockUser = async (email: string) => {
    try {
      const response = await axios.put("/api/admin/ban", null, { params: { email } });
      const updatedUser = response.data;

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.email === updatedUser.email
            ? { ...user, isBlocked: !user.isBlocked }
            : user
        )
      );
    } catch {
      setError("Ошибка при изменении состояния блокировки пользователя");
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await axios.delete(`/api/admin/users/${id}`);
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
    } catch {
      setError("Ошибка при удалении пользователя");
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof User
  ) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, [field]: e.target.value });
    }
  };

  const handleSaveUser = async () => {
    if (editingUser) {
      try {
        await updateUserRole(editingUser.id, editingUser.role);
        setEditingUser(null);
        setIsModalOpen(false);
      } catch {
        setError("Ошибка при сохранении изменений пользователя");
      }
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  return (
    <div className={styles.userTable}>
      <h2 className={styles.title}>Пользователи</h2>
      {loading && <p>Загрузка...</p>}
      {error && <p className={styles.error}>{error}</p>}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Фамилия</th>
            <th>Email</th>
            <th>Роль</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.firstName}</td>
              <td>{user.lastName}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.isBlocked ? "Заблокирован" : "Активен"}</td>
              <td>
                <div className={styles.actionButtons}>
                  <button
                    onClick={() => handleEditUser(user)}
                    className={styles.editBtn}
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => toggleBlockUser(user.email)}
                    className={styles.blockBtn}
                  >
                    {user.isBlocked ? "Разблокировать" : "Заблокировать"}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className={styles.deleteBtn}
                  >
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Редактировать пользователя</h3>
            <label>
              Имя:
              <input
                type="text"
                value={editingUser.firstName}
                onChange={(e) => handleInputChange(e, "firstName")}
                className={styles.input}
              />
            </label>
            <label>
              Фамилия:
              <input
                type="text"
                value={editingUser.lastName}
                onChange={(e) => handleInputChange(e, "lastName")}
                className={styles.input}
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => handleInputChange(e, "email")}
                className={styles.input}
              />
            </label>
            <label>
              Роль:
              <select
                value={editingUser.role}
                onChange={(e) => handleInputChange(e, "role")}
                className={styles.select}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
              </select>
            </label>
            <div className={styles.buttons}>
              <button onClick={handleSaveUser} className={styles.saveBtn}>
                Сохранить
              </button>
              <button onClick={handleCancel} className={styles.cancelBtn}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
