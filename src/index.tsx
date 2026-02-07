import { ConsolePosition, createCliRenderer, TextAttributes } from "@opentui/core";
import { createRoot, useKeyboard } from "@opentui/react";
import { useState } from "react";
import { hasApiKey } from "./lib/config";
import { ApiTestPage } from "./pages/api-test";
import { HomePage } from "./pages/home";
import { SetupPage } from "./pages/setup";

type Page = "setup" | "home" | "api-test";

function App() {
  const [exitRequested, setExitRequested] = useState(false);
  const [page, setPage] = useState<Page>(hasApiKey() ? "home" : "setup");

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

  return (
    <box
      alignItems="center"
      justifyContent="center"
      style={{ position: "relative" }}
      flexGrow={1}
    >
      {page === "setup" ? (
        <SetupPage onComplete={() => setPage("home")} />
      ) : page === "api-test" ? (
        <ApiTestPage onBack={() => setPage("home")} />
      ) : (
        <HomePage onTestApi={() => setPage("api-test")} />
      )}
      <text
        style={{ position: "absolute", left: 0, bottom: 0 }}
        attributes={TextAttributes.DIM}
      >
        {exitRequested
          ? "Press ESC again to exit."
          : "You can always press ESC to exit."}
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
