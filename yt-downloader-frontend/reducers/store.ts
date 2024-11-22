import { configureStore } from "@reduxjs/toolkit";
import dropDownReducer from "./dropdownSlice";
export const store = configureStore({
  reducer: {
    dropDown: dropDownReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable the serializable check
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
