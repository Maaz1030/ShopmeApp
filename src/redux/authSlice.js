import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

//
// ─── USER AUTH THUNKS ───
//

// ── Sign‑up user with Firestore + Storage integration 
export const signUpUser = createAsyncThunk(
  'auth/signUpUser',
  async ({ name, email, password, photo }, { rejectWithValue }) => {
    try {
      // Create Firebase Auth user
      const userCred = await auth().createUserWithEmailAndPassword(email, password);
      const uid = userCred.user.uid;

      // Upload image to Storage and get download URL
      let photoURL = '';
      if (photo) {
        const ref = storage().ref(`shopme_profileImages/${uid}.jpg`);
        await ref.putFile(photo);
        photoURL = await ref.getDownloadURL();
      }

      // Update Firebase Auth profile
      await userCred.user.updateProfile({ displayName: name, photoURL });

      // Add Firestore user document
      const userData = {
        uid,
        name,
        email,
        photoURL,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection('shopme_users').doc(uid).set(userData);

      return userData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ── Log in user and fetch Firestore profile ─────────────────────────
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCred = await auth().signInWithEmailAndPassword(email, password);
      const uid = userCred.user.uid;

      const doc = await firestore().collection('shopme_users').doc(uid).get();

      let userData;
      if (doc.exists) {
        userData = doc.data();
      } else {
        userData = {
          uid,
          name: userCred.user.displayName || '',
          email: userCred.user.email,
          photoURL: userCred.user.photoURL || '',
        };
      }

      return userData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ── Log out ─────────────────────────────────────────────────────────
export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await auth().signOut();
  return null;
});

// ── Update profile photo, name, and email (with old image cleanup) ──────────────
export const updateProfileData = createAsyncThunk(
  'auth/updateProfileData',
  async ({ name, email, photo }, { getState, rejectWithValue }) => {
    try {
      const { user } = getState().auth;
      if (!user?.uid) throw new Error('User not logged in');

      const uid = user.uid;
      let newPhotoURL = user.photoURL;

      // ── Upload new photo if changed and local  ─────────────
      if (photo && photo !== user.photoURL && !photo.startsWith('http')) {
        // Delete old photo first if it exists on Firebase Storage
        if (user.photoURL && user.photoURL.startsWith('https://firebasestorage.googleapis.com')) {
          try {
            const oldRef = storage().refFromURL(user.photoURL);
            await oldRef.delete();
          } catch (err) {
            console.log('Old profile image delete skipped:', err?.message || err);
          }
        }

        // Upload new photo with unique filename
        const newRef = storage().ref(`shopme_profileImages/${uid}_${Date.now()}.jpg`);
        await newRef.putFile(photo);
        newPhotoURL = await newRef.getDownloadURL();
      }

      // ── Update Firebase Auth profile ───────────────────────────────────────────
      await auth().currentUser.updateProfile({
        displayName: name,
        photoURL: newPhotoURL,
      });

      // Update email in Auth if changed
      if (email !== user.email) {
        await auth().currentUser.updateEmail(email);
      }

      // ── Update Firestore document ─────────────────────────────────────────────
      const newData = {
        name,
        email,
        photoURL: newPhotoURL,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection('shopme_users').doc(uid).update(newData);

      // Return updated data for Redux store
      return { ...user, ...newData };
    } catch (error) {
      console.log('Update profile error:', error);
      return rejectWithValue(error.message);
    }
  }
);

//
// ─── SLICE ──────────────────────────────────────────────────────────
//

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    darkMode: false,
    notificationsEnabled: true,
  },
  reducers: {
  toggleDarkMode: (state) => {
    state.darkMode = !state.darkMode;
  },
  toggleNotifications: (state) => {
    state.notificationsEnabled = !state.notificationsEnabled;
  },
  setUser: (state, action) => {
    state.user = action.payload;
  },
},
  extraReducers: (builder) => {
    builder
      // ── Sign‑Up ──
      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Login ──
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Logout ──
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      })

      // ── Update Profile ──
      .addCase(updateProfileData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfileData.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfileData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { toggleDarkMode, toggleNotifications, setUser } = authSlice.actions;
export default authSlice.reducer;