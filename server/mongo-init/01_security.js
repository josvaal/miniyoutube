// Inicializa roles y usuarios usando Node (mongodb driver) sin depender de mongosh.
// - Vista: videos_public (solo PUBLIC/UNLISTED y COMPLETED).
// - Rol DESAUTENTICADO: solo lectura a la vista.
// - Rol AUTENTICADO: readWrite en la BD + lectura a la vista.
// - Usuarios tomados de env: público (solo lectura) y app (rw).
//
// Variables de entorno reconocidas:
//   MONGODB_HOST / MONGODB_PORT          (por defecto: localhost / 27017)
//   MONGODB_AUTH_DATABASE                (por defecto: admin)
//   MONGO_INITDB_ROOT_USERNAME / _PASSWORD (por defecto: admin / admin123)
//   MONGODB_DATABASE                     (por defecto: db)
//   MONGODB_USERNAME / PASSWORD          (usuario rw, por defecto: user/password)
//   MONGODB_PUBLIC_USERNAME / PASSWORD   (usuario ro, por defecto: public_user/public_password)

(async () => {
  // Cargar variables desde ../.env si dotenv está disponible
  try {
    const path = require("path");
    require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
  } catch (e) {
    // dotenv es opcional; ignorar si no está instalado
  }

  const { MongoClient } = require("mongodb");

  const host = process.env.MONGODB_HOST || "localhost";
  const port = process.env.MONGODB_PORT || "27017";
  const authDb = process.env.MONGODB_AUTH_DATABASE || "admin";
  // Prefer root creds if provided, else fall back to app creds for admin auth.
  const adminUser = process.env.MONGO_INITDB_ROOT_USERNAME
    || process.env.MONGODB_USERNAME
    || "admin";
  const adminPwd = process.env.MONGO_INITDB_ROOT_PASSWORD
    || process.env.MONGODB_PASSWORD
    || "admin123";

  const dbName = process.env.MONGODB_DATABASE || "db";
  const rwUser = process.env.MONGODB_USERNAME || "user";
  const rwPwd = process.env.MONGODB_PASSWORD || "password";
  const roUser = process.env.MONGODB_PUBLIC_USERNAME || "public_user";
  const roPwd = process.env.MONGODB_PUBLIC_PASSWORD || "public_password";

  const uri = `mongodb://${encodeURIComponent(adminUser)}:${encodeURIComponent(adminPwd)}@${host}:${port}/${authDb}`;
  const client = new MongoClient(uri);

  const roleUnauth = "DESAUTENTICADO";
  const roleAuth = "AUTENTICADO";
  const publicViewName = "videos_public";

  try {
    await client.connect();
    const adminDb = client.db("admin");
    const appDb = client.db(dbName);

    // Crear vista pública si no existe
    const views = await appDb.listCollections({ name: publicViewName }).toArray();
    if (views.length === 0) {
      await appDb.createCollection(publicViewName, {
        viewOn: "videos",
        pipeline: [
          {
            $match: {
              privacyStatus: { $in: ["PUBLIC", "UNLISTED"] },
              processingStatus: "COMPLETED",
            },
          },
          { $sort: { createdAt: -1 } },
        ],
      });
      console.log(`> Vista ${publicViewName} creada`);
    } else {
      console.log(`> Vista ${publicViewName} ya existe`);
    }

    // Rol DESAUTENTICADO
    const unauthRole = await adminDb.command({ rolesInfo: roleUnauth, showPrivileges: true, showBuiltinRoles: false });
    if (!unauthRole.roles || unauthRole.roles.length === 0) {
      await adminDb.command({
        createRole: roleUnauth,
        privileges: [
          {
            resource: { db: dbName, collection: publicViewName },
            actions: ["find"],
          },
        ],
        roles: [],
      });
      console.log(`> Rol ${roleUnauth} creado`);
    } else {
      console.log(`> Rol ${roleUnauth} ya existe`);
    }

    // Rol AUTENTICADO
    const authRole = await adminDb.command({ rolesInfo: roleAuth, showPrivileges: true, showBuiltinRoles: false });
    if (!authRole.roles || authRole.roles.length === 0) {
      await adminDb.command({
        createRole: roleAuth,
        privileges: [
          { resource: { db: dbName, collection: "" }, actions: ["find", "insert", "update", "remove"] },
          { resource: { db: dbName, collection: publicViewName }, actions: ["find"] },
        ],
        roles: [],
      });
      console.log(`> Rol ${roleAuth} creado`);
    } else {
      console.log(`> Rol ${roleAuth} ya existe`);
    }

    // Usuario solo lectura
    const roInfo = await adminDb.command({ usersInfo: roUser });
    if (!roInfo.users || roInfo.users.length === 0) {
      await adminDb.command({
        createUser: roUser,
        pwd: roPwd,
        roles: [{ role: roleUnauth, db: "admin" }],
      });
      console.log(`> Usuario de solo lectura creado: ${roUser}`);
    } else {
      console.log(`> Usuario de solo lectura ya existe: ${roUser}`);
    }

    // Usuario lectura/escritura
    const rwInfo = await adminDb.command({ usersInfo: rwUser });
    if (!rwInfo.users || rwInfo.users.length === 0) {
      await adminDb.command({
        createUser: rwUser,
        pwd: rwPwd,
        roles: [{ role: roleAuth, db: "admin" }],
      });
      console.log(`> Usuario de lectura/escritura creado: ${rwUser}`);
    } else {
      console.log(`> Usuario de lectura/escritura ya existe: ${rwUser}`);
    }

    // Asegurar rol AUTENTICADO en usuarios de aplicación existentes
    try {
      const usersColl = appDb.collection("users");
      const res = await usersColl.updateMany(
        { roles: { $exists: false } },
        { $set: { roles: ["AUTENTICADO"] } }
      );
      console.log(`> Usuarios actualizados con rol AUTENTICADO: ${res.modifiedCount}`);
    } catch (e) {
      console.log("> No se pudo actualizar roles en coleccion users:", e.message);
    }
  } catch (err) {
    console.error("Error aplicando configuración de seguridad:", err.message);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
  }
})();
