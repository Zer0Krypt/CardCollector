# Update package list
sudo apt update

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install SQLite
sudo apt install -y sqlite3

# Verify installations
node --version
npm --version
sqlite3 --version