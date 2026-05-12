# Deploy WA Agent SaaS na VPS
# Ubuntu 24.04 LTS

## 1. Atualizar servidor
sudo apt update && sudo apt upgrade -y

## 2. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

## 3. Instalar PostgreSQL + pgvector
sudo apt install -y postgresql postgresql-contrib
sudo apt install -y postgresql-16-pgvector

## 4. Instalar Nginx + Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

## 5. Instalar PM2
sudo npm install -g pm2

## 6. Instalar Git
sudo apt install -y git

## 7. Configurar PostgreSQL
sudo -u postgres psql
# No psql:
# CREATE USER wa_agent WITH PASSWORD 'SUA_SENHA_AQUI';
# CREATE DATABASE wa_agent OWNER wa_agent;
# \c wa_agent
# CREATE EXTENSION IF NOT EXISTS vector;
# \q

## 8. Clonar e configurar o app
cd /opt
git clone https://github.com/SEU_USER/whatsapp-ai-saas.git
cd whatsapp-ai-saas
npm install
cp .env.example .env
# EDITAR O .env COM SUAS CREDENCIAIS
nano .env
npx prisma generate
npx prisma db push

## 9. Build
npm run build

## 10. Iniciar com PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

## 11. Configurar Nginx
sudo cp nginx.conf /etc/nginx/sites-available/wa-agent
sudo ln -s /etc/nginx/sites-available/wa-agent /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

## 12. SSL
sudo certbot --nginx -d seudominio.com

## 13. Instalar Evolution API
cd /opt
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api
cp .env.example .env
# EDITAR .env DA EVOLUTION API
nano .env
npm install
npm run build
pm2 start ecosystem-evo.config.cjs
pm2 save

## 14. Firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable