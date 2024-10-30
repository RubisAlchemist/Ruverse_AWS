import { ruverseClient } from "@apis/ruverse";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
const initialState = {
  audio: {
    sonny: {
      defaultSrc: "https://ruverse-test.com/video/default_sonny.mp4",
      greetingsSrc: "https://ruverse-test.com/video/greetings_sonny.webm",
      errorSrc: "https://ruverse-test.com/video/pardon_sonny.webm",
      noteSrc: "https://ruverse-test.com/video/note_sonny.mp4",
      existingSrc: "https://ruverse-test.com/video/regreetings_sonny.webm",
    },
    karina: {
      defaultSrc: "https://ruverse-test.com/video/default_karina.mp4",
      greetingsSrc: "https://ruverse-test.com/video/greetings_karina.webm",
      errorSrc: "https://ruverse-test.com/video/pardon_karina.webm",
      noteSrc: "https://ruverse-test.com/video/note_karina.mp4",
      existingSrc: "https://ruverse-test.com/video/regreetings_karina.webm",
    },
    isNotePlaying: false,
    isGreetingsPlaying: true,
    src: "",
    upload: {
      error: null,
      isError: false,
      isSuccess: false,
      isLoading: false,
    },
    current: 1,
  },
  modal: {
    open: false,
    message: null,
  },
  sessionStatus: null,
};
export const uploadKlleonRequest = createAsyncThunk(
  "asyncThunk/uploadAudioRequest",
  async (audioForm) => {
    const response = await ruverseClient.post(
      "/counseling/get_klleon_response",
      audioForm,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    const data = response.data;
    return data;
  }
);
export const uploadNewSessionRequest = createAsyncThunk(
  "uploadNewSession", // Type string
  async (formData, { rejectWithValue }) => {
    // Payload creator function
    try {
      console.log(formData);
      const response = await ruverseClient.post("/counseling/init", formData, {
        // It's better to let Axios set the Content-Type header for FormData
        // headers: {
        //   "Content-Type": "multipart/form-data",
        // },
      });
      const data = response.data;
      console.log("response data: ", response);
      return data;
    } catch (error) {
      console.error("Upload failed:", error);
      // Optionally, you can return a custom error message
      return rejectWithValue(error.response.data);
    }
  }
);
export const uploadRequest = createAsyncThunk(
  "asyncThunk/uploadAudioRequest",
  async (audioForm) => {
    console.log(audioForm);
    const response = await ruverseClient.post(
      "/counseling/get_response",
      audioForm,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    const data = response.data;
    console.log("response data: ", response);
    return data;
  }
);
export const aiConsultSlice = createSlice({
  name: "aiConsultSlice",
  initialState,
  reducers: {
    closeModal: (state) => {
      state.modal = initialState.modal;
      state.audio.upload = initialState.audio.upload;
    },
    clearAudioSrc: (state) => {
      state.audio.src = initialState.audio.src;
    },
    setAudioSrc: (state, action) => {
      state.audio.src = action.payload;
    },
    // 새로운 reducer 추가
    setGreetingsPlayed: (state) => {
      state.audio.isGreetingsPlaying = false;
    },
    setNotePlaying(state) {
      state.audio.isNotePlaying = true;
    },
    clearNotePlaying(state) {
      state.audio.isNotePlaying = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(uploadRequest.pending, (state) => {
      state.audio.upload.isLoading = true;
    });
    builder.addCase(uploadRequest.fulfilled, (state, action) => {
      state.audio.upload.isSuccess = true;
      state.audio.upload.isLoading = false;
      state.audio.upload.isError = false;
      state.audio.upload.error = null;
      state.audio.current += 1;
      state.audio.src = action.payload;
      state.modal.open = true;
      state.modal.message = "요청 성공";
    });
    builder.addCase(uploadRequest.rejected, (state, action) => {
      state.audio.upload.isSuccess = false;
      state.audio.upload.isLoading = false;
      state.audio.upload.isError = true;
      state.audio.upload.error = action.error.message;
      state.audio.src = "error"; // :압정: src를 'error'로 설정
      state.modal.message = "요청 실패";
      state.modal.open = true;
    });
    // uploadNewSessionRequest 관련 리듀서 추가
    builder.addCase(uploadNewSessionRequest.pending, (state) => {
      state.audio.upload.isLoading = true;
      state.audio.upload.isError = false;
      state.audio.upload.error = null;
    });
    builder.addCase(uploadNewSessionRequest.fulfilled, (state, action) => {
      state.audio.upload.isLoading = false;
      state.audio.upload.isSuccess = true;
      state.sessionStatus = action.payload.status; // 세션 상태 저장
    });
    builder.addCase(uploadNewSessionRequest.rejected, (state, action) => {
      state.audio.upload.isLoading = false;
      state.audio.upload.isError = true;
      state.audio.upload.error = action.payload || action.error.message;
    });
  },
});
export const {
  clearAudioSrc,
  closeModal,
  setAudioSrc,
  setGreetingsPlayed,
  setNotePlaying,
  clearNotePlaying,
} = aiConsultSlice.actions;
export default aiConsultSlice.reducer;