import { createSlice } from "@reduxjs/toolkit";
import {
  getFavoriteTutors,
  addFavoriteTutor,
  removeFavoriteTutor,
} from "../services/FavoriteTutorService";

const initialState = {
  favorites: [],
  loading: false,
  error: null,
};

export const favoriteSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    setFavorites: (state, action) => {
      state.favorites = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state) => {
      state.loading = true;
    },
    setError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { setFavorites, setLoading, setError } = favoriteSlice.actions;

// Thunk
export const fetchFavorites = () => async (dispatch) => {
  try {
    dispatch(setLoading());
    const favorites = await getFavoriteTutors();
    dispatch(setFavorites(favorites));
  } catch (error) {
    console.error("Error fetching favorites:", error);
    dispatch(setError(error.message));
  }
};

export const addToFavorites = (tutorId) => async (dispatch) => {
  try {
    await addFavoriteTutor(tutorId);
    dispatch(fetchFavorites()); // Reload danh sách sau khi thêm
  } catch (error) {
    console.error("Error adding to favorites:", error);
    dispatch(setError(error.message));
  }
};

export const removeFromFavorites = (tutorId) => async (dispatch) => {
  try {
    await removeFavoriteTutor(tutorId);
    dispatch(fetchFavorites()); // Reload danh sách sau khi xóa
  } catch (error) {
    console.error("Error removing from favorites:", error);
    dispatch(setError(error.message));
  }
};

export default favoriteSlice.reducer;
