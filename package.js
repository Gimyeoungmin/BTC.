{
  "name": "p2p-wallet",
  "version": "1.0.0", 
  "description": "P2P Blockchain Wallet Application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "blockchain",
    "wallet", 
    "p2p",
    "cryptocurrency",
    "bitcoin"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.21.2",
    "ws": "^8.18.0",
    "nodemailer": "^6.9.7",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
