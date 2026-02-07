import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useEffect, useState } from "react";
import { brainstormTopics, type TokenUsage } from "../lib/llm";
import { getModelId } from "../lib/config";
import { getModelDef } from "../lib/models";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

interface TopicPickerPageProps {
  onSelect: (topic: string, usage: TokenUsage) => void;
  onBack: () => void;
}

export const TopicPickerPage = ({ onSelect, onBack }: TopicPickerPageProps) => {
  const [topics, setTopics] = useState<string[]>([]);
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [frame, setFrame] = useState(0);

  const modelName = getModelDef(getModelId() ?? "").name;

  useKeyboard((key) => {
    if (error && key.name === "return") {
      onBack();
    }
    if (key.name === "backspace") {
      onBack();
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    brainstormTopics()
      .then((result) => {
        setTopics(result.topics);
        setUsage(result.usage);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleSelect = (_index: number, option: { name: string } | null) => {
    if (option?.name && usage) {
      onSelect(option.name, usage);
    }
  };

  return (
    <box
      justifyContent="flex-start"
      alignItems="center"
      style={{ height: "100%" }}
    >
      <ascii-font font="block" text="Topics" style={{ marginTop: "2%" }} />

      {loading ? (
        <box flexDirection="column" alignItems="center" style={{ marginTop: 2 }}>
          <text fg="#7AA2F7">
            {SPINNER_FRAMES[frame]} Brainstorming topics...
          </text>
          <text style={{ marginTop: 1 }} attributes={TextAttributes.DIM}>
            Backspace to cancel
          </text>
        </box>
      ) : error ? (
        <box flexDirection="column" alignItems="center" style={{ marginTop: 2 }}>
          <text fg="#FF6B6B">Error: {error}</text>
          <text attributes={TextAttributes.DIM}>Press Enter to go back.</text>
        </box>
      ) : (
        <>
          <text style={{ marginTop: 2 }} attributes={TextAttributes.DIM}>
            Pick a topic to write about:
          </text>
          <box
            style={{
              marginTop: 1,
              border: true,
              width: "auto",
              minWidth: "60%",
              height: Math.min(topics.length + 2, 10),
              paddingLeft: 1,
              paddingRight: 1,
            }}
            title="Suggested Topics"
            titleAlignment="center"
          >
            <select
              options={topics.map((t) => ({ name: t }))}
              onSelect={handleSelect}
              focused
              height={Math.min(topics.length, 8)}
              selectedIndex={0}
            />
          </box>
          {usage ? (
            <text style={{ marginTop: 1 }} attributes={TextAttributes.DIM}>
              {modelName} | {formatTokens(usage.inputTokens)} in /{" "}
              {formatTokens(usage.outputTokens)} out | Cost:{" "}
              {formatCost(usage.cost)}
            </text>
          ) : null}
          <text attributes={TextAttributes.DIM}>
            Enter to select | Backspace to go back
          </text>
        </>
      )}
    </box>
  );
};
