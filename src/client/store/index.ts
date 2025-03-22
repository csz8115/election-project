// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice.ts';

const store = configureStore({
  reducer: {
    user: userReducer,  // You can add more reducers here as needed
  },
});

export type RootState = ReturnType<typeof store.getState>;  // Type for the Redux store state
export type AppDispatch = typeof store.dispatch;  // Type for dispatch function

export default store;
