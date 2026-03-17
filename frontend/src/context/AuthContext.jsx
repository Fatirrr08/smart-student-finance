import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          id: currentUser.uid,
          uid: currentUser.uid,
          name: currentUser.displayName || 'User',
          email: currentUser.email
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      setUser({
        id: currentUser.uid,
        uid: currentUser.uid,
        name: currentUser.displayName || 'User',
        email: currentUser.email
      });
      return { success: true };
    } catch (error) {
      console.error("Firebase Login error:", error);
      return { 
        success: false, 
        message: error.message || 'Login failed' 
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      
      // Update profile to include name
      await updateProfile(currentUser, { displayName: name });
      
      setUser({
        id: currentUser.uid,
        uid: currentUser.uid,
        name: name,
        email: currentUser.email
      });
      return { success: true };
    } catch (error) {
      console.error("Firebase Registration error:", error);
      return { 
        success: false, 
        message: error.message || 'Registration failed' 
      };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const currentUser = userCredential.user;
      setUser({
        id: currentUser.uid,
        uid: currentUser.uid,
        name: currentUser.displayName || 'User',
        email: currentUser.email
      });
      return { success: true };
    } catch (error) {
      console.error("Google Login error:", error);
      return { 
        success: false, 
        message: error.message || 'Google Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    user,
    login,
    loginWithGoogle,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
