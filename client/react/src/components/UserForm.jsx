import React, { useEffect, useState } from 'react';

export default function UserForm({ onSave, user }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    } else {
      setName('');
      setEmail('');
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = { name, email };
    if (user) formData.id = user.id;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
      <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <button type="submit">{user ? 'Update' : 'Add'} User</button>
    </form>
  );
}
