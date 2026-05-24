// src/config/firebase.js

const admin = require('firebase-admin');
const logger = require('../utils/logger');

let firebaseApp;

function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  try {
    // Support both JSON file path and env vars
    let credential;

    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      });
    } else {
      // Try loading from file (fallback)
      const serviceAccount = require('../../firebase-admin-key.json');
      credential = admin.credential.cert(serviceAccount);
    }

    firebaseApp = admin.initializeApp({
      credential,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    logger.info('Firebase Admin SDK initialized');
    return firebaseApp;
  } catch (error) {
    logger.error('Firebase Admin SDK initialization failed:', error.message);
    throw error;
  }
}

initializeFirebase();

module.exports = admin;
