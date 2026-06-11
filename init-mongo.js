const admin = db.getSiblingDB('admin');
const users = admin.getUsers({ filter: { user: 'blockvault' } });
if (users.users.length === 0) {
  admin.createUser({
    user: 'blockvault',
    pwd: 'Miranda23&&',
    roles: [{ role: 'readWrite', db: 'blockvault' }]
  });
}
