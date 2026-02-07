import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useEffect, useState } from "react";
import {
  generateBlog,
  type PipelineStep,
  type PipelineResult,
  type TokenUsage,
} from "../lib/llm";
import { getModelId } from "../lib/config";
import { getModelDef } from "../lib/models";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const STEPS: { key: PipelineStep; label: string }[] = [
  { key: "writing", label: "Writing blog post" },
  { key: "reviewing", label: "Reviewing & correcting" },
  { key: "formatting", label: "Formatting final version" },
];

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

interface WritingPageProps {
  topic: string;
  initialUsage?: TokenUsage;
  onComplete: (result: PipelineResult) => void;
  onBack: () => void;
}

export const WritingPage = ({ topic, initialUsage, onComplete, onBack }: WritingPageProps) => {
  const [currentStep, setCurrentStep] = useState<PipelineStep>("writing");
  const [usage, setUsage] = useState<TokenUsage>(
    initialUsage ?? { inputTokens: 0, outputTokens: 0, cost: 0 },
  );
  const [frame, setFrame] = useState(0);
  const [error, setError] = useState("");

  const modelName = getModelDef(getModelId() ?? "").name;

  useKeyboard((key) => {
    if (error && key.name === "return") {
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
    const baseInput = initialUsage?.inputTokens ?? 0;
    const baseOutput = initialUsage?.outputTokens ?? 0;
    const baseCost = initialUsage?.cost ?? 0;

    generateBlog(topic, (progress) => {
      setCurrentStep(progress.step);
      setUsage({
        inputTokens: baseInput + progress.usage.inputTokens,
        outputTokens: baseOutput + progress.usage.outputTokens,
        cost: baseCost + progress.usage.cost,
      });
    })
      .then((result) => {
        onComplete({
          payload: result.payload,
          usage: {
            inputTokens: baseInput + result.usage.inputTokens,
            outputTokens: baseOutput + result.usage.outputTokens,
            cost: baseCost + result.usage.cost,
          },
        });
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <box
      justifyContent="flex-start"
      alignItems="center"
      style={{ height: "100%" }}
    >
      <ascii-font font="block" text="Writing" style={{ marginTop: "2%" }} />
      <text style={{ marginTop: 2 }} attributes={TextAttributes.DIM}>
        {`Generating blog post about: ${topic.length > 60 ? topic.slice(0, 57) + "..." : topic}`}
      </text>
      <box
        flexDirection="column"
        style={{
          marginTop: 2,
          border: true,
          width: "auto",
          minWidth: "50%",
          paddingLeft: 2,
          paddingRight: 2,
          paddingTop: 1,
          paddingBottom: 1,
        }}
        title="Progress"
        titleAlignment="center"
      >
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          const prefix = isDone
            ? "✓"
            : isActive
              ? SPINNER_FRAMES[frame]!
              : "○";
          const color = isDone ? "#69DB7C" : isActive ? "#7AA2F7" : undefined;

          return (
            <text
              key={step.key}
              fg={color}
              attributes={!isDone && !isActive ? TextAttributes.DIM : undefined}
            >
              {prefix} {step.label}
            </text>
          );
        })}
      </box>
      <text style={{ marginTop: 1 }} attributes={TextAttributes.DIM}>
        Model: {modelName} | Tokens: {formatTokens(usage.inputTokens)} in /{" "}
        {formatTokens(usage.outputTokens)} out | Cost: {formatCost(usage.cost)}
      </text>
      {error ? (
        <box flexDirection="column" alignItems="center" style={{ marginTop: 1 }}>
          <text fg="#FF6B6B">Error: {error}</text>
          <text attributes={TextAttributes.DIM}>Press Enter to go back.</text>
        </box>
      ) : null}
    </box>
  );
};
