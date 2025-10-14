import {create} from "zustand";

type ErrorMessageStore = {
  error: string | null;
  setErrorMessage: (error: string | null) => void;
};

const INITIAL_STATE = {
  error: null,
};

export const useErrorMessage = create<ErrorMessageStore>((set) => {
  return {
    ...INITIAL_STATE,
    setErrorMessage: (error: string | null) => set({error}),
  };
});
const setterSelector = (state: ErrorMessageStore) => state.setErrorMessage;

export const useErrorMessageTrigger = () => {
  return useErrorMessage(setterSelector);
};
