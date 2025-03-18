#!/bin/bash

# Prep Cleanup
cd /var/www
sudo rm -rf card-battler

# Clone the repository
cd /home/cc
gh repo clone Zer0Krypt/CardCollector

# Move the deploy script to the home directory
sudo mv CardCollector/deploy.sh /home/cc/deploy.sh

# Create application directory
sudo mkdir -p /var/www/card-battler
sudo cp -r /home/cc/CardCollector/* /var/www/card-battler/
sudo chown -R cc:cc /var/www/card-battler
cd /var/www/card-battler

# Install PM2 globally for process management
sudo npm install -y pm2 -g

# Install application dependencies
sudo npm install

# Create and set permissions for the database directory
sudo mkdir -p /var/www/card-battler/data
sudo chown -R $USER:$USER /var/www/card-battler/data

# Create systemd service file for the application
sudo tee /etc/systemd/system/card-battler.service << EOF
[Unit]
Description=Card Battler Game
After=network.target

[Service]
Type=simple
User=cc
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DB_PATH=/var/www/card-battler/data/database.sqlite
WorkingDirectory=/var/www/card-battler
ExecStart=/usr/bin/node /var/www/card-battler/server.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Setup Nginx as reverse proxy
sudo tee /etc/nginx/sites-available/card-battler << EOF
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Add error logging
    error_log /var/log/nginx/card-battler-error.log;
    access_log /var/log/nginx/card-battler-access.log;
}
EOF

# Install Nginx if not already installed
sudo apt install -y nginx

# Enable the site
sudo ln -s /etc/nginx/sites-available/card-battler /etc/nginx/sites-enabled/

# Start services
sudo systemctl daemon-reload
sudo systemctl enable card-battler
sudo systemctl restart card-battler
sudo systemctl restart nginx

# Setup SSL with Certbot (optional but recommended)
sudo apt install -y certbot python3-certbot-nginx
#sudo certbot --nginx -d your_domain.com

# Set proper permissions
sudo chown -R $USER:$USER /var/www/card-battler

#cleanup
cd /home/cc
sudo rm -rf CardCollector