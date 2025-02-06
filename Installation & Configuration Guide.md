# The EpicBook! - Installation & Configuration Guide

## 📌 Introduction
This document provides step-by-step instructions on how to install, configure, and run **The EpicBook!** application on **Amazon Linux 2** or a local machine.

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

---

## **3️⃣ Install MySQL Server 5.7**
Run the following commands to install and start **MySQL Server 5.7**:
```bash
sudo yum update
sudo rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2022
sudo sed -i 's/enabled=1/enabled=0/' /etc/yum.repos.d/mysql-community.repo
sudo yum --enablerepo=mysql57-community install mysql-community-server
sudo service mysqld start
sudo service mysqld status
```

Upon installation, MySQL generates a temporary root password. Retrieve it using:
```bash
grep 'temporary password' /var/log/mysqld.log
```

---

## **4️⃣ Install Node.js & npm**
To install Node.js and npm using **NVM** (Node Version Manager):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.nvm/nvm.sh
nvm install v17
node -v
```

---

## **5️⃣ Install Project Dependencies**
After cloning the project, install required dependencies:
```bash
npm install
```

---

## **6️⃣ Set Up MySQL Database**
Navigate to the **database folder** and ensure the database name is `theepicbooks` in all schema files:
```bash
cd db
```

Login to MySQL:
```bash
mysql -h localhost -u root -p
```

Create the database:
```sql
CREATE DATABASE theepicbooks;
```

Run the database scripts:
```bash
mysql -u root -p < db/BuyTheBook_Schema.sql
mysql -u root -p < db/author_seed.sql
mysql -u root -p < db/books_seed.sql
```

Verify that the tables are created by running:
```sql
SHOW TABLES IN theepicbooks;
```

---

## **7️⃣ Configure Database Connection in Node.js**
Update the **config.json** file with the correct MySQL credentials, ensuring that the root password matches the one used during installation.

Once updated, restart the Node.js application:
```bash
node server.js
```

Ensure the application is running and listening on port **8080**.

---

## **8️⃣ Access the Application**
Test if the application is running:
```bash
curl http://localhost:8080
```
Or, open a browser and visit:
```
http://localhost:8080
```

---

## **9️⃣ Set Up Nginx as a Reverse Proxy**

### **Install Nginx**
```bash
sudo yum update -y
sudo amazon-linux-extras install nginx1.12
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

### **Configure Nginx**
Open the Nginx configuration file:
```bash
sudo vi /etc/nginx/conf.d/theepicbooks.conf
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name theepicbooks.com; # Replace with your domain
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

Save and exit the file.

### **Test and Restart Nginx**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

Allow HTTP/HTTPS traffic in firewall (if applicable):
```bash
sudo ufw allow 'Nginx Full'
```

---

## **🔟 Verify the Setup**
Now, visit your server’s **public IP** or **domain name** in a browser:
```
http://your-server-ip
```
If everything is set up correctly, you should see **The EpicBook!** application running via **Nginx**.

---

## **🎯 Conclusion**
Following these steps, you have successfully installed and configured **The EpicBook!** application on **Amazon Linux 2** or your local machine.

### **📌 Next Steps**
- Secure MySQL and Nginx with SSL certificates.
- Deploy the application in a cloud environment.
- Optimize database queries for performance improvements.

🚀 Happy Deploying!

