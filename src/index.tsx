import { ConsolePosition, createCliRenderer, TextAttributes } from "@opentui/core";
import { createRoot, useKeyboard } from "@opentui/react";
import { useState } from "react";
import { hasAllKeys } from "./lib/config";
import type { PipelineResult } from "./lib/llm";
import { ApiTestPage } from "./pages/api-test";
import { HomePage } from "./pages/home";
import { PreviewPage } from "./pages/preview";
import { SetupPage } from "./pages/setup";
import { WritingPage } from "./pages/writing";

type Page = "setup" | "home" | "writing" | "preview" | "api-test";

function App() {
  const [exitRequested, setExitRequested] = useState(false);
  const [page, setPage] = useState<Page>(hasAllKeys() ? "home" : "setup");
  const [topic, setTopic] = useState("");
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);

  useKeyboard((key) => {
    switch (key.name) {
      case "`":
        renderer.console.toggle();
        break;
      case "l":
        if (key.ctrl) {
          renderer.console.toggle();
        }
        break;
      case "escape":
        if (exitRequested) {
          process.exit(0);
        }
        setExitRequested(true);
        setTimeout(() => {
          setExitRequested(false);
        }, 2000);
        break;
    }
  });

  const handleSubmitTopic = (submittedTopic: string) => {
    setTopic(submittedTopic);
    setPage("writing");
  };

  const handleWritingComplete = (result: PipelineResult) => {
    setPipelineResult(result);
    setPage("preview");
  };

  const handlePreviewDone = () => {
    setPipelineResult(null);
    setTopic("");
    setPage("home");
  };

  return (
    <box
      alignItems="center"
      justifyContent="center"
      style={{ position: "relative" }}
      flexGrow={1}
    >
      {page === "setup" ? (
        <SetupPage
          onComplete={() => setPage("home")}
          onBack={hasAllKeys() ? () => setPage("home") : undefined}
        />
      ) : page === "api-test" ? (
        <ApiTestPage onBack={() => setPage("home")} />
      ) : page === "writing" ? (
        <WritingPage
          topic={topic}
          onComplete={handleWritingComplete}
          onBack={() => setPage("home")}
        />
      ) : page === "preview" && pipelineResult ? (
        <PreviewPage
          payload={pipelineResult.payload}
          usage={pipelineResult.usage}
          onDone={handlePreviewDone}
        />
      ) : (
        <HomePage
          onTestApi={() => setPage("api-test")}
          onSubmitTopic={handleSubmitTopic}
          onSettings={() => setPage("setup")}
        />
      )}
      <text
        style={{ position: "absolute", right: 0, top: 0 }}
        attributes={TextAttributes.DIM}
      >
        {exitRequested
          ? "Press ESC again to exit."
          : "ESC to exit."}
      </text>
    </box>
  );
}

const renderer = await createCliRenderer({
  consoleOptions: {
    position: ConsolePosition.TOP,
    sizePercent: 30,
  },
});
createRoot(renderer).render(<App />);
