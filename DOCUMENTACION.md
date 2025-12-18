# MiniYouTube - Documentacion tecnica integral

## Vision general
- Monorepo con tres piezas principales: `server` (API Spring Boot 3.5.7 sobre Java 17 + MongoDB + S3/FFmpeg), `client` (Vite/React 19 con video.js, Tailwind y React Query) y `admin` (Vite/React para consola de soporte con Basic Auth).
- Dominio: plataforma tipo YouTube para subir, procesar (HLS multi-calidad) y reproducir videos; permite comentarios anidados, likes/dislikes, historial de vistas, suscripciones de canales y panel administrativo.
- Infra local basada en Docker Compose: MongoDB + inicializacion de roles, LocalStack con bucket S3, job que crea bucket y backend empaquetado en imagen Maven/Temurin con FFmpeg.
- Almacenamiento de medios en S3 (endpoint LocalStack) con proxy interno `/api/stream/**` que reescribe playlists HLS y sirve segmentos TS/manifest.
- Seguridad dual: JWT stateless para clientes finales, Basic Auth con credenciales de admin (almacenadas en `.env`) para el panel administrativo; CORS permisivo para facilitar pruebas.

## Mapa de carpetas y piezas
- `server/`: API Spring Boot. Subcarpetas clave: `config` (Mongo/S3/Dotenv/OpenAPI), `security` (JWT + admin), dominios `user`, `video`, `comment`, `subscription`, `service` (S3), `controller` (streaming), `admin` (CRUD ampliado), `mongo-init` (seed de roles/usuarios) y `docker/`/`docker-compose.yml`.
- `client/`: front principal para usuarios finales. Usa Vite + React 19, Tailwind v4, Radix UI, React Query y video.js para HLS. Paginas: Home, Login/Register, Upload, Player, Profile, Channel, Subscriptions.
- `admin/`: consola operativa en React. Se autentica via Basic Auth contra `/api/admin/login` y expone CRUD sobre usuarios, videos, comentarios, suscripciones, reacciones y vistas.
- Archivos de entorno: `server/.env(.example)`, `client/.env(.example)`, `admin/.env`. Por defecto apuntan a `http://localhost:8080/api` (o `/api/admin`).

## Dependencias clave
- Backend: Spring Boot starters (web, security, data-mongodb, validation), springdoc-openapi, jjwt 0.12.6, dotenv-java para leer `.env`, AWS SDK v2 S3, Lombok, DevTools. Requiere FFmpeg/ffprobe en runtime (instalado en la imagen alpine).
- Front cliente: React 19, React Router 7, @tanstack/react-query, video.js + http-streaming, Tailwind 4, Radix UI, lucide-react para iconografia.
- Front admin: React 19 + fetch directo; no usa React Query. Estilos con CSS ligero.

## Configuracion y variables de entorno
- JWT: `JWT_SECRET`, `JWT_EXPIRATION` (ms).
- Mongo app: `MONGODB_HOST`, `MONGODB_PORT`, `MONGODB_DATABASE`, `MONGODB_USERNAME`/`PASSWORD`, `MONGODB_AUTH_DATABASE`.
- Mongo admin (Basic Auth del panel): `MONGODB_ADMIN_USERNAME`/`PASSWORD`, `MONGODB_ADMIN_AUTH_DATABASE`.
- S3/LocalStack: `AWS_S3_ENDPOINT`, `AWS_S3_REGION`, `AWS_S3_BUCKET_NAME`, `AWS_S3_ACCESS_KEY`, `AWS_S3_SECRET_KEY`.
- Fronts: `VITE_API_URL` en `client` y `admin`.
- Propiedades Spring: limites de multipart (500MB), swagger paths, auto creacion de indices Mongo.

