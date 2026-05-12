#!/bin/bash
# Script de setup rápido para VPS Ubuntu 24.04
# Execute como root: sudo bash setup-vps.sh

set -e

echo "=== WA Agent SaaS - Setup VPS ==="

# Cores
GREEN='\033[0;32m'
NC='\033[0m'

# Variáveis
read -p "Domínio (ex: app.seudominio.com): " DOMAIN
read -p "Senha do banco PostgreSQL: " DB_PASS
read -p "Email para SSL: " SSL_EMAIL

echo -e "${GREEN}1. Atualizando sistema...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}2. Instalando dependências...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs postgresql postgresql-contrib nginx certbot python3-certbot-nginx git

# pgvector
apt install -y postgresql-16-pgvector || echo "pgvector não disponível via apt, instalando via extensão..."
cd /tmp
if ! dpkg -l | grep -q postgresql-16-pgvector; then
    apt install -y postgresql-server-dev-16 build-essential
    git clone --branch v0.7.4 https://github.com/pgvector/pgvector.git
    cd pgvector
    make
    make install
    cd ..
    rm -rf pgvector
fi

echo -e "${GREEN}3. Configurando PostgreSQL...${NC}"
sudo -u postgres psql -c "CREATE USER wa_agent WITH PASSWORD '${DB_PASS}';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "CREATE DATABASE wa_agent OWNER wa_agent;" 2>/dev/null || echo "DB already exists"
sudo -u postgres psql -d wa_agent -c "CREATE EXTENSION IF NOT EXISTS vector;"

echo -e "${GREEN}4. Instalando PM2...${NC}"
npm install -g pm2

echo -e "${GREEN}5. Clonando app...${NC}"
cd /opt
if [ ! -d "whatsapp-ai-saas" ]; then
    git clone https://github.com/SEU_USER/whatsapp-ai-saas.git
fi
cd whatsapp-ai-saas
npm install

echo -e "${GREEN}6. Configurando .env...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    # Preencher DATABASE_URL
    sed -i "s|postgresql://postgres:password@localhost:5432/wa_agent|postgresql://wa_agent:${DB_PASS}@localhost:5432/wa_agent|g" .env
    sed -i "s|DIRECT_URL=\"postgresql://postgres:password@localhost:5432/wa_agent\"|DIRECT_URL=\"postgresql://wa_agent:${DB_PASS}@localhost:5432/wa_agent\"|g" .env

    # Gerar AUTH_SECRET
    AUTH_SECRET=$(openssl rand -base64 32)
    sed -i "s|change-me-to-a-random-string|${AUTH_SECRET}|g" .env

    # Configurar URL do app
    sed -i "s|http://localhost:3000|https://${DOMAIN}|g" .env
    sed -i "s|NEXT_PUBLIC_APP_URL=\"http://localhost:3000\"|NEXT_PUBLIC_APP_URL=\"https://${DOMAIN}\"|g" .env

    # Configurar Evolution API URL
    sed -i "s|http://localhost:8080|http://localhost:8080|g" .env

    echo ""
    echo -e "${GREEN}Arquivo .env criado. EDITE com suas credenciais antes de continuar:${NC}"
    echo "  nano /opt/whatsapp-ai-saas/.env"
    echo ""
    read -p "Já configurou o .env? (y/n): " CONFIGURED
    if [ "$CONFIGURED" != "y" ]; then
        echo "Pare o script, configure o .env e rode novamente."
        exit 0
    fi
fi

echo -e "${GREEN}7. Gerando Prisma client e migrando banco...${NC}"
npx prisma generate
npx prisma db push

echo -e "${GREEN}8. Buildando app...${NC}"
npm run build

echo -e "${GREEN}9. Iniciando com PM2...${NC}"
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

echo -e "${GREEN}10. Configurando Nginx...${NC}"
cp nginx.conf /etc/nginx/sites-available/wa-agent
ln -sf /etc/nginx/sites-available/wa-agent /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Substituir domínio no nginx.conf
sed -i "s/seudominio.com/${DOMAIN}/g" /etc/nginx/sites-available/wa-agent

nginx -t
systemctl restart nginx

echo -e "${GREEN}11. Configurando SSL...${NC}"
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email ${SSL_EMAIL}

echo -e "${GREEN}12. Configurando firewall...${NC}"
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  SETUP COMPLETO!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "App rodando em: https://${DOMAIN}"
echo ""
echo "Próximos passos:"
echo "  1. Configure as variáveis no .env (OpenAI, Stripe, Google OAuth)"
echo "  2. Instale a Evolution API:"
echo "     cd /opt && git clone https://github.com/EvolutionAPI/evolution-api.git"
echo "     cd evolution-api && cp .env.example .env && nano .env"
echo "     npm install && npm run build"
echo "     pm2 start /opt/whatsapp-ai-saas/ecosystem-evo.config.cjs"
echo "  3. Configure o EVOLUTION_API_KEY e EVOLUTION_API_URL no .env da app"
echo "  4. Reinicie: pm2 restart wa-agent"
echo ""
echo "Comandos úteis:"
echo "  pm2 status          # Ver status dos processos"
echo "  pm2 logs wa-agent   # Ver logs da app"
echo "  pm2 restart wa-agent # Reiniciar app"
echo "  pm2 monit           # Monitor em tempo real"