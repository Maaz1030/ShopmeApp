import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

//  Create Listing Thunk (handles multiple images)
export const createListing = createAsyncThunk(
  'products/createListing',
  async ({ title, description, price, category, photo, user }, { rejectWithValue }) => {
    try {
      if (!photo || (Array.isArray(photo) && photo.length === 0)) {
        throw new Error('No photos selected');
      }

      const uid = user.uid;
      const uploadedURLs = [];

      // normalize to array
      const photoArray = Array.isArray(photo) ? photo : [photo];

      for (const uri of photoArray) {
        if (!uri) continue;
        const ref = storage().ref(`shopme_productImages/${Date.now()}_${uid}.jpg`);
        await ref.putFile(uri);
        const url = await ref.getDownloadURL();
        uploadedURLs.push(url);
      }

      const listingData = {
        title,
        description,
        price,
        category,
        images: uploadedURLs, //array of image URLs
        sellerId: uid,
        sellerName: user.name || user.displayName || '',
        sellerAvatar: user.photoURL || '',
        createdAt: new Date().toISOString(),
      };

      const docRef = await firestore()
        .collection('shopme_products')
        .add({
          ...listingData,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      return { id: docRef.id, ...listingData };
    } catch (error) {
      console.log('Create Listing Error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Slice definition
const productSlice = createSlice({
  name: 'products',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createListing.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default productSlice.reducer;