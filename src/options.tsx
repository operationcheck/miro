import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";
import { Button } from "./components/Button";

function Options() {
  // Miro settings
  const [enabled, setEnabled] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [backgroundAutoPlay, setBackgroundAutoPlay] = useState(false);
  const [returnToChapter, setReturnToChapter] = useState(true);
  const [hideUI, setHideUI] = useState(false);
  
  // UI settings
  const [buttonPosition, setButtonPosition] = useState<
    "right-top" | "right-bottom" | "left-top" | "left-bottom"
  >("right-top");
  const [minimalMode, setMinimalMode] = useState(false);

  useEffect(() => {
    // Listen for changes in storage
    const handleStorageChange = (
      changes: { [key: string]: browser.Storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== "local") return;

      if (changes.enabled !== undefined) {
        setEnabled(changes.enabled.newValue as boolean);
      }
      if (changes.autoPlayEnabled !== undefined) {
        setAutoPlayEnabled(changes.autoPlayEnabled.newValue as boolean);
      }
      if (changes.backgroundAutoPlay !== undefined) {
        setBackgroundAutoPlay(changes.backgroundAutoPlay.newValue as boolean);
      }
      if (changes.returnToChapter !== undefined) {
        setReturnToChapter(changes.returnToChapter.newValue as boolean);
      }
      if (changes.hideUI !== undefined) {
        setHideUI(changes.hideUI.newValue as boolean);
      }
      if (changes.buttonPosition) {
        setButtonPosition(
          changes.buttonPosition.newValue as
            | "right-top"
            | "right-bottom"
            | "left-top"
            | "left-bottom"
        );
      }
      if (changes.minimalMode !== undefined) {
        setMinimalMode(changes.minimalMode.newValue as boolean);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);

    // Load saved settings
    (async () => {
      const result = await browser.storage.local.get([
        "enabled",
        "autoPlayEnabled", 
        "backgroundAutoPlay",
        "returnToChapter",
        "hideUI",
        "buttonPosition",
        "minimalMode",
      ]);

      if (result.enabled !== undefined) {
        setEnabled(result.enabled as boolean);
      }
      if (result.autoPlayEnabled !== undefined) {
        setAutoPlayEnabled(result.autoPlayEnabled as boolean);
      }
      if (result.backgroundAutoPlay !== undefined) {
        setBackgroundAutoPlay(result.backgroundAutoPlay as boolean);
      }
      if (result.returnToChapter !== undefined) {
        setReturnToChapter(result.returnToChapter as boolean);
      }
      if (result.hideUI !== undefined) {
        setHideUI(result.hideUI as boolean);
      }
      if (result.buttonPosition) {
        setButtonPosition(result.buttonPosition as "right-top" | "right-bottom" | "left-top" | "left-bottom");
      }
      if (result.minimalMode !== undefined) {
        setMinimalMode(result.minimalMode as boolean);
      }
    })();
    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleSave = async () => {
    await browser.storage.local
      .set({
        enabled,
        autoPlayEnabled,
        backgroundAutoPlay,
        returnToChapter,
        hideUI,
        buttonPosition,
        minimalMode,
      })
      .then(() => {
        alert("Settings have been saved");
      });
  };


  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Miro - Settings</h1>
      <div style={{ marginBottom: "20px" }}>
        <h2>Video Playback Settings</h2>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Enable extension
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={autoPlayEnabled}
              onChange={(e) => setAutoPlayEnabled(e.target.checked)}
              disabled={!enabled}
            />
            Enable auto-play for videos
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={backgroundAutoPlay}
              onChange={(e) => setBackgroundAutoPlay(e.target.checked)}
              disabled={!enabled}
            />
            Enable background auto-play
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={returnToChapter}
              onChange={(e) => setReturnToChapter(e.target.checked)}
              disabled={!enabled}
            />
            Return to chapter after completion
          </label>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={hideUI}
              onChange={(e) => setHideUI(e.target.checked)}
              disabled={!enabled}
            />
            Hide UI buttons on video pages
          </label>
        </div>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <h2>UI Settings</h2>
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="buttonPosition"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Button Position
          </label>
          <select
            id="buttonPosition"
            value={buttonPosition}
            onChange={(e) =>
              setButtonPosition(
                e.target.value as
                  | "right-top"
                  | "right-bottom"
                  | "left-top"
                  | "left-bottom"
              )
            }
            style={{
              width: "100%",
              height: "32px",
              padding: "0 8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          >
            <option value="right-top">Right Top</option>
            <option value="right-bottom">Right Bottom</option>
            <option value="left-top">Left Top</option>
            <option value="left-bottom">Left Bottom</option>
          </select>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={minimalMode}
              onChange={(e) => setMinimalMode(e.target.checked)}
            />
            Use minimal button mode (icon only)
          </label>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Button onClick={handleSave} variant="other">
          Save
        </Button>
        <div style={{ marginLeft: "auto", paddingLeft: "40px" }}>
          Please check{" "}
          <a
            href="https://github.com/operationcheck/miro/"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>{" "}
          for inquiries.
        </div>
      </div>
    </div>
  );
}

const root = document.createElement("div");
document.body.appendChild(root);
createRoot(root).render(<Options />);
