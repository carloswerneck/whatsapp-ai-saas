module.exports = {
  apps: [
    {
      name: "evolution-api",
      script: "dist/main.js",
      cwd: "/opt/evolution-api",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};