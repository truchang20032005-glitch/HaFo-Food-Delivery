import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD7Q-_RTL1xFoa6g95qlTsMD7SURgGa0q8",
    authDomain: "hafo-auth.firebaseapp.com",
    projectId: "hafo-auth",
    storageBucket: "hafo-auth.firebasestorage.app",
    messagingSenderId: "943236627122",
    appId: "1:943236627122:web:602215ae6ff108be1127ab",
    measurementId: "G-EHPEYELL4P"
};

const app = initializeApp(firebaseConfig);

// Chỉ cần export cái này là đủ
export const auth = getAuth(app);