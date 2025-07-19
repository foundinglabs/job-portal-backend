# Job Hunt Backend

This is the backend service for the Job Portal application.

## 🛠 Tech Stack
- Node.js
- Express.js
- Supabase (PostgreSQL)
- Google Cloud Storage (GCS)

---

## 🧑‍💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/foundinglabsaiportal/Job-Portal.git
cd Job-Portal/job-hunt-backend
```
### 2. Install dependencies
```bash
npm install
```
### 3. Environment Variables
```bash
create .env file in root directory & copy following

PORT=5000

# Supabase Database
SUPABASE_DB_HOST=
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=
SUPABASE_DB_NAME=postgres

# Supabase Auth
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY= # Used for token verification on backend, BE VERY CAREFUL WITH THIS!
SUPABASE_JWT_SECRET= # Found in Supabase project settings -> API -> JWT Secret

# Google Cloud Storage
GCS_BUCKET_NAME=your-job-platform-resumes
GCS_PROJECT_ID=your-gcp-project-id
GCS_CLIENT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" # Ensure newlines are escaped
```
### 4. Start the development server
```bash
npm run dev
```
The server should run at http://localhost:5000
Access health check at http://localhost:5000/health

### Postman API Keys
```bash
https://web.postman.co/workspace/My-Workspace~68afb4ec-16b5-4db0-823b-47edda25baa4/collection/38551062-11939c24-c6f7-4b5f-a328-bd499859265d?action=share&source=copy-link&creator=38551062
```
