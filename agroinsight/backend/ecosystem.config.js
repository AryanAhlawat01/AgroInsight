module.exports = {
  apps: [
    {
      name: 'agroinsight',
      script: './server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: process.env.PORT || 3000,
      },
    },
  ],
};
