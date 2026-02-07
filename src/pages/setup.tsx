import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import { saveApiKey } from "../lib/config";

interface SetupPageProps {
  onComplete: () => void;
}

export const SetupPage = ({ onComplete }: SetupPageProps) => {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useKeyboard((key) => {
    if (key.name === "return" && !key.ctrl) {
      handleSave();
    }
  });

  const handleSave = () => {
    if (!apiKey.startsWith("dlg24_")) {
      setError('API key must start with "dlg24_"');
      return;
    }
    if (apiKey.length < 10) {
      setError("API key seems too short.");
      return;
    }
    setError("");
    saveApiKey(apiKey);
    setSaved(true);
    setTimeout(() => onComplete(), 1000);
  };

  return (
    <box
      justifyContent="flex-start"
      alignItems="center"
      style={{ height: "100%" }}
    >
      <ascii-font font="block" text="Setup" style={{ marginTop: "2%" }} />
      <text style={{ marginTop: 2 }} attributes={TextAttributes.DIM}>
        Enter your denizlg24.com API key to get started.
      </text>
      <box
        style={{
          marginTop: 1,
          border: true,
          width: "auto",
          minWidth: "60%",
          maxWidth: "60%",
          paddingRight: 2,
          height: "auto",
        }}
        title="API Key"
        titleAlignment="center"
      >
        <input
          value={apiKey}
          onChange={(val: string) => {
            setApiKey(val);
            if (error) setError("");
          }}
          placeholder="dlg24_xxxxxxxxxxxx"
          focused={!saved}
        />
      </box>
      {error ? (
        <text style={{ marginTop: 1 }} fg="#FF6B6B">
          {error}
        </text>
      ) : null}
      {saved ? (
        <text style={{ marginTop: 1 }} fg="#69DB7C">
          API key saved successfully!
        </text>
      ) : (
        <text style={{ marginTop: 1 }} attributes={TextAttributes.DIM}>
          Press Enter to save.
        </text>
      )}
    </box>
  );
};
