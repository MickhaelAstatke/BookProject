# The EpicBook! - Installation, Configuration & Troubleshooting Guide

## Introduction
This document provides step-by-step instructions on how to install, configure, and troubleshoot **The EpicBook!** application on **Amazon Linux 2** or a local machine.

---

## **1️⃣ Prerequisites**
Before installing the application, ensure you have the following dependencies:
- **Amazon Linux 2** or **Local Machine** (with Linux/macOS support)
- **MySQL Server 5.7**
- **Node.js & npm**
- **Git**
- **Nginx** (for reverse proxy setup)

---

## **2️⃣ Clone the Application Repository**
Run the following commands to install **Git** and clone the project repository:

```bash
sudo yum install git -y
git clone https://github.com/pravinmishraaws/theepicbook
```

Move into the project directory:
```bash
cd theepicbook
```

### 🚨 Troubleshooting
**Issue:** "git command not found"
- **Solution:** Install Git using `sudo yum install git -y`

**Issue:** "Permission denied" error when cloning repository
- **Solution:** Ensure SSH keys are properly set up for GitHub or use HTTPS cloning.

---

## **3️⃣ Install MySQL Server 5.7**
Run the following commands to install and start **MySQL Server 5.7**:
```bash
# 1. Update the system
sudo yum update -y

# 2. Add the MySQL Yum repository for MySQL 5.7
sudo yum install -y https://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm

# 3. Import the GPG key (usually auto-imported with the .rpm, but good to be explicit)
sudo rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2022

# 4. Disable all MySQL repo versions except 5.7
sudo yum-config-manager --disable mysql80-community
sudo yum-config-manager --enable mysql57-community

# 5. Install MySQL Server 5.7
sudo yum install -y mysql-community-server

# 6. Start MySQL service
sudo systemctl start mysqld

# 7. Check MySQL service status
sudo systemctl status mysqld

```

That error is normal right after installing MySQL. It means MySQL has set a **temporary root password**, and you **must change it** before doing anything else.

---

### Get Password & Test Mysql Access:

1. **Get the temporary password**:
   ```bash
   sudo grep 'temporary password' /var/log/mysqld.log
   ```

   You'll see something like:
   ```
   [Note] A temporary password is generated for root@localhost: Abc!1234efgh
   ```

2. **Log in to MySQL using that temporary password**:
   ```bash
   mysql -u root -p
   ```
   Enter the temporary password when prompted.

3. **Change the root password**:
   Once inside the MySQL prompt, run:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'NewStrongPassword123!';
   ```

   - Make sure the new password meets MySQL’s password policy: at least 8 characters, includes uppercase, lowercase, numbers, and special characters.

4. **Now you can use MySQL as normal**:
   ```sql
   SHOW DATABASES;
   ```

---

Let me know if you're not able to log in or if the password policy is too strict—you can adjust it if needed.

### 🚨 Troubleshooting
**Issue:** "mysql: command not found"
- **Solution:** Verify MySQL installation with `mysql --version`. If missing, reinstall using the above steps.

**Issue:** "Access denied for user 'root'@'localhost'"
- **Solution:** Use `sudo mysql_secure_installation` to set up a new root password.

**Issue:** "ERROR 2002 (HY000): Can't connect to local MySQL server through socket"
- **Solution:** Ensure MySQL is running with `sudo service mysqld restart`. If the issue persists, check the MySQL socket file location (`/var/lib/mysql/mysql.sock`).

---

## **4️⃣ Install Node.js & npm**
To install Node.js and npm using **NVM**:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.nvm/nvm.sh
nvm install v17
node -v
```

### 🚨 Troubleshooting
**Issue:** "node: command not found"
- **Solution:** Ensure `nvm` is properly sourced using `source ~/.nvm/nvm.sh`

**Issue:** "NVM installation failed"
- **Solution:** Manually add `export NVM_DIR="$HOME/.nvm"` to `~/.bashrc` and source it.

**Issue:** "EACCES: permission denied when installing npm packages"
- **Solution:** Run `npm install` with `--unsafe-perm` flag or use a non-root user.

---

## **5️⃣ Install Project Dependencies**
Run the following command to install required dependencies:
```bash
npm install
```

### 🚨 Troubleshooting
**Issue:** "npm command not found"
- **Solution:** Ensure Node.js is installed correctly using `node -v` and `npm -v`.

**Issue:** "Error: Cannot find module 'express'"
- **Solution:** Run `npm install` again to ensure dependencies are installed.

---

## **6️⃣ Set Up MySQL Database**
Create the database:
```sql
CREATE DATABASE bookstore;
```

Run the database scripts:
```bash
mysql -u root -p < db/BuyTheBook_Schema.sql
mysql -u root -p < db/author_seed.sql
mysql -u root -p < db/books_seed.sql
```

### 🚨 Troubleshooting
**Issue:** "ERROR 1049 (42000): Unknown database 'theepicbooks'"
- **Solution:** Ensure the database is created using `CREATE DATABASE theepicbooks;`

**Issue:** "ERROR 1064 (42000): You have an error in your SQL syntax"
- **Solution:** Verify SQL syntax and check for missing semicolons (`;`).

---

## **7️⃣ Configure Database Connection in Node.js**
Update **config.json** with correct MySQL credentials, then restart the application:
```bash
node server.js
```

### 🚨 Troubleshooting
**Issue:** "ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'"
- **Solution:** Update `config.json` with the correct MySQL username and password.

**Issue:** "Error: connect ECONNREFUSED 127.0.0.1:3306"
- **Solution:** Ensure MySQL is running with `sudo service mysqld status`.

**Issue:** "Application crashes on startup"
- **Solution:** Run `node server.js` with `DEBUG=* node server.js` to get detailed logs.

---

## **8️⃣ Set Up Nginx as a Reverse Proxy**
Edit the Nginx configuration:
```bash
sudo vi /etc/nginx/conf.d/theepicbooks.conf
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

### 🚨 Troubleshooting
**Issue:** "nginx: [emerg] bind() to [::]:80 failed"
- **Solution:** Ensure no other process is using port 80 (`sudo netstat -tulnp | grep 80`).

**Issue:** "502 Bad Gateway"
- **Solution:** Ensure the Node.js application is running (`node server.js`).

**Issue:** "403 Forbidden when accessing the site"
- **Solution:** Verify file and directory permissions in `/var/www/html`.

---

## **🔟 Verify the Setup**
Check if the application is running:
```bash
curl http://localhost:8080
```

If everything is set up correctly, you should see **The EpicBook!** application running.

---

## **🎯 Conclusion**

Following these steps, you have successfully installed, configured, and troubleshot common issues for **The EpicBook!** application.

## Note: Incase you find any other issues, then let me know or raised the pull request to update this document.  

🚀 Happy Deploying!

