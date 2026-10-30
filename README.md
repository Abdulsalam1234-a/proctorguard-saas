# ProctorGuard SaaS — Production-Grade Multi-Tenant Proctoring & Assessment Platform

> **Engineered for High-Integrity Examination & Low-Bandwidth Resilience (Emerging-Market & Nigerian Collegiate Context)**

ProctorGuard is an enterprise multi-tenant examination SaaS platform specifically designed for African tertiary institutions, examination councils, and professional certification boards. It addresses power instability, erratic network bandwidth, and academic malpractice with an offline-first **Zero-Data-Loss** synchronization engine, native browser proctoring locks, automated Word (.docx) question ingestion, and dynamic multi-tier institutional quotas.

---

## 1. System Architecture & Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React, Recharts (statistical visual dashboards).
- **Backend**: Next.js Route Handlers with transaction-safe relational database operations, compound indexing, and RBAC middleware.
- **Database & ORM**: PostgreSQL via Prisma ORM with connection pooling, foreign-key cascade rules, and automated fallback store for immediate local zero-setup execution.
- **Document Processing**: `mammoth` Office Open XML engine paired with Nigerian collegiate regex tokenizers for automated question paper extraction.
- **Client Cache & Offline Sync**: Local storage write-through cache backed by monotonic FIFO dispatch queues and fail-safe cryptographic checksum payloads.
- **Anti-Malpractice Proctoring**: Native Browser APIs (`navigator.mediaDevices.getUserMedia`, `document.visibilityState`, `window.blur`, `document.fullscreenElement`, keyboard & context menu hooks).
- **Reporting Engine**: Multi-sheet Excel (`.xlsx`) and CSV generation powered by `xlsx` (SheetJS).

---

## 2. Default Demo Credentials & Preloaded Assessments

| Role | Name / Title | Institutional Email | Password | Preloaded Access Code |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Engr. Mustapha Bello | `admin@proctorguard.edu.ng` | `Admin@2026!` | *Governance Board* |
| **Instructor** | Dr. Folashade Adewale (UNILAG) | `dradewale@unilag.edu.ng` | `Lecturer@2026!` | `LAW301-2026`, `FIN301-EXAM` |
| **Instructor** | Prof. Abubakar Ibrahim (ABU Zaria)| `profibrahim@abu.edu.ng` | `Lecturer@2026!` | `CSC201-TEST` |
| **Candidate** | Chinedu Okonkwo | Matric: `LAW/2022/104` | *(No password needed)* | `LAW301-2026` |
| **Candidate** | Amina Zainab Bello | Matric: `LAW/2022/089` | *(No password needed)* | `LAW301-2026` |
| **Candidate** | Emeka Danladi (Test) | Matric: `LAW/2022/330` | *(No password needed)* | `LAW301-2026` |

---

## 3. Role-Based Access Control (RBAC)

### A. Super Admin (Platform Owner — NUC Oversight)
- **Tenant Directory**: View all registered tertiary institutions, faculty departments, lead instructors, and student attempt volumes.
- **Quota & Tier Calibration**: Upgrade or modify subscriptions across `MEMBER` (50 students, 5 tests/mo), `PRO` (300 students, 25 tests/mo), and `PREMIUM` (1000 students, 100 tests/mo) tiers.
- **Immutable Audit Trail**: Any change to quotas or manual override of candidate scores automatically logs an immutable record with previous/updated diffs in `AuditLog` and dispatches an in-app notification to the instructor.

### B. Instructor (Course & Assessment Manager)
- **Curriculum & Exam CRUD**: Create, clone, modify, publish, archive, and delete examinations.
- **Security Calibration**: Set exam duration, pass mark %, max allowed tab switches, question randomization, option shuffling, and mandatory webcam proctoring.
- **Dual Question Ingestion**:
  - **Word Document (.docx) Extraction**: Upload university test sheets; the parser extracts stems, options, and answer keys into an interactive staging modal for review and bulk commit.
  - **Manual Question Builder**: Modal supporting Single Choice, Multiple Choice, and Short Answer question types with custom point weights.
- **Real-Time Examination Monitor**: Live dashboard displaying candidate heartbeats (green pulse if signal active < 30s), ongoing progress, incoming malpractice flags, and a one-click **Unlock Candidate Attempt** button.
- **Statistical Analytics**: Recharts dashboards for score distribution histograms, malpractice breakdown bars, submission categorization (Normal vs Timeout vs Malpractice Auto-Submit), and Excel (`.xlsx`)/CSV exports.

### C. Student (Exam Candidate)
- **Frictionless Entry**: Direct access via Access Code + Matriculation / Registration Number + Full Name.
- **Strict Single-Attempt Policy**: Enforces one attempt per candidate ID unless explicitly unlocked by the lecturer.
- **One-Question-Per-View Assessment UI**: Progress indicator, question navigator (Answered / Unanswered / Flagged), live countdown timer, ambient network pill, and unobtrusive 160x120px corner webcam mirror.
- **Immediate Outcome**: Post-submission screen detailing score, total points, percentage, PASS/FAIL status, and proctoring logs.

---

## 4. Low-Bandwidth & Proctoring Security Engine

### Zero-Data-Loss Architecture
1. **Instant Write-Through Cache**: Answering any question writes immediately to client `localStorage` before initiating network transmission.
2. **Offline Detection & Queueing**: Listeners on `window.onoffline` trigger an ambient badge: *"Network offline. Progress saved locally."* Answers queue in a monotonic buffer.
3. **Monotonic Auto-Flush**: Upon `window.ononline`, queued answers flush sequentially with original client timestamps.
4. **Fail-Safe Integrity Payload**: During network severance at time expiration, answers are cryptographically checksummed and submitted with background retry workers.

### Anti-Malpractice Enforcement
- **Corner Webcam Mirror**: Active 160x120px mirror initialized via `navigator.mediaDevices.getUserMedia({ video: true })`. Tracks dropped streams and logs alerts.
- **Tab & Window Focus Tracking**: Monitors `document.visibilityState === 'hidden'` and `window.onblur`. Displays a warning modal with remaining allowed switches. When infractions exceed `maxTabSwitches`, session locks immediately, assigns `AUTO_SUBMITTED_VIOLATION`, and submits uncommitted answers.
- **Fullscreen & Clipboard Lockdown**: Enforces fullscreen mode, blocks context menus (`contextmenu`), text selection, and shortcuts (`Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `F12`, `Ctrl+Shift+I`).

---

## 5. Getting Started & Running the Platform

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Connect PostgreSQL (Optional / Production)
Edit `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/examguard?schema=public"
JWT_SECRET="proctorguard-super-secret-jwt-key-2026-high-integrity"
```
Push the schema to PostgreSQL:
```bash
npx prisma db push
npm run seed
```
*(Note: If PostgreSQL is not configured, the platform automatically utilizes its built-in high-resilience persistent in-memory/file store preloaded with the entire Nigerian university test dataset!)*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
