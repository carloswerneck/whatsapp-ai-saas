module.exports = {
  apps: [
    {
      name: "wa-agent",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/opt/whatsapp-ai-saas",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};