## Infraestructura local y despliegue
- `server/docker-compose.yml` levanta cuatro servicios:
  - `mongodb`: Mongo con credenciales root (`MONGO_INITDB_ROOT_USERNAME/PASSWORD`), persistencia en volumen y healthcheck con `mongosh ping`.
  - `localstack`: servicios S3 con datos persistentes y script de init `localstack-init/create-buckets.sh` (crea bucket `miniyoutube`). Healthcheck sobre `_localstack/health`.
  - `localstack-bucket-init`: job one-shot con AWS CLI que espera a LocalStack y garantiza el bucket configurado (`AWS_S3_BUCKET_NAME`).
  - `app`: imagen construida con Dockerfile (maven build + runtime Temurin 21-alpine + ffmpeg). Expone 8080 y depende de los healthchecks anteriores. Usa variables del host para JWT/Mongo/S3.
- `mongo-init/01_security.py`: script que crea roles y usuarios en Mongo (lee `.env` o variables). Roles: `SISTEMA` (readWrite sobre BD app) y `ADMINISTRADOR` (hereda root). Usuarios: `app_user` y `admin_user` asociados. Tambien crea vista `videos_public` filtrada por privacidad (`PUBLIC/UNLISTED`) y estado de procesamiento `COMPLETED`.
- Requerimientos locales sin Docker: Mongo y S3 accesibles, FFmpeg instalado, variables cargadas (Dotenv las lee automaticamente si existe `.env`).

## Arquitectura backend (Spring Boot)
- Entrypoint `MiniyoutubeApplication` habilita Mongo auditing y ejecucion async para trabajos de video.
- Configuracion (`config`):
  - `DotenvConfig` expone `Dotenv` para leer `.env`.
  - `MongoConfig` define tres clientes/plantillas: `mongoTemplate` (usuario app), `adminMongoTemplate` (usuario admin con mas privilegios) y `publicMongoTemplate` (lecturas publicas). Construye cadenas de conexion a partir de envs.
  - `S3Config` crea `S3Client` v2 con endpoint override, credenciales estaticas y path-style (para LocalStack) y expone el nombre de bucket como bean.
  - `OpenApiConfig` publica swagger en `/swagger-ui.html` y protege endpoints no publicos con esquema bearer.
- Seguridad (`security`):
  - Tres cadenas de filtros en orden: (0) `/api/admin/login` abierto; (1) `/api/admin/**` protegido con Basic Auth via `AdminAuthenticationProvider` que valida contra env `MONGODB_ADMIN_*`; (2) `/api/**` app publica/usuario con JWT stateless y `JwtAuthenticationFilter` + `DaoAuthenticationProvider`.
  - CORS permisivo (origenes/metodos/headers `*`, sin credenciales). JWT valida subject/email y expiracion con clave HMAC configurable.
- Dominios y servicios principales:
  - `user`: registro, login (genera JWT), consulta/edicion de perfil actual incluyendo avatar (sube a S3), historial de vistas y videos con like, suscripcion/desuscripcion. `UserService` implementa `UserDetailsService` y usa `BCryptPasswordEncoder`.
  - `video`: subir video (multipart) + `VideoProcessingService` asincrono que genera HLS 360/480/720/1080 segun resolucion original usando ffmpeg, sube segmentos y playlists a S3 via `S3Service`, actualiza calidades disponibles e inicia estado `PROCESSING/COMPLETED/FAILED`. `VideoService` controla visibilidad (PUBLIC/PRIVATE/UNLISTED), paginacion priorizando suscripciones del usuario, reacciones (like/dislike con conmutacion), vistas unicas por usuario (`VideoView`), historial y videos que gustan.
  - `comment`: comentarios anidados (campo `parent` lazy), validacion de pertenencia al mismo video, lista de comentarios principales y respuestas con paginacion, borrado recursivo del arbol del comentario.
  - `subscription`: crea/elimina suscripcion, verifica estado, lista mis suscripciones y suscriptores de un canal, evita suscribirse a uno mismo y duplicados (indice unico DB).
  - `streaming`: `StreamingController` sirve cualquier clave S3 via `/api/stream/**`, reescribe rutas relativas en `.m3u8` para apuntar de nuevo al backend, configura `Content-Type` y cache, actua como gateway sin exponer URL de S3.
  - `admin`: `AdminCrudService` opera con `adminMongoTemplate` y expone controladores `/api/admin/{users,videos,comments,subscriptions,reactions,views}` mas `/metrics/summary` y `/ping`. Operaciones CRUD completas y actualizan contrasenas usando el mismo encoder que el flujo publico.
