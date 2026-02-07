import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import {
  getApiKey,
  getAnthropicApiKey,
  getModelId,
  hasApiKey,
  hasAnthropicApiKey,
  saveApiKey,
  saveAnthropicApiKey,
  saveModelId,
} from "../lib/config";
import { MODELS, getModelDef } from "../lib/models";

type Step = "portfolio" | "anthropic" | "model";

const STEPS: Step[] = ["portfolio", "anthropic", "model"];

function getInitialStep(): Step {
  if (!hasApiKey()) return "portfolio";
  if (!hasAnthropicApiKey()) return "anthropic";
  return "model";
}

function maskKey(key: string): string {
  if (key.length <= 10) return key;
  return key.slice(0, 8) + "..." + key.slice(-4);
}

interface SetupPageProps {
  onComplete: () => void;
  onBack?: () => void;
}

export const SetupPage = ({ onComplete, onBack }: SetupPageProps) => {
  const isReconfigure = !!onBack;
  const [step, setStep] = useState<Step>(
    isReconfigure ? "portfolio" : getInitialStep,
  );
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const navigate = (direction: 1 | -1) => {
    const idx = STEPS.indexOf(step);
    const next = idx + direction;
    if (next < 0) {
      onBack?.();
      return;
    }
    if (next >= STEPS.length) {
      onComplete();
      return;
    }
    setStep(STEPS[next]!);
    setValue("");
    setError("");
  };

  useKeyboard((key) => {
    if (saved) return;

    if (key.name === "tab" && isReconfigure) {
      navigate(key.shift ? -1 : 1);
      return;
    }

    if (step !== "model" && key.name === "return" && !key.ctrl) {
      handleSaveKey();
    }

    if (isReconfigure && key.name === "backspace" && value.length === 0) {
      navigate(-1);
    }
  });

  const handleSaveKey = () => {
    if (value.length === 0) {
      if (isReconfigure) {
        navigate(1);
      }
      return;
    }

    if (step === "portfolio") {
      if (!value.startsWith("dlg24_")) {
        setError('API key must start with "dlg24_"');
        return;
      }
      if (value.length < 10) {
        setError("API key seems too short.");
        return;
      }
      setError("");
      saveApiKey(value);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setValue("");
        setStep("anthropic");
      }, 800);
    } else if (step === "anthropic") {
      if (!value.startsWith("sk-ant-")) {
        setError('Anthropic API key must start with "sk-ant-"');
        return;
      }
      if (value.length < 20) {
        setError("API key seems too short.");
        return;
      }
      setError("");
      saveAnthropicApiKey(value);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setValue("");
        setStep("model");
      }, 800);
    }
  };

  const handleSelectModel = (_index: number, option: { value?: unknown } | null) => {
    if (!option?.value) return;
    saveModelId(option.value as string);
    setSaved(true);
    setTimeout(() => onComplete(), 800);
  };

  const stepNumber = STEPS.indexOf(step) + 1;

  const modelOptions = MODELS.map((m) => ({
    name: m.name,
    description: `$${m.inputPricePerMTok}/MTok in | $${m.outputPricePerMTok}/MTok out`,
    value: m.id,
  }));

  const currentModelIdx = MODELS.findIndex((m) => m.id === getModelId());

  const currentKeyDisplay =
    step === "portfolio"
      ? getApiKey()
      : step === "anthropic"
        ? getAnthropicApiKey()
        : null;

  const currentModelDisplay =
    step === "model" && getModelId()
      ? getModelDef(getModelId()!).name
      : null;

  return (
    <box
      justifyContent="flex-start"
      alignItems="center"
      style={{ height: "100%" }}
    >
      <ascii-font
        font="block"
        text={isReconfigure ? "Settings" : "Setup"}
        style={{ marginTop: "2%" }}
      />

      {step === "model" ? (
        <>
          <text style={{ marginTop: 2 }} attributes={TextAttributes.DIM}>
            Choose the Claude model for blog generation.
            {currentModelDisplay
              ? ` (Current: ${currentModelDisplay})`
              : ""}
          </text>
          <box
            style={{
              marginTop: 1,
              border: true,
              width: "auto",
              minWidth: "50%",
              maxWidth: "50%",
              height: 10,
            }}
            title="Model"
            titleAlignment="center"
          >
            <select
              options={modelOptions}
              onSelect={handleSelectModel}
              focused={!saved}
              height={8}
              selectedIndex={currentModelIdx >= 0 ? currentModelIdx : 0}
            />
          </box>
        </>
      ) : (
        <>
          <text style={{ marginTop: 2 }} attributes={TextAttributes.DIM}>
            {step === "portfolio"
              ? "Enter your denizlg24.com API key."
              : "Enter your Anthropic API key."}
            {isReconfigure && currentKeyDisplay
              ? ` (Current: ${maskKey(currentKeyDisplay)})`
              : ""}
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
            title={step === "portfolio" ? "Portfolio API Key" : "Anthropic API Key"}
            titleAlignment="center"
          >
            <input
              value={value}
              onChange={(val: string) => {
                setValue(val);
                if (error) setError("");
              }}
              placeholder={
                step === "portfolio" ? "dlg24_xxxxxxxxxxxx" : "sk-ant-xxxxxxxxxxxx"
              }
              focused={!saved}
            />
          </box>
        </>
      )}

      {error ? (
        <text style={{ marginTop: 1 }} fg="#FF6B6B">
          {error}
        </text>
      ) : null}
      {saved ? (
        <text style={{ marginTop: 1 }} fg="#69DB7C">
          {step === "portfolio"
            ? "Portfolio API key saved!"
            : step === "anthropic"
              ? "Anthropic API key saved!"
              : "Model saved!"}
        </text>
      ) : (
        <text style={{ marginTop: 1 }} attributes={TextAttributes.DIM}>
          {step === "model"
            ? `Arrows to navigate, Enter to select.`
            : isReconfigure
              ? `Enter to save new key or Tab to skip.`
              : `Enter to save.`}
          {` (${stepNumber}/3)`}
          {isReconfigure ? " | Backspace to go back." : ""}
        </text>
      )}
    </box>
  );
};
