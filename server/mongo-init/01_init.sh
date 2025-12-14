#!/bin/bash
set -e

MONGO_DB="${MONGODB_DATABASE:-miniyoutube}"
APP_USER="${MONGODB_APP_USERNAME:-app_user}"
APP_PWD="${MONGODB_APP_PASSWORD:-app_password}"

echo ">> Inicializando MongoDB con base de datos ${MONGO_DB} y usuario de aplicación ${APP_USER}"

mongosh -u "${MONGO_INITDB_ROOT_USERNAME}" -p "${MONGO_INITDB_ROOT_PASSWORD}" --authenticationDatabase admin <<'EOF'
const dbName = process.env.MONGODB_DATABASE || "miniyoutube";
const appUser = process.env.MONGODB_APP_USERNAME || "app_user";
const appPwd = process.env.MONGODB_APP_PASSWORD || "app_password";
const db = db.getSiblingDB(dbName);

// Crear usuario de aplicación con mínimo privilegio
if (!db.getUser(appUser)) {
  db.createUser({
    user: appUser,
    pwd: appPwd,
    roles: [
      { role: "readWrite", db: dbName },
      { role: "dbAdmin", db: dbName }
    ]
  });
  print(`> Usuario de aplicación creado: ${appUser}`);
} else {
  print(`> Usuario de aplicación ya existe: ${appUser}`);
}

// Colecciones y validadores básicos
function ensureCollectionWithSchema(name, validator) {
  if (!db.getCollectionNames().includes(name)) {
    db.createCollection(name, { validator, validationLevel: "strict", validationAction: "error" });
    print(`> Colección ${name} creada con validador`);
  } else {
    db.runCommand({ collMod: name, validator, validationLevel: "strict", validationAction: "error" });
    print(`> Validador actualizado para ${name}`);
  }
}

ensureCollectionWithSchema("videos", {
  $jsonSchema: {
    bsonType: "object",
    required: ["title", "privacyStatus", "processingStatus", "createdAt"],
    properties: {
      title: { bsonType: "string", minLength: 1 },
      description: { bsonType: ["string", "null"] },
      privacyStatus: { enum: ["PUBLIC", "PRIVATE", "UNLISTED"] },
      processingStatus: { enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] },
      createdAt: { bsonType: "date" },
      views_count: { bsonType: ["int", "long", "double"] },
      likes_count: { bsonType: ["int", "long", "double"] },
      dislikes_count: { bsonType: ["int", "long", "double"] },
      duration_sec: { bsonType: ["int", "long", "double"] }
    }
  }
});

ensureCollectionWithSchema("video_views", {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "videoId", "viewedAt"],
    properties: {
      userId: { bsonType: "string" },
      videoId: { bsonType: "string" },
      viewedAt: { bsonType: "date" }
    }
  }
});

ensureCollectionWithSchema("video_reactions", {
  $jsonSchema: {
    bsonType: "object",
    required: ["user", "video", "type"],
    properties: {
      user: { bsonType: "object" },
      video: { bsonType: "object" },
      type: { enum: ["LIKE", "DISLIKE"] },
      reactedAt: { bsonType: ["date", "null"] }
    }
  }
});

ensureCollectionWithSchema("comentarios", {
  $jsonSchema: {
    bsonType: "object",
    required: ["video", "user", "body", "createdAt"],
    properties: {
      video: { bsonType: "object" },
      user: { bsonType: "object" },
      body: { bsonType: "string", minLength: 1 },
      createdAt: { bsonType: "date" },
      parent: { bsonType: ["object", "null"] }
    }
  }
});

ensureCollectionWithSchema("audit_logs", {
  $jsonSchema: {
    bsonType: "object",
    required: ["action", "createdAt"],
    properties: {
      userId: { bsonType: ["string", "null"] },
      action: { bsonType: "string" },
      metadata: { bsonType: ["object", "null"] },
      createdAt: { bsonType: "date" }
    }
  }
});

// Índices avanzados
db.videos.createIndex({ "creator": 1, "createdAt": -1 }, { name: "creator_created_idx" });
db.video_reactions.createIndex({ "user.$id": 1, "video.$id": 1 }, { name: "user_video_unique", unique: true });
db.video_views.createIndex({ "userId": 1, "videoId": 1 }, { name: "user_video_view_unique", unique: true });
db.video_views.createIndex({ "viewedAt": 1 }, { name: "viewedAt_ttl_idx", expireAfterSeconds: 15552000 });
db.comentarios.createIndex({ "video": 1, "createdAt": -1 }, { name: "video_created_idx" });
db.audit_logs.createIndex({ "createdAt": 1 }, { name: "audit_ttl_idx", expireAfterSeconds: 7776000 });

print("> Esquemas, índices y usuario de aplicación configurados");
EOF
