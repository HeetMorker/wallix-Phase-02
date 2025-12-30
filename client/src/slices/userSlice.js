import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  role: null,
  allowedAPIs: [],
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserInfo: (state, action) => {
      state.role = action.payload.role;
      state.allowedAPIs = action.payload.allowedAPIs;
    },
    clearUserInfo: (state) => {
      state.role = null;
      state.allowedAPIs = [];
    },
  },
});

// Export actions and reducer
export const { setUserInfo, clearUserInfo } = userSlice.actions;
export default userSlice.reducer;
