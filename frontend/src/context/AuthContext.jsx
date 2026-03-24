import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { ref, set, onValue, get } from 'firebase/database';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Safety timeout to prevent infinite white screen if Firebase fails to resolve
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Firebase Auth timeout reached. Forcing loading state to false.");
        setLoading(false);
      }
    }, 6000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Load additional data from DB (Firebase Realtime DB)
        const dbRef = ref(db, `users/${currentUser.uid}`);
        onValue(dbRef, (snapshot) => {
          const dbData = snapshot.val() || {};
          setUser({
            id: currentUser.uid,
            uid: currentUser.uid,
            name: currentUser.displayName || dbData.name || 'User',
            email: currentUser.email,
            photoURL: currentUser.photoURL || dbData.photoURL,
            phone: dbData.phone || '',
            job: dbData.job || '',
            bio: dbData.bio || ''
          });
          setLoading(false);
          clearTimeout(timer);
        }, (err) => {
          console.error("DB Fetch error:", err);
          setUser({ id: currentUser.uid, email: currentUser.email, name: currentUser.displayName || 'User' });
          setLoading(false);
          clearTimeout(timer);
        }, { onlyOnce: true });
      } else {
        setUser(null);
        setLoading(false);
        clearTimeout(timer);
      }
    }, (err) => {
      console.error("Auth State error:", err);
      setLoading(false);
      clearTimeout(timer);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
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

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error("Reset Password error:", error);
      return { 
        success: false, 
        message: error.message || 'Failed to send reset email' 
      };
    }
  };

  const changePassword = async (newPassword) => {
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        return { success: true };
      }
      throw new Error("No user logged in");
    } catch (error) {
      console.error("Change Password error:", error);
      return { 
        success: false, 
        message: error.message || 'Failed to update password' 
      };
    }
  };
  const updateUserProfile = async (profileData) => {
    try {
      if (auth.currentUser) {
        // Update Firebase Auth (for displayName and photoURL)
        const authUpdates = {};
        if (profileData.displayName) authUpdates.displayName = profileData.displayName;
        if (profileData.photoURL) authUpdates.photoURL = profileData.photoURL;
        
        if (Object.keys(authUpdates).length > 0) {
          await updateProfile(auth.currentUser, authUpdates);
        }

        // Update Realtime Database (for bio, job, phone, name)
        const dbRef = ref(db, `users/${auth.currentUser.uid}`);
        await set(dbRef, {
          name: profileData.displayName || user?.name || '',
          email: auth.currentUser.email,
          photoURL: profileData.photoURL || user?.photoURL || '',
          phone: profileData.phone || user?.phone || '',
          job: profileData.job || user?.job || '',
          bio: profileData.bio || user?.bio || ''
        });

        // Local state will be updated via onAuthStateChanged or manual refresh
        const updatedUser = auth.currentUser;
        setUser(prev => ({
          ...prev,
          name: updatedUser.displayName,
          photoURL: updatedUser.photoURL,
          phone: profileData.phone || prev?.phone || '',
          job: profileData.job || prev?.job || '',
          bio: profileData.bio || prev?.bio || ''
        }));
        
        return { success: true };
      }
      throw new Error("No user logged in");
    } catch (error) {
      console.error("Update Profile error:", error);
      return { success: false, message: error.message };
    }
  };

  const searchAccount = async (searchQuery) => {
    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const results = Object.keys(usersData).map(key => ({ id: key, ...usersData[key] }));
        
        return results.filter(u => 
          (u.email && u.email.includes(searchQuery)) || 
          (u.phone && u.phone.includes(searchQuery)) || 
          (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      return [];
    } catch (error) {
      console.error("Search failed:", error);
      return [];
    }
  };

  const setupRecaptcha = (containerId) => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible'
        });
      }
    } catch (e) {
      console.error("Recaptcha error:", e);
    }
  };

  const sendPhoneOTP = async (phoneNumber) => {
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      return { success: true };
    } catch (error) {
      console.error("SMS sent error:", error);
      return { success: false, message: error.message };
    }
  };

  const verifyPhoneOTP = async (otp) => {
    try {
      const result = await window.confirmationResult.confirm(otp);
      return { success: true, user: result.user };
    } catch (error) {
      console.error("OTP Verification Error:", error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    changePassword,
    updateUserProfile,
    searchAccount,
    setupRecaptcha,
    sendPhoneOTP,
    verifyPhoneOTP,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
