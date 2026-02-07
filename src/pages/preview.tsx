import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import { createBlog, type CreateBlogPayload } from "../lib/api";
import type { TokenUsage } from "../lib/llm";
import { getModelId } from "../lib/config";
import { getModelDef } from "../lib/models";

type Status = "previewing" | "uploading" | "success" | "error";

interface PreviewPageProps {
  payload: CreateBlogPayload;
  usage: TokenUsage;
  onDone: () => void;
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export const PreviewPage = ({ payload, usage, onDone }: PreviewPageProps) => {
  const [status, setStatus] = useState<Status>("previewing");
  const [errorMsg, setErrorMsg] = useState("");

  const modelName = getModelDef(getModelId() ?? "").name;

  useKeyboard((key) => {
    if (status === "previewing") {
      if (key.name === "return") {
        handleApprove();
      }
      if (key.name === "backspace") {
        onDone();
      }
    }
    if (status === "success" || status === "error") {
      if (key.name === "return") {
        onDone();
      }
    }
  });

  const handleApprove = () => {
    setStatus("uploading");
    createBlog(payload)
      .then(() => setStatus("success"))
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  };

  return (
    <box
      justifyContent="flex-start"
      alignItems="center"
      style={{ height: "100%" }}
    >
      <ascii-font font="block" text="Preview" style={{ marginTop: "2%" }} />

      <box
        flexDirection="column"
        style={{
          marginTop: 1,
          border: true,
          width: "auto",
          minWidth: "75%",
          maxWidth: "75%",
          paddingLeft: 2,
          paddingRight: 2,
          paddingTop: 1,
          paddingBottom: 1,
        }}
        title="Blog Post"
        titleAlignment="center"
      >
        <text>
          <strong>{payload.title}</strong>
        </text>
        <text style={{ marginTop: 1 }} attributes={TextAttributes.DIM}>
          {payload.excerpt}
        </text>
        {payload.tags.length > 0 ? (
          <text style={{ marginTop: 1 }} fg="#7AA2F7">
            Tags: [{payload.tags.join(", ")}]
          </text>
        ) : null}
      </box>

      <box
        style={{
          marginTop: 1,
          border: true,
          width: "auto",
          minWidth: "75%",
          maxWidth: "75%",
          height: "40%",
        }}
        title="Content"
        titleAlignment="center"
      >
        <scrollbox
          focused={status === "previewing"}
          style={{ width: "100%", height: "100%", paddingLeft: 1, paddingRight: 1 }}
        >
          <text>{payload.content}</text>
        </scrollbox>
      </box>

      <text style={{ marginTop: 1 }} attributes={TextAttributes.DIM}>
        {modelName} | {formatTokens(usage.inputTokens)} in /{" "}
        {formatTokens(usage.outputTokens)} out | Total: ${usage.cost.toFixed(4)}
      </text>

      {status === "previewing" ? (
        <text attributes={TextAttributes.DIM}>
          Enter to approve & upload | Backspace to discard
        </text>
      ) : status === "uploading" ? (
        <text fg="#7AA2F7">Uploading...</text>
      ) : status === "success" ? (
        <text fg="#69DB7C">
          Uploaded successfully! Press Enter to continue.
        </text>
      ) : (
        <text fg="#FF6B6B">
          Upload failed: {errorMsg} — Press Enter to go back.
        </text>
      )}
    </box>
  );
};
