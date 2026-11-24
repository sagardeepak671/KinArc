export {initializeApp} from 'firebase/app';
export {getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,onAuthStateChanged,signOut,deleteUser,reauthenticateWithPopup,setPersistence,browserLocalPersistence,connectAuthEmulator,signInWithCredential} from 'firebase/auth';
export {getFirestore,doc,getDoc,setDoc,deleteDoc,serverTimestamp,collection,getDocs,runTransaction,connectFirestoreEmulator,onSnapshot} from 'firebase/firestore';
