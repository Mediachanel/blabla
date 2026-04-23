CREATE USER IF NOT EXISTS 'sisdmk2_app'@'%' IDENTIFIED BY 'sisdmk2_app_password_2026';
GRANT SELECT, INSERT, UPDATE, DELETE ON `si_data`.* TO 'sisdmk2_app'@'%';
FLUSH PRIVILEGES;
