# Setup UFW firewall
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Setup fail2ban
sudo apt install -y fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban