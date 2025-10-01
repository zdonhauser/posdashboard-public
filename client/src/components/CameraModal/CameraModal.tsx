import React, { useState, useEffect, useRef } from "react";

const CameraModal = ({ show, onCapture, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    let stream;
    const startVideoStream = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 480 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error starting video stream:", error);
        setIsLoading(false);
      }
    };

    if (show) {
      startVideoStream();
    }

    return () => {
      // Cleanup function to stop video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => {
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
    };
  }, [show]);

  const startCountdown = () => {
    setCountdown(3); // Start countdown from 3 seconds
  };

  useEffect(() => {
    let countdownInterval;
    if (countdown !== null && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 333);
    } else if (countdown === 0) {
      // Capture the photo when countdown reaches zero
      capturePhoto();
      setCountdown(null); // Reset countdown
    }
    return () => {
      clearInterval(countdownInterval);
    };
  }, [countdown]);

  const capturePhoto = () => {
    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Flash effect
            document.body.classList.add("flash");
            setTimeout(() => {
              document.body.classList.remove("flash");
            }, 100);
            onCapture(blob);
          }
        },
        "image/jpeg",
        0.95
      );
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ( event.key === " ") {
        // Start countdown and capture on Enter or Spacebar and prevent default behavior
        event.preventDefault();
        startCountdown();
      } else if (event.key === "Escape") {
        // Close the modal on Escape
        event.preventDefault();
        onClose();
      }
    };

    // Attach keydown event listener when the modal is shown
    if (show) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      // Cleanup keydown event listener when the modal is hidden
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [show]);

  if (!show) {
    return null;
  }

  return (
    <div className="camera-modal">
      {isLoading && <div className="loading-box">Loading Camera...</div>}
      <video ref={videoRef} className={`video-stream ${isLoading ? "hidden" : ""}`}></video>
      {countdown !== null ? (
        <div className="countdown">{countdown}</div>
      ) : (
        <div className="camera-controls">
          <button onClick={startCountdown} id="photo-capture-button">
            Capture Photo
          </button>
          <button onClick={onClose} id="close-camera-button">
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraModal;
