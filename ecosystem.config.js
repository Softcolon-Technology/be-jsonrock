module.exports = {
  apps: [
    {
      name: 'be-jsonrock-prod',
      script: 'dist/index.js',
      env: {
        ...process.env,
        PORT: 3008,
      },
    },
    {
      name: 'be-jsonrock-dev',
      script: 'dist/index.js',
      env: {
        ...process.env,
        PORT: 3009,
      },
    },
  ],
}
