import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { saveUsers, getUsers, addToSyncQueue } from './db';
import { syncWithServer } from './sync';
import { secureGet } from './utils/secureStorage';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/users';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', id: null });

  // Load users and set up sync event listener
  useEffect(() => {
    fetchUsers();

    const syncOnOnline = () => {
      syncWithServer().then(() => fetchUsers());
    };

    window.addEventListener('online', syncOnOnline);
    return () => window.removeEventListener('online', syncOnOnline);
  }, []);

  const fetchUsers = async () => { 
    const token = secureGet('accessToken');
    if (!token) return console.log('No access token found');
  
    if (navigator.onLine) {
      try {
        const res = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });
        setUsers(res.data.users); // ✅ Fix here
        await saveUsers(res.data.users);
      } catch (err) {
        console.error('Online fetch failed, fallback to local DB', err);
        const localUsers = await getUsers();
        setUsers(localUsers);
      }
    } else {
      const localUsers = await getUsers();
      setUsers(localUsers);
    }
  };
  

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdd = async () => {
    if (!form.name || !form.email) return;

    const newUser = { name: form.name, email: form.email };

    if (navigator.onLine) {
      await axios.post(API_URL, newUser);
      fetchUsers();
    } else {
      await addToSyncQueue('create', newUser);
      alert('Saved locally. Will sync when online.');
    }

    setForm({ name: '', email: '', id: null });
  };

  const handleUpdate = async () => {
    if (!form.id) return;

    const updatedUser = { id: form.id, name: form.name, email: form.email };

    if (navigator.onLine) {
      await axios.put(`${API_URL}/${form.id}`, updatedUser);
      fetchUsers();
    } else {
      await addToSyncQueue('update', updatedUser);
      alert('Update saved locally. Will sync when online.');
    }

    setForm({ name: '', email: '', id: null });
  };

  const handleDelete = async (id) => {
    if (navigator.onLine) {
      await axios.delete(`${API_URL}/${id}`);
      fetchUsers();
    } else {
      await addToSyncQueue('delete', { id });
      alert('Delete saved locally. Will sync when online.');
    }
  };

  const handleEdit = (user) => {
    setForm(user);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">User Manager (PWA Sync)</h2>

      <div className="mb-4">
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 mr-2"
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 mr-2"
        />
        {form.id ? (
          <button onClick={handleUpdate} className="bg-blue-500 text-white px-4 py-2">Update</button>
        ) : (
          <button onClick={handleAdd} className="bg-green-500 text-white px-4 py-2">Add</button>
        )}
      </div>

      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.id} className="border p-2 flex justify-between items-center">
            <span>{user.name} - {user.email}</span>
            <div>
              <button onClick={() => handleEdit(user)} className="text-blue-500 mr-2">Edit</button>
              <button onClick={() => handleDelete(user.id)} className="text-red-500">Delete</button>
            </div>
          </li>
        ))}
      </ul>

      <Link to='/premium'>Go to premium Features</Link>
    </div>
  );
};

export default UserManager;
