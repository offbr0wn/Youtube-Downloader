import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DropdownState {
  selectedKeys: Set<string>;
  selectedQuality: Set<string>;
}

const initialState: DropdownState = {
  selectedKeys: new Set(["mp4"]),
  selectedQuality: new Set(["360p"]),
};

const dropdownSlice = createSlice({
  name: "dropdown",
  initialState,
  reducers: {
    setSelectedKeys: (state, action: PayloadAction<Set<string>>) => {
      state.selectedKeys = new Set(action.payload); // Ensure a new Set instance
    },

    setSelectedQuality: (state, action: PayloadAction<Set<string>>) => {
      state.selectedQuality = new Set(action.payload); // Ensure a new Set instance
    },
  },
});

export const { setSelectedKeys, setSelectedQuality } = dropdownSlice.actions;

export default dropdownSlice.reducer;
