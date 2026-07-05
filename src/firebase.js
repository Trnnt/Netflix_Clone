// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getAuth, signInWithCustomToken } from "firebase/auth";

// TODO: Replace with your app's Firebase project configuration
// You can get this from the Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
  apiKey: "AIzaSyCmymWSiLDH5yeSqyWR4dg1Mxu4sMA25xc",
  authDomain: "dream-1a504.firebaseapp.com",
  databaseURL: "https://dream-1a504-default-rtdb.firebaseio.com",
  projectId: "dream-1a504",
  storageBucket: "dream-1a504.firebasestorage.app",
  messagingSenderId: "2066070490",
  appId: "1:2066070490:web:df142f63d60e4eef815ee3",
  measurementId: "G-N9QBVNRDYC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics and get a reference to the service
// This allows you to track "Active Users" in the Firebase console
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Firebase Auth
export const auth = getAuth(app);

/**
 * Utility function to track custom events (like playing a movie)
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (analytics) {
    logEvent(analytics, eventName, eventParams);
  }
};
