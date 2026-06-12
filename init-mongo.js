const admin = db.getSiblingDB('admin');
const users = admin.getUsers({ filter: { user: 'brivotrust' } });
if (users.users.length === 0) {
  admin.createUser({
    user: 'brivotrust',
    pwd: 'Miranda23&&',
    roles: [{ role: 'readWrite', db: 'brivotrust' }]
  });
}
