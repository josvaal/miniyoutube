// Inicializa roles y usuarios en MongoDB para los dos backends (app y admin).
// - Rol SISTEMA: permisos mínimos necesarios (readWrite) sobre la base de la app.
// - Rol ADMINISTRADOR: permisos completos (root).
// - Usuario app (credenciales de conexión del backend app) con rol SISTEMA.
// - Usuario admin (login del backend admin) con rol ADMINISTRADOR.
//
// Variables de entorno reconocidas:
//   MONGODB_HOST / MONGODB_PORT            (por defecto: localhost / 27017)
//   MONGODB_AUTH_DATABASE                  (por defecto: admin)
//   MONGO_INITDB_ROOT_USERNAME / _PASSWORD (por defecto: admin / admin123)
//   MONGODB_DATABASE                       (por defecto: db)
//   MONGODB_USERNAME / PASSWORD            (usuario backend app, por defecto: app_user / app_password)
//   MONGODB_ADMIN_USERNAME / PASSWORD      (usuario backend admin, por defecto: admin_user / admin_password)

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
  // Credenciales para conectarse como admin/root y crear roles/usuarios
  const adminUserRoot = process.env.MONGO_INITDB_ROOT_USERNAME || "admin";
  const adminPwdRoot = process.env.MONGO_INITDB_ROOT_PASSWORD || "admin123";

  const dbName = process.env.MONGODB_DATABASE || "db";
  const appUser = process.env.MONGODB_USERNAME || "app_user";
  const appPwd = process.env.MONGODB_PASSWORD || "app_password";
  const adminUserApp = process.env.MONGODB_ADMIN_USERNAME || "admin_user";
  const adminPwdApp = process.env.MONGODB_ADMIN_PASSWORD || "admin_password";

  const uri = `mongodb://${encodeURIComponent(adminUserRoot)}:${encodeURIComponent(adminPwdRoot)}@${host}:${port}/${authDb}`;
  const client = new MongoClient(uri);

  const roleSystem = "SISTEMA";
  const roleAdmin = "ADMINISTRADOR";

  try {
    await client.connect();
    const adminDb = client.db("admin");
    const appDb = client.db(dbName);

    // Crear rol SISTEMA: permisos de readWrite sobre la base de datos de la app
    const systemRole = await adminDb.command({ rolesInfo: roleSystem, showPrivileges: true, showBuiltinRoles: false });
    if (!systemRole.roles || systemRole.roles.length === 0) {
      await adminDb.command({
        createRole: roleSystem,
        privileges: [],
        roles: [{ role: "readWrite", db: dbName }],
      });
      console.log(`> Rol ${roleSystem} creado`);
    } else {
      console.log(`> Rol ${roleSystem} ya existe`);
    }

    // Crear rol ADMINISTRADOR: permisos completos (hereda root)
    const adminRole = await adminDb.command({ rolesInfo: roleAdmin, showPrivileges: true, showBuiltinRoles: false });
    if (!adminRole.roles || adminRole.roles.length === 0) {
      await adminDb.command({
        createRole: roleAdmin,
        privileges: [],
        roles: [{ role: "root", db: "admin" }],
      });
      console.log(`> Rol ${roleAdmin} creado`);
    } else {
      console.log(`> Rol ${roleAdmin} ya existe`);
    }

    // Crear usuario para backend app (conexión)
    const appInfo = await adminDb.command({ usersInfo: appUser });
    if (!appInfo.users || appInfo.users.length === 0) {
      await adminDb.command({
        createUser: appUser,
        pwd: appPwd,
        roles: [{ role: roleSystem, db: "admin" }],
      });
      console.log(`> Usuario app creado: ${appUser}`);
    } else {
      console.log(`> Usuario app ya existe: ${appUser}`);
    }

    // Crear usuario para backend admin (login)
    const adminInfo = await adminDb.command({ usersInfo: adminUserApp });
    if (!adminInfo.users || adminInfo.users.length === 0) {
      await adminDb.command({
        createUser: adminUserApp,
        pwd: adminPwdApp,
        roles: [{ role: roleAdmin, db: "admin" }],
      });
      console.log(`> Usuario admin creado: ${adminUserApp}`);
    } else {
      console.log(`> Usuario admin ya existe: ${adminUserApp}`);
    }

    // Asegurar vista pública (usada por el frontend) si no existe
    const publicViewName = "videos_public";
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
  } catch (err) {
    console.error("Error aplicando configuración de seguridad:", err.message);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
  }
})();