- Manejo de errores: `GlobalExceptionHandler` traduce `BadCredentials`, `UsernameNotFound`, `DuplicateKey`, `ResponseStatusException`, validaciones y excepciones genericas a respuestas JSON con codigo apropiado.
- Documentacion API: swagger UI en `/swagger-ui.html`, spec en `/v3/api-docs`.

## Modelo de datos MongoDB (colecciones y indices)
- `users`: `id`, `username` (indice unico), `email` (indice unico), `password` bcrypt, `channelName`, `avatarURL`, `createdAt` (auditing).
- `videos`: referencia `creator` (`DBRef users`), `title`, `description`, `privacyStatus`, `videoUrl`, `thumbnailUrl`, `duration_sec`, `tags`, contadores `views_count/likes_count/dislikes_count`, estado `processingStatus`, `hlsManifestUrl`, `originalVideoUrl`, `availableQualities`, `createdAt`. Indices compuestos sobre privacidad+estado+fecha y creator+fecha.
- `comentarios`: `video` (DBRef), `user` (DBRef), `body`, `parent` (DBRef lazy), `createdAt`. Indices por video+fecha y parent+fecha.
- `subscripciones`: `subscriber` (DBRef), `channel` (DBRef). Indice compuesto unico subscriber+channel y otro por channel.
- `video_reactions`: `video` (DBRef), `user` (DBRef), `type` (LIKE/DISLIKE). Indice compuesto unico user+video.
- `video_views`: `userId`, `videoId`, `viewedAt` con indice compuesto unico user+video para asegurar una vista contada por usuario.
- Vista `videos_public`: filtra `videos` con `privacyStatus` PUBLIC/UNLISTED y `processingStatus` COMPLETED, ordena por `createdAt desc` para feed publico eficiente; se consulta via `publicMongoTemplate` en `VideoService.listPublicVideos`.
- Roles/usuarios DB (desde `mongo-init/01_security.py`): rol `SISTEMA` (readWrite en BD app) asignado a usuario app; rol `ADMINISTRADOR` (root admin) asignado a usuario admin. Permite separar credenciales para API publica vs panel.

## Almacenamiento y streaming
- `S3Service` abstrae subida/borrado de archivos. Para HLS mantiene nombres originales de playlists/segmentos dentro de prefijo `videos/{videoId}/hls`, asigna `Content-Type` apropiado y devuelve URL proxied `http://localhost:8080/api/stream/{key}`.
- `VideoProcessingService`: valida tamano max (`video.max.size`, default 500MB), detecta duracion y resolucion con ffprobe, genera thumbnail (1s) a 1280x720 y la sube a `thumbnails/`. Procesa calidades permitidas segun altura original (al menos 360p), crea `master.m3u8` incremental y actualiza `availableQualities` y `processingStatus` a medida que cada calidad se sube. Limpia temporales y marca `FAILED` en excepciones.
- `StreamingController` obtiene bytes desde S3 (cliente v2) y reescribe playlists para que segmentos apunten al mismo backend, evitando exponer endpoint S3/LocalStack directamente.

