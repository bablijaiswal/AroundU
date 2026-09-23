import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

let initialized = false;

export function initializeFirebaseAdmin() {
  if (admin.getApps && admin.getApps().length > 0) {
    initialized = true;
    return admin.getApp();
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json';

  if (!credentialsPath) {
    throw new Error('Firebase Admin credentials are not configured. Set GOOGLE_APPLICATION_CREDENTIALS in the backend environment.');
  }

  const resolvedPath = path.isAbsolute(credentialsPath)
    ? credentialsPath
    : path.resolve(process.cwd(), credentialsPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Firebase Admin service account file not found: ${resolvedPath}`);
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  } catch (error) {
    throw new Error(`Firebase Admin service account file is invalid JSON: ${resolvedPath}`);
  }

  const certFactory = (admin.credential && admin.credential.cert) ? admin.credential.cert : admin.cert;

  if (typeof certFactory !== 'function') {
    throw new Error('Firebase Admin credential factory is unavailable in this runtime.');
  }

  admin.initializeApp({
    credential: certFactory(serviceAccount),
    projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
  });

  initialized = true;
  return admin.getApp();
}

export async function verifyFirebaseToken(token) {
  const app = initializeFirebaseAdmin();
  return app.auth().verifyIdToken(token);
}
