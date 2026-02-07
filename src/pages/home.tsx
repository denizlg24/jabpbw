import { TextAttributes, type TextareaRenderable } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useRef } from "react";

interface HomePageProps {
  onTestApi: () => void;
  onSubmitTopic: (topic: string) => void;
  onSettings: () => void;
}

export const HomePage = ({ onTestApi, onSubmitTopic, onSettings }: HomePageProps) => {
  const textareaRef = useRef<TextareaRenderable>(null);

  useKeyboard((key) => {
    if (key.name === "t" && key.ctrl) {
      onTestApi();
    }
    if (key.name === "s" && key.ctrl) {
      onSettings();
    }
    if (key.name === "return") {
      const topic = textareaRef.current?.plainText.trim() ?? "";
      onSubmitTopic(topic);
    }
  });

  return (
    <box
      justifyContent="flex-start"
      alignItems="center"
      style={{ height: "100%" }}
    >
      <ascii-font font="block" text="Welcome" style={{ marginTop: "2%" }} />
      <text style={{ marginTop: 2 }} attributes={TextAttributes.DIM}>
        Hello, Deniz. What do you want to talk about today?
      </text>
      <box
        style={{
          marginTop: 0,
          border: true,
          width: "auto",
          minWidth: "75%",
          maxWidth: "75%",
          paddingRight: 4,
          height: "auto",
        }}
      >
        <textarea
          ref={textareaRef}
          placeholder="Start writing here..."
          focused
        />
      </box>
      <text style={{ marginTop: 1 }} attributes={TextAttributes.DIM}>
        Enter to submit (empty = auto-topic) | Ctrl+S settings | Ctrl+T test API
      </text>
    </box>
  );
};