## Front-end cliente (MiniTube)
- Stack: Vite + React 19, React Router, React Query, Tailwind 4, Radix UI, lucide-react, video.js con http-streaming HLS.
- Estado y autenticacion: `AuthContext` guarda usuario/token en localStorage, expone `login/logout` y bandera `isReady`. Hooks `useLogin/useRegister/useLogout` gestionan solicitudes fetch a `/api/auth/*` y actualizan contexto.
- Datos: hooks `useVideos`, `useVideo`, `useUploadVideo` usan React Query para cache y revalidacion. `useUploadVideo` usa XMLHttpRequest para progreso y envia JWT en header Authorization.
- Piezas UI clave:
  - `MainLayout`: header con buscador, theme toggle, alertas, avatar con menu, sidebar dinamica y filtros de mood.
  - Paginas: `Home` (feed paginado, hero, filtros, tarjetas de video), `VideoPlayer` (usa componente `components/VideoPlayer` con video.js, muestra estados PENDING/PROCESSING/FAILED, info de canal, tags y relacionados), `Upload` (wizard de 3 pasos con validacion de tamano 500MB y seguimiento de progreso), `Profile/ProfileEdit/Channel/Subscriptions` (gestion de canal y subs), `Login`/`Register` (formularios basicos), `Profile` extrae datos de `/api/users/me` via hooks de usuario.
  - Componente `VideoPlayer` inicializa video.js una sola vez (evita dispose en StrictMode), admite actualizacion de fuente/thumbnail y captura errores HLS.
- Temas/estilo: tailwind utilitario con fondos degradados, glassmorphism y soporte claro/oscuro via `ThemeProvider`.

## Consola admin (admin/)
- Single page React sin router; usa `useAuthStorage` para guardar credenciales Basic (usuario/clave) en localStorage y construir header Authorization.
- Login view llama `POST /api/admin/login` y almacena credenciales al ser valido. Riesgo: el secreto queda en storage en texto claro (solo para entornos controlados).
- Tabs: Resumen (metricas de conteo usuarios/videos, ping), Usuarios, Videos, Comentarios, Suscripciones, Reacciones, Vistas. Cada seccion usa fetch directo a `/api/admin/*` con paginacion simple y formularios basicos para crear/eliminar registros.
- Permite crear videos referenciando creatorId y URLs manualmente (sin procesamiento). Usa estilos ligeros con clases CSS en `App.css`.

## Flujos funcionales principales
- Subida de video:
  1. Usuario autenticado (JWT) envia multipart a `POST /api/videos` con titulo/descripcion/privacidad/tags + archivo.
  2. `VideoService.uploadVideo` crea registro, marca `PROCESSING`, guarda archivo temporal y dispara `processAllQualitiesIncremental` async.
  3. `VideoProcessingService` genera thumbnail, HLS en calidades soportadas, sube a S3 y actualiza `availableQualities`, `hlsManifestUrl` y `videoUrl`. Primer calidad marca `COMPLETED`.
  4. Front muestra estados (PENDING/PROCESSING/FAILED) y reproduce cuando `hlsManifestUrl` esta listo.
- Reproduccion:
  1. Front solicita `GET /api/videos/{id}`; backend valida privacidad y usuario (solo creador ve PRIVATE).
  2. Si usuario autenticado y no vio el video antes, se registra `VideoView` y se incrementa contador.
  3. video.js consume manifest via `/api/stream/...`; controller reescribe rutas y sirve segmentos desde S3 con cache largo.
- Likes/Dislikes: `POST /api/videos/{id}/like|dislike` alterna reacciones en `video_reactions` (unico por usuario/video) y ajusta contadores con transaccion anotada.
- Comentarios: `POST /api/videos/{id}/comments` crea comentario (opcional `parentId`), listas paginadas de comentarios principales y respuestas, eliminacion recursiva valida autor.
- Suscripciones: `POST/DELETE /api/users/{userId}/subscribe` crea/elimina `SubscriptionEntity` evitando duplicados; `GET /api/users/{userId}/subscription` retorna estado y conteo.
- Admin: endpoints `/api/admin/*` permiten CRUD sin restricciones de negocio (pensados para soporte/seed). Usa plantilla Mongo con privilegios elevados.

## Patrones y decisiones tecnicas
- Separacion de responsabilidades: controladores ligeros -> servicios -> repositorios (Spring Data) -> Mongo. Admin usa plantilla dedicada para saltar restricciones de seguridad.
- Uso de DTOs para requests/responses en dominios (auth, video, comment, subscription, admin DTOs) evitando filtrar entidades completas al cliente.
- Procesamiento asincrono con `@Async` para no bloquear solicitud de subida; HLS incremental permite mostrar calidad 360p rapidamente y agregar calidades superiores progresivamente.
- Proxy de streaming para controlar CORS/cache y mantener URLs estables incluso en LocalStack.
- Validacion y manejo de errores centralizado para respuestas consistentes.
- Dotenv para uniformar configuracion entre dev y contenedor; swagger integrado para descubrimiento de API.

