import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";

interface HomePageProps {
  onTestApi: () => void;
}

export const HomePage = ({ onTestApi }: HomePageProps) => {
  useKeyboard((key) => {
    if (key.name === "t" && key.ctrl) {
      onTestApi();
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
          placeholder="Start writing here..."
          onSubmit={(e) => {
            console.log("Submitted:", e);
          }}
          keyBindings={[{ name: "return", ctrl: true, action: "submit" }]}
          focused
        />
      </box>
      <text style={{ marginTop: 1 }} attributes={TextAttributes.DIM}>
        Ctrl+T to test API connection
      </text>
    </box>
  );
};
