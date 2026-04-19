const appDb = process.env.MONGO_APP_DB || 'ed_vision';
const appUser = process.env.MONGO_APP_USER || 'edvision_app';
const appPassword = process.env.MONGO_APP_PASSWORD;

if (!appPassword) {
  throw new Error('MONGO_APP_PASSWORD must be provided for MongoDB initialization.');
}

const database = db.getSiblingDB(appDb);
const existingUser = database.getUser(appUser);

if (!existingUser) {
  database.createUser({
    user: appUser,
    pwd: appPassword,
    roles: [{ role: 'readWrite', db: appDb }],
  });
  print(`Created MongoDB application user "${appUser}" for database "${appDb}".`);
} else {
  print(`MongoDB application user "${appUser}" already exists in database "${appDb}".`);
}
