[README.md](https://github.com/user-attachments/files/23670130/README.md)
# Preface

This project is entirely written using AI IDEs, including but not limited to Cursor, Trae, Kiro, and Gemini CLI. It took approximately three months to complete. I only have basic coding skills, and all the code for this project was written by AI. If you find this project helpful, please give it a star.

# Zhangshang Shuati Bao (Production-Ready Version)

An online question-practice platform ready for direct production use, including backend APIs, admin dashboard (V2), H5/WeChat Mini Program frontend; featuring unified login authentication, unified upload authentication, offline/mock separation, route error pages, and same-domain reverse proxy for production hardening.



* Backend: Node.js + Express + Knex (MySQL/SQLite)

* Admin Dashboard (V2): Vue 3 + Vite + Pinia + Naive UI (develops on port 8090, production uses same-domain /admin)

* H5/Mini Program: uni-app (H5 uses same-domain root path /, WeChat Mini Program has independent build)

* Reverse Proxy: Nginx same-domain reverse proxy (/api -> backend, /admin -> admin dashboard, / -> H5)



***
<img src="https://github.com/user-attachments/assets/ae82308f-79d0-4158-90cd-7f6301c7b210" width="350" />
<img src="https://github.com/user-attachments/assets/bc4af513-1d66-4ad3-8400-621af31716b3" width="350" />
<img src="https://github.com/user-attachments/assets/deb7f391-0d9f-4645-9eff-03a7f0983a73" width="350" />
<img src="https://github.com/user-attachments/assets/1926e53b-1210-4ff9-8127-83a3fa095169" width="350" />
<img src="https://github.com/user-attachments/assets/59f03e42-16f4-42ab-bee7-d62e1a11b54b" width="350" />
<img src="https://github.com/user-attachments/assets/329c458b-9ff2-44f1-918b-55129048464a" width="350" />
<img src="https://github.com/user-attachments/assets/940fd970-14be-49dd-9b76-d520a34e7df0" width="350" />
<img src="https://github.com/user-attachments/assets/bb5249d2-9405-4ebd-8041-ed54e2fdb8f0" width="450" />
<img src="https://github.com/user-attachments/assets/56aa8586-a87c-41cc-a80d-ed9a06af7853" width="450" />
## 1. Directory Structure



* backend/                 Backend API service

* admin-panel-v2/          New version of admin dashboard (recommended)

* admin-panel/             Old version of admin dashboard (retained)

* zhangshang-shuati-app/   H5/mini program frontend (uni-app)

* nginx/                   Nginx production configuration (same-domain reverse proxy)

* docker-compose.production.yml  Production orchestration (backend, Admin, H5, MySQL, Nginx, phpMyAdmin)



***

## 2. Quick Start (Local Development)

Prerequisites: Node 18+, npm 9+; Docker optional.

### 2.1 Backend API



```
cd backend

cp .env.example .env   # Modify database, port, etc. as needed

npm i

npm run dev            # http://localhost:3000/api/v1/health
```

### 2.2 Admin Dashboard (V2)



```
cd admin-panel-v2

cp .env.development .env.development  # Configure as needed

\# Optional: Connect directly to your backend (default 3001 or your local port)

\# VITE\_API\_TARGET=http://localhost:3001

npm i

npm run dev            # http://localhost:8090
```

To access the interface directly without a backend during development, enable login mock:



```
\# admin-panel-v2/.env.development

VITE\_DEV\_AUTO\_MOCK=1
```

Offline fallback (local storage seed data) is disabled by default; to enable offline browsing:



```
VITE\_OFFLINE\_FALLBACK=true
```

### 2.3 H5 (Local)



```
cd zhangshang-shuati-app

npm i

npm run dev:h5         # Default ports 8085/8083, depending on your configuration
```

### 2.4 WeChat Mini Program (Development)



* Build:



```
\# Connect directly to your local backend (e.g., 3001)

cross-env NODE\_ENV=development UNI\_PLATFORM=mp-weixin VUE\_APP\_API\_BASE\_URL=http://localhost:3001/api/v1 npm run dev:mp-weixin
```



* Import the dist/build/mp-weixin directory using WeChat Developer Tools, check "Do not verify legal domain names, TLS versions, and HTTPS certificates" (development only).



***

## 3. Authentication and Upload (Production Unified)



* Admin Dashboard (V2): Uses unified Cookie sessions (axios withCredentials=true, 401 automatic refresh and request queue replay).

* Upload: Frontend UploadImage uses Cookie; backend /api/v1/upload/banners uses authV2.verifyAccess + requireRoles('admin') for verification.

* Mini Program/H5: uni-app side request.js uses Bearer Token (not dependent on Cookie, sessions are independent).



***

## 4. Runtime Configuration (Backend-Driven H5)



* Backend new interfaces:


  * GET /api/v1/system/config    Returns runtime configuration (publicly readable)

  * POST /api/v1/system/config   Saves runtime configuration (admin only, Cookie session)

* H5 fetches and caches via src/utils/runtime-config.js on startup, can be read in page logic via getValue('path.to.key', def), achieving "backend change, H5 takes effect immediately".



***

## 5. Production Deployment (Same-Domain Reverse Proxy)

It is recommended to use docker-compose.production.yml to start services with one click (backend, Admin, H5, MySQL, Nginx, phpMyAdmin).



1. Prepare .env.production (root directory)



```
PORT=3000

ADMIN\_PORT=8080

MOBILE\_PORT=8081

DB\_HOST=db

DB\_PORT=3306

DB\_USER=app\_user

DB\_PASSWORD=strong\_password

DB\_NAME=zhangshang\_shuati

JWT\_SECRET=long\_random\_string

CORS\_ORIGINS=https://your\_domain,https://www.your\_domain
```



1. Nginx (nginx/conf.d/default.conf)

* /api/ -> backend:3000/api/

* /admin/ -> admin-panel:80

* / -> mobile-app:80

* Enable HTTPS: Place certificates in nginx/ssl/cert.pem, nginx/ssl/key.pem, uncomment the https server section, and configure 80->443 redirect.

1. Start



```
docker compose -f docker-compose.production.yml up -d --build
```



1. Verification

* https://your\_domain/api/v1/health

* https://your\_domain/admin/

* https://your\_domain/

Alibaba Cloud ECS specific guide: See deploy-aliyun.md.

GitHub Actions automatic deployment: .github/workflows/deploy-aliyun.yml (configure Secrets: ALIYUN\_HOST, ALIYUN\_USER, ALIYUN\_SSH\_KEY, etc.)



***

## 6. Common Issues (Troubleshooting)



* Login timeout (development): Ensure VITE\_API\_TARGET points to your backend port; or enable VITE\_DEV\_AUTO\_MOCK=1.

* 401 (production): Ensure same-domain reverse proxy + HTTPS (Cookie Secure takes effect); cross-domain will cause Cookie loss.

* Upload failure: Cookie sessions are unified; ensure admin dashboard is logged in and Nginx reverse proxies to backend /api/v1/upload.

* Mini program network blocked: Production requires adding your https domain to "request legal domain names"; development can check "do not verify".

* Refresh 404: Nginx needs SPA fallback configuration (this configuration is already set up for root/H5 and /admin/ frontend routes).



***

## 7. Scripts and Commands



* Local backend: `cd backend && npm run dev`

* Local Admin V2: `cd admin-panel-v2 && npm run dev`

* Local H5: `cd zhangshang-shuati-app && npm run dev:h5`

* WeChat Mini Program (development): `cross-env NODE_ENV=development UNI_PLATFORM=mp-weixin VUE_APP_API_BASE_URL=``http://localhost:3001/api/v1`` npm run dev:mp-weixin`

* Production deployment: `docker compose -f docker-compose.production.yml up -d --build`



***

## 8. License

MIT



***

## Appendix: Known Unresolved Issue (WeChat Mini Program Homepage White Screen)

The mp-weixin homepage currently has a white screen issue with no error logs, while H5 works normally. Business logic has been minimized and debugging code cleaned up, but the issue still recurs. Details and contribution methods can be found in `docs/``MINIPROGRAM_KNOWN_ISSUE.md`. (The issue has been identified as an incompatibility between VUE and WeChat Mini Programs.)

> （注：文档部分内容可能由 AI 生成）
