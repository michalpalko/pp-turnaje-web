import { firebaseConfig, FIREBASE_ENABLED } from "./firebase-config.js?v=2";

const SDK_VERSION = "12.18.0";

let appPromise = null;
let firestorePromise = null;
let storagePromise = null;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp } = await import(
        `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`
      );
      return initializeApp(firebaseConfig);
    })();
  }
  return appPromise;
}

async function getDb() {
  if (!firestorePromise) {
    firestorePromise = (async () => {
      const { getFirestore } = await import(
        `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`
      );
      const app = await getApp();
      return getFirestore(app);
    })();
  }
  return firestorePromise;
}

async function getStorageInstance() {
  if (!storagePromise) {
    storagePromise = (async () => {
      const { getStorage } = await import(
        `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-storage.js`
      );
      const app = await getApp();
      return getStorage(app);
    })();
  }
  return storagePromise;
}

// Vrati zoznam turnajov z Firestore kolekcie "tournaments", alebo null,
// ak je Firebase vypnuty (FIREBASE_ENABLED = false) v firebase-config.js.
// Dokumenty sa zatial vytvaraju a upravuju rucne v konzole - pozri FIREBASE-SETUP.md.
export async function fetchTournamentsFromFirestore() {
  if (!FIREBASE_ENABLED) return null;

  const { collection, getDocs } = await import(
    `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`
  );
  const db = await getDb();
  const snapshot = await getDocs(collection(db, "tournaments"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Vrati zoznam log sponzorov z Firebase Storage priecinka "sponzors",
// alebo null, ak je Firebase vypnuty. Staci nahrat/zmazat subory priamo
// v priecinku "sponzors" v Storage konzole - nie je potrebne nic dalsie
// nastavovat ani rucne registrovat (na rozdiel od turnajov).
export async function fetchSponsorsFromStorage() {
  if (!FIREBASE_ENABLED) return null;

  const { ref, listAll, getDownloadURL } = await import(
    `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-storage.js`
  );
  const storage = await getStorageInstance();
  const folderRef = ref(storage, "sponzors");
  const result = await listAll(folderRef);

  return Promise.all(
    result.items.map(async (itemRef) => ({
      url: await getDownloadURL(itemRef),
      alt: filenameToAlt(itemRef.name)
    }))
  );
}

function filenameToAlt(fileName) {
  const stem = fileName.replace(/\.[^/.]+$/, "");
  return stem.replace(/[-_]+/g, " ").trim();
}
