// Konfiguracia webovej appky z Firebase Console (Project settings -> Your apps).
//
// POZNAMKA: tento config nie je tajny udaj a je bezpecne ho mat priamo v kode
// (aj vo verejnom repozitari). Firebase config identifikuje projekt, ale
// pristup k datam riadia Firestore/Storage security rules, nie tento subor.
export const firebaseConfig = {
  apiKey: "AIzaSyCoMq9hHR5GkhhnftQPyS6Iy8WRNKzw72A",
  authDomain: "pp-turnaje-web.firebaseapp.com",
  projectId: "pp-turnaje-web",
  storageBucket: "pp-turnaje-web.firebasestorage.app",
  messagingSenderId: "359880232311",
  appId: "1:359880232311:web:ec7f5a604efbdd7196e572"
};

// Web nacitava turnaje z Firestore kolekcie "tournaments" (a sponzorov
// z Firebase Storage). Ak by toto bolo false alebo by nacitanie z Firestore
// zlyhalo, zobrazi sa chybova stranka - lokalny fallback subor uz neexistuje.
export const FIREBASE_ENABLED = true;
