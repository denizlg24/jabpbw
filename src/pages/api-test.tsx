import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useEffect, useState } from "react";
import { fetchBlogSummaries, type IBlog } from "../lib/api";

type Summary = Pick<IBlog, "title" | "excerpt" | "tags">;
type Status = "loading" | "success" | "error";

interface ApiTestPageProps {
  onBack: () => void;
}

export const ApiTestPage = ({ onBack }: ApiTestPageProps) => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useKeyboard((key) => {
    if (key.name === "backspace") {
      onBack();
    }
  });

  useEffect(() => {
    fetchBlogSummaries()
      .then((data) => {
        setSummaries(data);
        setStatus("success");
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  }, []);

  return (
    <box
      justifyContent="flex-start"
      alignItems="center"
      style={{ height: "100%" }}
    >
      <ascii-font font="block" text="API Test" style={{ marginTop: "2%" }} />

      {status === "loading" ? (
        <text style={{ marginTop: 2 }}>Fetching blogs...</text>
      ) : status === "error" ? (
        <text style={{ marginTop: 2 }} fg="#FF6B6B">
          Error: {errorMsg}
        </text>
      ) : (
        <box
          flexDirection="column"
          alignItems="center"
          style={{ marginTop: 2, width: "80%" }}
        >
          <text fg="#69DB7C">
            Connected! Found {summaries.length} blog post
            {summaries.length !== 1 ? "s" : ""}.
          </text>
          <scrollbox
            focused
            style={{
              marginTop: 1,
              height: "50%",
              width: "100%",
              border: true,
            }}
          >
            {summaries.map((s, i) => (
              <box
                key={i}
                flexDirection="column"
                style={{
                  paddingBottom: 1,
                  paddingLeft: 1,
                  paddingRight: 1,
                }}
              >
                <text>
                  <strong>
                    {i + 1}. {s.title}
                  </strong>
                </text>
                <text attributes={TextAttributes.DIM}>{s.excerpt}</text>
                {s.tags && s.tags.length > 0 ? (
                  <text fg="#7AA2F7">[{s.tags.join(", ")}]</text>
                ) : null}
              </box>
            ))}
          </scrollbox>
        </box>
      )}

      <text style={{ marginTop: 1 }} attributes={TextAttributes.DIM}>
        Press Backspace to go back.
      </text>
    </box>
  );
};
