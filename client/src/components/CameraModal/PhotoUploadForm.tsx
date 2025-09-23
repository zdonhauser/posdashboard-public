import React, { useState } from "react";
import CameraModal from "./CameraModal";
import "./PhotoUploadForm.scss";

const PhotoUploadForm = ({ selectedMember, onClose, setMembers, members }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' or 'error'

  const handleCapture = async (blob) => {
    setIsUploading(true);
    await handlePhotoUpload(blob);
  };

  const handlePhotoUpload = async (capturedImage) => {
    if (capturedImage) {
      try {
        if (window.electronAPI && window.electronAPI.writeFile) {

          const formattedMembershipNumber = selectedMember.membership_number.toString().padStart(6, '0');

          // Attempt to use Electron's writeFile method
          const fileName = `${formattedMembershipNumber}.jpg`;

          // Convert Blob to ArrayBuffer
          const arrayBuffer = await capturedImage.arrayBuffer();

          // Attempt to write the file
          await window.electronAPI.writeFile(fileName, arrayBuffer);

          // Update the member's photo in the state
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              const newMembers = members.map((member) =>
                member.membership_number === selectedMember.membership_number
                  ? { ...member, photo: reader.result }
                  : member
              );
              setMembers(newMembers);
              setUploadStatus("success");
              // Automatically close after a delay
              setTimeout(() => {
                onClose();
              }, 1500);
            }
          };
          reader.readAsDataURL(capturedImage);
        } else {
          // Electron API not available, proceed with API upload
          await uploadViaAPI(capturedImage);
        }
      } catch (error) {
        console.error("Electron upload failed, falling back to API upload:", error);
        // If Electron upload failed, fall back to API upload
        await uploadViaAPI(capturedImage);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const uploadViaAPI = async (capturedImage) => {
    const formData = new FormData();
    formData.append("image", capturedImage);
    formData.append(
      "membership_number",
      selectedMember.membership_number.toString()
    );

    try {
      const response = await fetch("/api/upload-member-photo", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            const newMembers = members.map((member) =>
              member.membership_number === selectedMember.membership_number
                ? { ...member, photo: reader.result }
                : member
            );
            setMembers(newMembers);
            setUploadStatus("success");
            // Automatically close after a delay
            setTimeout(() => {
              onClose();
            }, 1500);
          }
        };
        reader.readAsDataURL(capturedImage);
      } else {
        console.error("Failed to upload photo");
        setUploadStatus("error");
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      setUploadStatus("error");
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!selectedMember) {
    return null;
  }

  return (
    <div className="photo-upload-form modal">
      {isUploading && <div className="uploading-message">Uploading photo...</div>}
      {uploadStatus === "success" && (
        <div className="upload-success">Photo uploaded successfully!</div>
      )}
      {uploadStatus === "error" && (
        <div className="upload-error">
          Failed to upload photo.
          <button onClick={() => setUploadStatus(null)}>Retry</button>
        </div>
      )}
      <CameraModal
        show={!isUploading && !uploadStatus}
        onCapture={handleCapture}
        onClose={handleClose}
      />
    </div>
  );
};

export default PhotoUploadForm;
