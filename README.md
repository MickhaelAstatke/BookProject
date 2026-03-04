# The EpicBook! - Subscription Experience

## 📌 Introduction

The **EpicBook!** project has transitioned from a one-time purchase cart to a membership-driven reading platform. Readers now choose a plan, activate trials, and unlock curated shelves tailored to their preferences.

## Quick Start (macOS / Linux / Windows via WSL)

### Required versions

- **Node.js:** `20.x`
- **npm:** `10.x`
- **MySQL:** `5.7+` (local install or Docker)
- **Git**

> If you use Windows, run this project in **WSL2** (Ubuntu recommended) and execute all commands below from the WSL shell.

### 1) Environment setup

Create local environment variables from the sample file:

```bash
cp .env.example .env
```

Update at least these values in `.env`:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- Firebase variables (`FIREBASE_*`) for features that require Firebase services

### 2) Install dependencies

If you use `nvm`, switch to the project runtime first, then install packages:

```bash
nvm use 20
npm ci
```

### 3) Database setup

Create the database in MySQL (example uses the default DB name):

```sql
CREATE DATABASE bookstore;
```

### 4) Run migrations

```bash
npm run db:migrate
```

Optional seed data:

```bash
npm run db:seed
```

### 5) Run the application

```bash
npm start
```

The app starts on `http://localhost:8080` by default.

## Troubleshooting (Local Development)

- **Port collision on `8080`**
  - Run: `lsof -i :8080` (macOS/Linux/WSL) to identify the process.
  - Stop the process or run this app on a different port.

- **Database auth errors (`ER_ACCESS_DENIED_ERROR`)**
  - Re-check `DB_USER` and `DB_PASSWORD` in `.env`.
  - Verify MySQL user permissions for `DB_NAME`.

- **Missing environment variables / startup validation errors**
  - Ensure `.env` exists and was copied from `.env.example`.
  - Confirm required keys are present and not left as placeholder values.

## Docker + Local Startup Flow

Use Docker Compose for the app + MySQL services and keep DB credentials aligned with Sequelize's environment-based config (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).

1. Start services:

   ```bash
   docker compose up -d
   ```

2. Install dependencies:

   ```bash
   npm ci
   ```

3. Run migrations:

   ```bash
   npm run db:migrate
   ```

4. (Optional) Seed starter data:

   ```bash
   npm run db:seed
   ```

5. Start the app:

   ```bash
   npm start
   ```

> The included `Dockerfile` standardizes Node 20 + npm 10 so local and CI environments run the same base image.

## Documentation Structure

1️⃣ Plan Catalogue

2️⃣ Trial Onboarding

3️⃣ Account Management

4️⃣ Premium Catalogue Access

5️⃣ Curated Collections

#### Note: [Installation, Configuration & Troubleshooting Guide](https://github.com/pravinmishraaws/theepicbook/blob/main/Installation%20%26%20Configuration%20Guide.md)

## Application Architecture

![Subscription architecture diagram](https://github.com/user-attachments/assets/50df00cb-ee85-4e9d-beb6-f63a862fbb2a)

---

## **1️⃣ Plan Catalogue**

### **Overview**

Visitors land on the plan selection screen where each tier highlights pricing, trial length, and featured benefits.

### **Features**

- Display plan name, description, and price with billing interval.
- Surface included benefits such as curated shelves and live workshops.
- Promote featured content sourced from the premium catalogue.
- Offer quick actions to start a trial or activate the subscription immediately.

---

## **2️⃣ Trial Onboarding**

### **Overview**

The onboarding page guides new readers through the trial activation process.

### **Features**

- Summarises the steps to personalise the reading dashboard.
- Highlights plans that include trial days and the experiences they unlock.
- Forms connect directly to the `/api/trials` endpoint to provision a trial subscription.

---

## **3️⃣ Account Management**

### **Overview**

Members manage renewals, cancellations, and plan upgrades from the account view.

### **Features**

- Displays current subscription status, renewal date, and trial expiry if applicable.
- Buttons trigger API calls to renew or cancel an active subscription.
- Provides quick actions to switch to another plan without leaving the page.
- Integrates with the premium catalogue endpoint to surface exclusive shelves.

---

## **4️⃣ Premium Catalogue Access**

### **Overview**

Premium-only collections are gated behind an active trial or subscription.

### **Features**

- `/api/catalog/premium` validates subscription status before returning curated books.
- Books display access types (full, excerpt, featured) based on plan entitlements.
- Frontend renders the premium shelf dynamically once access is confirmed.

---

## **5️⃣ Curated Collections**

### **Overview**

Collections replace static categories and reflect the editorial curation tied to each membership tier.

### **Features**

- `/collections/:tag` renders books grouped by their `collectionTag` metadata.
- Each book highlights the plans that grant access and the recommended reading level.
- Encourages readers to explore thematic journeys unlocked through their plan.

---

## System Architecture

### 🛠️ Key Components

- **Frontend**: Handlebars templates + Materialize CSS for the new membership screens.
- **Backend**: Node.js + Express.js powering subscription and catalogue APIs.
- **Database**: MySQL storing authors, books, plans, benefits, and subscriptions.
- **Reverse Proxy**: Nginx (planned) to forward traffic to the Node.js service.

**Cloud Services (Future)**: AWS EC2, RDS, S3, CloudFront, Lambda

---

## 🎯 **Conclusion**

The refactored **EpicBook!** experience introduces tiered memberships, automated trials, and premium content gating. Readers can now seamlessly move from exploration to activation while enjoying curated journeys aligned with their subscription.

---

### **Next Steps**

Developers can extend the platform by:

- Connecting the subscription ledger to an authentication system.
- Integrating payment processors for real billing events.
- Building analytics around collection engagement and churn.
