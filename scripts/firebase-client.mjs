export {initializeApp} from 'firebase/app';
export {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut,deleteUser,reauthenticateWithPopup,setPersistence,browserSessionPersistence,connectAuthEmulator,signInWithCredential} from 'firebase/auth';
export {getFirestore,doc,getDoc,setDoc,deleteDoc,serverTimestamp,collection,getDocs,runTransaction,connectFirestoreEmulator,onSnapshot} from 'firebase/firestore';
