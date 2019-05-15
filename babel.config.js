module.exports = ({ env }) => ({
  presets: [
    env('test')
      ? ['@babel/preset-env', { targets: { node: 'current' } }]
      : ['@babel/preset-env'],
  ],
  comments: false,
})
