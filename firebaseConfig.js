import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'; // Asigură-te că această linie există
import { 
    getAuth, 
    initializeAuth, 
    getReactNativePersistence 
  } from 'firebase/auth';
  //import { getReactNativePersistence } from 'firebase/auth/react-native'; 
  import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyA05BP_MhyW0OsC0oC9tlSRG3pWwdv6d5o",
  authDomain: "nihongo-master-dfc8c.firebaseapp.com",
  projectId: "nihongo-master-dfc8c",
  storageBucket: "nihongo-master-dfc8c.firebasestorage.app",
  messagingSenderId: "1006721640718",
  appId: "1:1006721640718:web:b4ebe045a35b3e972acf5f",
  measurementId: "G-QFVRT9S75S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// if (Platform.OS === 'web') {

//   persistence = undefined; 
// } else {
//   // Pe mobile, folosește AsyncStorage
//   persistence = getReactNativePersistence(AsyncStorage);
// }

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export {auth};
export{app};
export { firebaseConfig };
export const db = getFirestore(app); // Exportă instanța Firestore fără adnotare de tip