## Operacion y despliegue
- Backend local (sin Docker):
  ```
  cd server
  mvn clean package -DskipTests
  # exportar variables o crear server/.env
  java -jar target/miniyoutube-0.0.1-SNAPSHOT.jar
  ```
- Docker Compose (recomendado):
  ```
  cd server
  docker-compose up --build
  ```
  Expone API en `http://localhost:8080`, Mongo en 27017, LocalStack en 4566.
- Front cliente: `cd client && npm install && npm run dev` (VITE_API_URL debe apuntar al backend). Build: `npm run build`.
- Admin: `cd admin && npm install && npm run dev` (VITE_API_URL a `/api/admin`).
- Swagger: `http://localhost:8080/swagger-ui.html`. Player front usa `/api/stream` asi que no requiere exponer S3.

## Consideraciones de seguridad y hardening
- Cambiar `JWT_SECRET` por valor de al menos 256 bits y rotar regularmente; ajustar `JWT_EXPIRATION` segun politica.
- Limitar CORS a origenes conocidos y habilitar HTTPS en despliegues reales.
- Credenciales admin y app estan en texto plano en `.env` y en localStorage (admin UI). Usar vault/secret manager y tokens cortos para panel.
- Reemplazar bucket LocalStack por S3 real en prod y evitar URL hardcodeada `http://localhost:8080` en `S3Service`/`StreamingController` parametrizando host publico.
- Anadir rate limiting, auditoria y logs estructurados; habilitar `@Validated` en controladores que aceptan input.
- Verificar almacenamiento de contrasenas: flujo publico usa BCrypt, admin puede setear contrasenas al crear usuarios (se encripta si se provee en request). No exponer endpoints admin sin red protegida.

## Limitaciones y pendientes detectados
- No hay pruebas automatizadas ni CI configurado; cobertura desconocida.
- Falta validacion exhaustiva en varios controladores (p.ej. VideoController retorna 501 en `my-videos`).
- `S3Service` construye URLs con host fijo `localhost:8080`; en despliegues externos se debe parametrizar.
- `EnvPrinter` imprime credenciales admin en logs al iniciar (solo para debug) y deberia eliminarse en prod.
- CORS abierto y cache largo en streaming; ajustar segun requerimientos.
- Admin UI guarda Basic Auth en localStorage sin cifrado y carece de control de sesiones/roles; recomendado mover a flujo OAuth o JWT admin separado.

## Referencias rapidas de endpoints (resumen)
- Publico/usuario: `/api/auth/register|login`, `/api/videos` (GET paginado, POST upload), `/api/videos/{id}`, `/api/videos/{id}/comments`, `/api/videos/{id}/like|dislike|reaction`, `/api/users/me` (GET/PUT multipart), `/api/users/me/history`, `/api/users/me/liked`, `/api/users/{userId}/subscribe` (POST/DELETE/GET status), `/api/stream/**` para HLS/archivos.
- Admin (Basic): `/api/admin/login`, `/api/admin/ping`, `/api/admin/metrics/summary`, `/api/admin/{users,videos,comments,subscriptions,reactions,views}` con CRUD completo.

## Siguientes pasos sugeridos
- Anadir pipelines de CI/CD con build/test/lint para los tres proyectos y push de imagenes.
- Incorporar pruebas unitarias/integracion (services, controllers con WebTestClient o MockMvc) y pruebas de frontend con Vitest/Playwright.
- Parametrizar host publico de streaming y soportar firmas temporales en S3 si se usa en nube.
- Implementar busqueda/filtros en feed, editar/borrar videos, y endpoints faltantes (`/api/videos/my-videos`).
- Agregar monitoreo (actuator + metrics), trazabilidad y almacenamiento centralizado de logs.
