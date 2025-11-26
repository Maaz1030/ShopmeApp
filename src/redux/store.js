import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import productReducer from './productSlice'; 
const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
  },
 middleware: (getDefaultMiddleware) =>
     getDefaultMiddleware({
       serializableCheck: false, //  turns off the warning globally a warnoing was caused by non-serializable data like Firebase Timestamps
     }),

});

export default store;