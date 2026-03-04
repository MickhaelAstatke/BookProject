# The EpicBook! - Subscription Experience

## 📌 Introduction

The **EpicBook!** project has transitioned from a one-time purchase cart to a membership-driven reading platform. Readers now choose a plan, activate trials, and unlock curated shelves tailored to their preferences.

> ℹ️ **Environment configuration**
>
> Copy `.env.example` to `.env` (or supply real values in a separate `.env.local`) when running locally. The server auto-loads the first matching `.env*` file it finds.

## Local database setup (default)

Required variables for local development:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Optional but recommended:

- `DATABASE_URL` (single connection string for development)
- `TEST_DATABASE_URL` (used when `NODE_ENV=test`)
- `DB_DIALECT` (defaults to `mysql` in config)

Copy/paste example:

```bash
cp .env.example .env

cat >> .env <<'EOF'
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=bookstore
DB_USER=root
DB_PASSWORD=your_local_password
DB_DIALECT=mysql
DATABASE_URL=mysql://root:your_local_password@127.0.0.1:3306/bookstore
TEST_DATABASE_URL=mysql://root:your_local_password@127.0.0.1:3306/bookstore_test
EOF
```

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

