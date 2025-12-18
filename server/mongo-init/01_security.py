"""
Inicializa roles y usuarios en MongoDB para los dos backends (app y admin).
- Rol SISTEMA: readWrite sobre la base de datos de la app (permisos mínimos).
- Rol ADMINISTRADOR: permisos completos (hereda root).
- Usuario app (credenciales de conexión del backend app) con rol SISTEMA.
- Usuario admin (login del backend admin) con rol ADMINISTRADOR.

Lee variables de entorno (.env opcional):
  MONGODB_HOST / MONGODB_PORT            (por defecto: localhost / 27017)
  MONGODB_AUTH_DATABASE                  (por defecto: admin)
  MONGO_INITDB_ROOT_USERNAME / _PASSWORD (por defecto: admin / admin123)
  MONGODB_DATABASE                       (por defecto: db)
  MONGODB_USERNAME / PASSWORD            (usuario backend app, por defecto: app_user / app_password)
  MONGODB_ADMIN_USERNAME / PASSWORD      (usuario backend admin, por defecto: admin_user / admin_password)
"""

import os
from urllib.parse import quote_plus

from pymongo import MongoClient

try:
  # Opcional: cargar ../.env si existe
  from dotenv import load_dotenv

  load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except Exception:
  pass


def getenv(key: str, default: str) -> str:
  return os.environ.get(key, default)


def main():
  host = getenv("MONGODB_HOST", "localhost")
  port = getenv("MONGODB_PORT", "27017")
  auth_db = getenv("MONGODB_AUTH_DATABASE", "admin")

  # Credenciales root (para crear roles/usuarios)
  root_user = getenv("MONGO_INITDB_ROOT_USERNAME", "admin")
  root_pwd = getenv("MONGO_INITDB_ROOT_PASSWORD", "admin123")

  db_name = getenv("MONGODB_DATABASE", "db")

  # Usuarios de aplicación
  app_user = getenv("MONGODB_USERNAME", "app_user")
  app_pwd = getenv("MONGODB_PASSWORD", "app_password")

  admin_user = getenv("MONGODB_ADMIN_USERNAME", "admin_user")
  admin_pwd = getenv("MONGODB_ADMIN_PASSWORD", "admin_password")

  uri = (
      f"mongodb://{quote_plus(root_user)}:{quote_plus(root_pwd)}"
      f"@{host}:{port}/{auth_db}"
  )

  role_system = "SISTEMA"
  role_admin = "ADMINISTRADOR"
  public_view_name = "videos_public"

  client = MongoClient(uri)
  try:
    admin_db = client["admin"]
    app_db = client[db_name]

    # Crear rol SISTEMA (readWrite en la BD de la app)
    existing = admin_db.command(
        {"rolesInfo": role_system, "showPrivileges": True, "showBuiltinRoles": False}
    )
    if not existing.get("roles"):
      admin_db.command(
          {
              "createRole": role_system,
              "privileges": [],
              "roles": [{"role": "readWrite", "db": db_name}],
          }
      )
      print(f"> Rol {role_system} creado")
    else:
      print(f"> Rol {role_system} ya existe")

    # Crear rol ADMINISTRADOR (hereda root)
    existing = admin_db.command(
        {"rolesInfo": role_admin, "showPrivileges": True, "showBuiltinRoles": False}
    )
    if not existing.get("roles"):
      admin_db.command(
          {
              "createRole": role_admin,
              "privileges": [],
              "roles": [{"role": "root", "db": "admin"}],
          }
      )
      print(f"> Rol {role_admin} creado")
    else:
      print(f"> Rol {role_admin} ya existe")

    # Usuario backend app
    existing = admin_db.command({"usersInfo": app_user})
    if not existing.get("users"):
      admin_db.command(
          {
              "createUser": app_user,
              "pwd": app_pwd,
              "roles": [{"role": role_system, "db": "admin"}],
          }
      )
      print(f"> Usuario app creado: {app_user}")
    else:
      print(f"> Usuario app ya existe: {app_user}")

    # Usuario backend admin
    existing = admin_db.command({"usersInfo": admin_user})
    if not existing.get("users"):
      admin_db.command(
          {
              "createUser": admin_user,
              "pwd": admin_pwd,
              "roles": [{"role": role_admin, "db": "admin"}],
          }
      )
      print(f"> Usuario admin creado: {admin_user}")
    else:
      print(f"> Usuario admin ya existe: {admin_user}")

    # Vista pública para videos
    views = app_db.list_collections(filter={"name": public_view_name})
    if not list(views):
      app_db.create_collection(
          public_view_name,
          viewOn="videos",
          pipeline=[
              {
                  "$match": {
                      "privacyStatus": {"$in": ["PUBLIC", "UNLISTED"]},
                      "processingStatus": "COMPLETED",
                  }
              },
              {"$sort": {"createdAt": -1}},
          ],
      )
      print(f"> Vista {public_view_name} creada")
    else:
      print(f"> Vista {public_view_name} ya existe")
  except Exception as exc:
    print(f"Error aplicando configuración de seguridad: {exc}")
    raise
  finally:
    client.close()


if __name__ == "__main__":
  main()
