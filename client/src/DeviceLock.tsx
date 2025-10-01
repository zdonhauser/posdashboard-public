import React, { useState, useEffect } from "react";
import "./DeviceLock.scss"; // Import normal CSS file

const isElectron = !!window.electronAPI;

// Fallback UUID generator (v4) for environments without crypto.randomUUID
const uuidv4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0; // Generate a random integer from 0 to 15
    const v = c === "x" ? r : (r & 0x3 | 0x8); // Set bits for version and variant
    return v.toString(16);
  });
};

const DeviceLock = ({ children }: { children: React.ReactNode }) => {
  const [isApproved, setIsApproved] = useState(isElectron);
  const [isLoading, setIsLoading] = useState(!isElectron); // Skip loading if Electron
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isElectron) return; // Skip validation if running in Electron

    let storedDeviceId = localStorage.getItem("device_id");
    
    // Generate a device ID if not already stored
    if (!storedDeviceId) {
      // Use crypto.randomUUID if available (works in secure contexts), otherwise fallback to uuidv4
      storedDeviceId =
        (crypto && typeof crypto.randomUUID === "function")
          ? crypto.randomUUID()
          : uuidv4();
      localStorage.setItem("device_id", storedDeviceId);
    }

    setDeviceId(storedDeviceId);

    // Check device approval
    fetch("/api/validate-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: storedDeviceId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to validate device.");
        return res.json();
      })
      .then((data) => {
        if (data.approved) {
          setIsApproved(true);
        } else {
          setError("Device not approved. Enter passcode.");
        }
      })
      .catch((err) => {
        console.error("Error validating device:", err);
        setError("Unable to validate device. Try again.");
      })
      .finally(() => setIsLoading(false)); // Mark loading as complete
  }, []);

  const handlePasscodeSubmit = () => {
    if (!passcode.trim()) {
      setError("Passcode cannot be empty.");
      return;
    }

    fetch("/api/verify-passcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode, deviceId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to verify passcode.");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setIsApproved(true);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("Invalid passcode. Try again.");
        }
        setPasscode(""); // Reset passcode field
      })
      .catch((err) => {
        console.error("Error verifying passcode:", err);
        setError("Something went wrong. Try again.");
        setPasscode(""); // Reset passcode field
      });
  };

  if (isLoading) {
    // Display a loading spinner or message while checking approval
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  if (isApproved) {
    return <>{children}</>;
  }

  return (
    <div className="lockcontainer">
      <div className="form">
        <h1>Enter Passcode</h1>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Enter passcode"
        />
        <button onClick={handlePasscodeSubmit}>Submit</button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default DeviceLock;
