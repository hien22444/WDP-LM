import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import favoriteReducer from "./favoriteSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    favorites: favoriteReducer,
  },
});

export default store;
