#! /bin/bash

apt update
apt upgrade -y
apt install mysql-server -y


systemctl start mysql
systemctl enable mysql


read -p "Type the username for mysql: " username_mysql

read -sp "Type the password for mysql: " password_mysql
echo

read -p "Type the database name: " database_name


mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS \`$database_name\`;
CREATE USER IF NOT EXISTS '$username_mysql'@'%' IDENTIFIED BY '$password_mysql';
GRANT ALL PRIVILEGES ON \`$database_name\`.* TO '$username_mysql'@'%';
FLUSH PRIVILEGES;
EOF


sed -i 's/^bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
ufw allow 3306/tcp


systemctl restart mysql

echo "Instalation has been finished"