# The EpicBook! - Installation, Configuration & Troubleshooting Guide

## Introduction
This document covers local installation and configuration for **The EpicBook!**. Platform-specific server deployment instructions are grouped in a separate section at the end.

---

## **Prerequisites (Local Development)**
Before installing the application, ensure you have the following dependencies:
- **macOS, Linux, or Windows with WSL2**
- **Node.js 20.x** and **npm 10.x**
- **MySQL Server 5.7+**
- **Git**

---

## **Clone the Application Repository**

```bash
git clone https://github.com/pravinmishraaws/theepicbook
cd theepicbook
```

### Troubleshooting
**Issue:** `git: command not found`
- **Solution:** Install Git, then retry clone.

**Issue:** Permission denied when cloning repository
- **Solution:** Ensure SSH keys are configured for GitHub, or use HTTPS clone.

---

## **Install Node.js & npm (via NVM)**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 20
nvm use 20
node -v
npm -v
```

### Troubleshooting
**Issue:** `node: command not found`
- **Solution:** Source NVM (`source ~/.nvm/nvm.sh`) and run `nvm use 20`.

**Issue:** NVM installation failed
- **Solution:** Add `export NVM_DIR="$HOME/.nvm"` to your shell profile and source it.

---

## **Install Project Dependencies**

```bash
npm ci
```

### Troubleshooting
**Issue:** `npm: command not found`
- **Solution:** Verify Node.js installation with `node -v` and `npm -v`.

**Issue:** Missing module errors after install
- **Solution:** Remove `node_modules` and rerun `npm ci`.

---

## **Set Up Environment Variables**

```bash
cp .env.example .env
```

Update `.env` with your local values for DB and Firebase variables.

---

## **Set Up MySQL Database**

Create the database:

```sql
CREATE DATABASE bookstore;
```

Run Sequelize migrations and seeds:

```bash
npm run db:migrate
npm run db:seed
```

To reset local DB state during development:

```bash
npm run db:reset
```

> By default, application startup uses safe sync (no `alter`/`force`). Only use `DB_SYNC_ALTER=true` or `DB_SYNC_FORCE=true` for explicit local development workflows.

### Troubleshooting
**Issue:** Unknown database error
- **Solution:** Ensure the database exists and `DB_NAME` in `.env` matches it.

**Issue:** Access denied for DB user
- **Solution:** Verify `DB_USER` / `DB_PASSWORD` and grant permissions on `DB_NAME`.

---

## **Run the Application**

```bash
npm start
```

The app is served at `http://localhost:8080`.

### Troubleshooting
**Issue:** App crashes on startup
- **Solution:** Re-check `.env`, then run with debug logs: `DEBUG=* node server.js`.

**Issue:** `ECONNREFUSED 127.0.0.1:3306`
- **Solution:** Start MySQL and verify host/port values in `.env`.

---

## **Deployment (Platform-Specific)**

### Amazon Linux 2: MySQL 5.7 installation

```bash
# 1. Update the system
sudo yum update -y

# 2. Add the MySQL Yum repository for MySQL 5.7
sudo yum install -y https://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm

# 3. Import the GPG key
sudo rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2022

# 4. Disable all MySQL repo versions except 5.7
sudo yum-config-manager --disable mysql80-community
sudo yum-config-manager --enable mysql57-community

# 5. Install MySQL Server 5.7
sudo yum install -y mysql-community-server

# 6. Start and verify MySQL service
sudo systemctl start mysqld
sudo systemctl status mysqld
```

Get temporary root password and rotate it:

```bash
sudo grep 'temporary password' /var/log/mysqld.log
mysql -u root -p
```

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'NewStrongPassword123!';
```

### CentOS/Amazon Linux: Nginx reverse proxy

Install and enable Nginx:

```bash
sudo yum install -y epel-release
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

Create `/etc/nginx/conf.d/theepicbooks.conf`:

```nginx
server {
    listen 80;
    server_name your_domain_or_IP;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Validate and restart:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

Deployment troubleshooting:
- `bind() to [::]:80 failed`: free port 80 from another process.
- `502 Bad Gateway`: confirm app is running on `localhost:8080`.
- `403 Forbidden`: verify web directory/file permissions.

---

## **Conclusion**

Following these steps, you can install and run **The EpicBook!** locally and use the deployment section for platform-specific server setup.
