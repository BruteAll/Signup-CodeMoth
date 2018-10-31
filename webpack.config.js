const path = require('path')

var APP_DIR = path.resolve(__dirname, './src/client.jsx')

module.exports = {
  watch: true,
  entry: APP_DIR,
  output: {
    filename: 'client.js',
    path: path.resolve(__dirname, 'public')
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: [
          'babel-loader'
        ]
      }
    ]
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'node_modules')
    ]
  }
}
