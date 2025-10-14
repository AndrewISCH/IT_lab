import {useCallback, useEffect, useRef, useState} from "react";
import {useErrorMessage} from "../../../store/useErrorMessage";
import "./styles.css";

const MODAL_DURATION = 5000;

export const ErrorMessage = () => {
  const {error, setErrorMessage} = useErrorMessage();
  const [displayMessage, setDisplayError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);
  const hideTimeoutRef = useRef<number | undefined>(undefined);

  const clearTimeouts = useCallback(() => {
    clearTimeout(hideTimeoutRef.current);
    clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (!displayMessage && error) {
      clearTimeouts();
      setDisplayError(error);
      setIsVisible(true);

      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        hideTimeoutRef.current = setTimeout(() => {
          setDisplayError(null);
        }, 300);
      }, MODAL_DURATION);
    }

    setErrorMessage(null);
  }, [clearTimeouts, displayMessage, error, setErrorMessage]);

  if (!displayMessage) return null;

  return (
    <div
      className={`error-toast ${isVisible ? "show" : "hide"}`}
      onClick={() => {
        setIsVisible(false);
        setTimeout(() => {
          setDisplayError(null);
          clearTimeouts();
        }, 300);
      }}
    >
      {displayMessage}
    </div>
  );
};
