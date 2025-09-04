// Settings.js
import React, { useState } from 'react';
import "./settings.scss"
import { useDemo } from '../../App';

export default function Settings({ onDirectorySelected, setDirectoryHandle, directoryHandle, setIsBFF, isBFF }) {
  const [selectedDirectoryName, setSelectedDirectoryName] = useState(null);
  const { isDemo, setIsDemo } = useDemo();


  // Define handleDirectorySelect outside of the conditional blocks
  const handleDirectorySelect = async () => {
    if (window.electronAPI) {
      try {
        const directoryPath = await window.electronAPI.selectDirectory();
        if (directoryPath) {
          setDirectoryHandle(directoryPath);
          setSelectedDirectoryName(directoryPath);
        }
      } catch (error) {
        console.error('Error accessing file system:', error);
      }
    } else if ('showDirectoryPicker' in window) {
      try {
        const directoryHandle = await window.showDirectoryPicker();
        setSelectedDirectoryName(directoryHandle.name);
        setDirectoryHandle(directoryHandle);
        onDirectorySelected(directoryHandle);
      } catch (error) {
        console.error('Error accessing file system:', error);
      }
    } else {
      alert('Your browser does not support the File System Access API');
    }
  };



  return (
    <div className="settings-div">
      <h1>Settings</h1>
      <h4>Photo Directory</h4>
      {directoryHandle && <p>.../{selectedDirectoryName}/...</p>}
      <button onClick={handleDirectorySelect}>
        {directoryHandle?'Change Photo Directory':'Select Photo Directory'}
      </button>
      <br/>
      <label htmlFor="bff">
      <h4>Is it a BFF Day?</h4>
      <input id="bff" type="checkbox" onChange={e=>setIsBFF(e.target.checked)} checked={isBFF}></input>
      </label>
      <br/>
      <label htmlFor="demo">
      <h4>Demo Mode</h4>
      <input id="demo" type="checkbox" onChange={e=>setIsDemo(e.target.checked)} checked={isDemo}></input>
      </label>
      {/* Additional settings can be added here */}
    </div>
  );
}
