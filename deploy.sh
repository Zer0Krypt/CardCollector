#!/bin/bash

# Create application directory
mkdir -p /var/www/card-battler
cd /var/www/card-battler

# Install PM2 globally for process management
sudo npm install -y pm2 -g

# Install application dependencies
npm install

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
User=$USER
WorkingDirectory=/var/www/card-battler
ExecStart=/usr/bin/pm2 start server.js --name card-battler
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Setup Nginx as reverse proxy
sudo tee /etc/nginx/sites-available/card-battler << EOF
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Install Nginx if not already installed
sudo apt install -y nginx

# Enable the site
sudo ln -s /etc/nginx/sites-available/card-battler /etc/nginx/sites-enabled/

# Start services
sudo systemctl enable card-battler
sudo systemctl start card-battler
sudo systemctl restart nginx

# Setup SSL with Certbot (optional but recommended)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com

# Set proper permissions
sudo chown -R $USER:$USER /var/www/card-battler