// Inicializa usuarios y roles con niveles de acceso en MongoDB.
// - Crea una vista solo con videos públicos/unlisted y completados.
// - Crea un rol de solo lectura para esa vista.
// - Crea usuarios de lectura y lectura/escritura tomando credenciales de env.
//
// Variables de entorno reconocidas:
//   MONGODB_DATABASE           (por defecto: miniyoutube)
//   MONGODB_USERNAME           (usuario rw, por defecto: user)
//   MONGODB_PASSWORD           (pass rw, por defecto: password)
//   MONGODB_PUBLIC_USERNAME    (usuario ro, por defecto: public_user)
//   MONGODB_PUBLIC_PASSWORD    (pass ro, por defecto: public_password)

(() => {
  const dbName = process.env.MONGODB_DATABASE || "miniyoutube";
  const rwUser = process.env.MONGODB_USERNAME || "user";
  const rwPwd = process.env.MONGODB_PASSWORD || "password";
  const roUser = process.env.MONGODB_PUBLIC_USERNAME || "public_user";
  const roPwd = process.env.MONGODB_PUBLIC_PASSWORD || "public_password";

  const appDb = db.getSiblingDB(dbName);
  const adminDb = db.getSiblingDB("admin");

  // Crear vista solo con videos públicos/unlisted y completados
  const publicViewName = "videos_public";
  const existingViews = appDb.getCollectionInfos({ type: "view" }).map(c => c.name);
  if (!existingViews.includes(publicViewName)) {
    appDb.createView(
      publicViewName,
      "videos",
      [
        {
          $match: {
            privacyStatus: { $in: ["PUBLIC", "UNLISTED"] },
            processingStatus: "COMPLETED"
          }
        },
        { $sort: { createdAt: -1 } }
      ]
    );
    print(`> Vista ${publicViewName} creada`);
  } else {
    print(`> Vista ${publicViewName} ya existe`);
  }

  // Rol con acceso solo lectura a la vista pública
  const publicRole = "publicDataReader";
  if (!adminDb.getRole(publicRole, { showPrivileges: true })) {
    adminDb.createRole({
      role: publicRole,
      privileges: [
        {
          resource: { db: dbName, collection: publicViewName },
          actions: ["find"]
        }
      ],
      roles: []
    });
    print(`> Rol ${publicRole} creado`);
  } else {
    print(`> Rol ${publicRole} ya existe`);
  }

  // Usuario de solo lectura (vista pública)
  if (!adminDb.getUser(roUser)) {
    adminDb.createUser({
      user: roUser,
      pwd: roPwd,
      roles: [{ role: publicRole, db: "admin" }]
    });
    print(`> Usuario de solo lectura creado: ${roUser}`);
  } else {
    print(`> Usuario de solo lectura ya existe: ${roUser}`);
  }

  // Usuario de lectura/escritura sobre la BD de aplicación
  if (!adminDb.getUser(rwUser)) {
    adminDb.createUser({
      user: rwUser,
      pwd: rwPwd,
      roles: [{ role: "readWrite", db: dbName }]
    });
    print(`> Usuario de lectura/escritura creado: ${rwUser}`);
  } else {
    print(`> Usuario de lectura/escritura ya existe: ${rwUser}`);
  }
})();
