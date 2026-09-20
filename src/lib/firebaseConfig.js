// ---------------------------------------------------------------------------
// Firebase web config.
// ---------------------------------------------------------------------------
// This is public by design. It identifies the project; it does not authorise
// anything. What actually constrains reads and writes is the Realtime Database
// ruleset, published from the Firebase console. Checking this in is correct and
// unavoidable — it ends up in the bundle either way.
//
// Project: khalil-a67e5 (shared with another app).
// Everything this app touches lives under the single top-level key `/umc`,
// so it cannot collide with the other app's data. See NS in ./db.js.
// ---------------------------------------------------------------------------

export const firebaseConfig = {
  apiKey: 'AIzaSyAIgRhmVWQG2X0jWzO4nqyOPjqgbMitgAw',
  authDomain: 'khalil-a67e5.firebaseapp.com',
  projectId: 'khalil-a67e5',
  appId: '1:789078571297:web:a602ade05512712b35a660',
  databaseURL:
    'https://khalil-a67e5-default-rtdb.asia-southeast1.firebasedatabase.app',
}

// An empty databaseURL means "no database": the app then runs entirely on
// local storage and says so, rather than hanging.
export const isConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.databaseURL
)

export default firebaseConfig
