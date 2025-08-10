import { Play, Square, Settings } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";
import { Button } from "./components/Button";
import logger from "./logger";

// Miro functionality constants
const RGB_COLOR_GREEN = "rgb(0, 197, 65)";
const TYPE_MOVIE_ROUNDED_PLUS = "movie-rounded-plus";
const REDIRECT_TIME = 3000;
const COOL_TIME = 5000;

interface ListItem {
  title: string;
  passed: boolean;
  type: string;
}

// Global state for miro functionality
let isEnabled = true;
let isValidPath: boolean | undefined;
let lastExecutionTime = 0;
let lastVideoPlayerTime = 0;
let lastMovingVideoTime = 0;
let previousVideoPlayer = false;
let previousBackgroundAutoPlay = false;
let videoPlayer: HTMLMediaElement | null = null;
let completed = false;
let autoPlayEnabled = true;
let backgroundAutoPlay = false;
let returnToChapter = true;
let hideUI = false;
let userInteracted = false;
let lastCheckedUrl = "";
let urlCheckIntervalId: number;

// Miro utility functions
function getIsValidPath(): boolean {
  if (isValidPath === undefined) {
    const url = new URL(window.location.href);
    isValidPath = /\/courses\/\w+\/chapters\/\w+\/movie/.test(url.pathname);
  }
  return isValidPath;
}

function findIndex(data: ListItem[]): number {
  return data.findIndex((item) => item.type === "main" && !item.passed);
}

function getList(): ListItem[] {
  let elements: NodeListOf<HTMLLIElement>;

  elements = document.querySelectorAll<HTMLLIElement>(
    'ul[aria-label="必修教材リスト"] > li'
  );

  if (elements.length === 0) {
    elements = document.querySelectorAll<HTMLLIElement>(
      'ul[aria-label="課外教材リスト"] > li'
    );

    if (elements.length === 0) {
      logger.error("No elements found.");
      return [];
    }
  }

  return Array.from(elements).map((element) => {
    const titleElement = element.querySelector<HTMLSpanElement>(
      "div div div span:nth-child(2)"
    );
    const title = titleElement?.textContent?.trim() ?? "";
    const iconElement = element.querySelector<HTMLElement>("div > svg");
    const iconColor = iconElement
      ? window.getComputedStyle(iconElement).color
      : "";
    const passed =
      (iconColor === RGB_COLOR_GREEN ||
        element.textContent?.includes("視聴済み") ||
        element.textContent?.includes("理解した")) ??
      false;
    const type =
      iconElement?.getAttribute("type") === TYPE_MOVIE_ROUNDED_PLUS
        ? "supplement"
        : "main";
    return { title, passed, type };
  });
}

async function moveElement(number: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let element: HTMLElement | null = null;

    element = document.querySelector<HTMLElement>(
      `ul[aria-label="必修教材リスト"] li:nth-child(${number}) div`
    );

    if (element === null) {
      element = document.querySelector<HTMLElement>(
        `ul[aria-label="課外教材リスト"] li:nth-child(${number}) div`
      );
    }

    if (element === null) {
      reject(
        new Error(`Error: cannot find an element with the number ${number}`)
      );
    } else {
      element.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
      resolve();
    }
  });
}

function getVideoPlayer(): HTMLMediaElement | null {
  try {
    if (videoPlayer === null) {
      const iframeElement = document.querySelector<HTMLIFrameElement>(
        'iframe[title="教材"]'
      );
      const iframeDocument =
        iframeElement?.contentDocument ??
        iframeElement?.contentWindow?.document;
      videoPlayer =
        iframeDocument?.querySelector<HTMLMediaElement>("video") ?? null;
    }
    return videoPlayer;
  } catch {
    return null;
  }
}

function handleVideoEnd(): void {
  const now = Date.now();
  if (
    isEnabled &&
    now - lastExecutionTime >= COOL_TIME &&
    now - lastMovingVideoTime >= COOL_TIME
  ) {
    lastExecutionTime = Date.now();
    if (document.hidden && !backgroundAutoPlay) {
      if (!previousBackgroundAutoPlay) {
        logger.info("Did not move because it was playing in the background");
      }
      previousBackgroundAutoPlay = true;
      return;
    }

    if (document.hidden && backgroundAutoPlay) {
      logger.info("Playback proceeds in the background");
    }

    previousBackgroundAutoPlay = false;
    logger.info("Video ended.");

    const list = getList();
    const index = findIndex(list);
    if (index !== -1) {
      moveElement(index + 1)
        .then(() => {
          logger.info("Moving to the next video.");
          lastMovingVideoTime = Date.now();
        })
        .catch(logger.error);
    } else if (!completed) {
      completed = true;
      window.alert("All videos have been completed.");
      logger.info("All videos have been completed.");

      if (returnToChapter) {
        logger.info(`Move to chapter after ${REDIRECT_TIME / 1000} seconds...`);
        setTimeout(() => {
          const url = new URL(window.location.href);
          const course = url.pathname.split("/")[2];
          const chapter = url.pathname.split("/")[4];
          window.location.href = `/courses/${course}/chapters/${chapter}`;
        }, REDIRECT_TIME);
      }
    }
  }
}

// AI and Exercise functions
function htmlToMarkdown(html: string): string {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.trim() || "";
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      if (element.classList.contains("indicators")) {
        return "";
      }

      const tagName = element.tagName.toLowerCase();
      const children = Array.from(node.childNodes).map(processNode).join("");

      switch (tagName) {
        case "h1":
          return `# ${children}\n\n`;
        case "h2":
          return `## ${children}\n\n`;
        case "h3":
          return `### ${children}\n\n`;
        case "h4":
          return `#### ${children}\n\n`;
        case "h5":
          return `##### ${children}\n\n`;
        case "h6":
          return `###### ${children}\n\n`;
        case "p":
          return `${children}\n\n`;
        case "br":
          return "\n";
        case "strong":
        case "b":
          return `**${children}**`;
        case "em":
        case "i":
          return `*${children}*`;
        case "code":
          return `\`${children}\``;
        case "pre":
          return `\`\`\`\n${children}\n\`\`\`\n\n`;
        case "ul":
          return `${children}\n`;
        case "ol":
          return `${children}\n`;
        case "li":
          return `- ${children}\n`;
        case "a": {
          const href = element.getAttribute("href");
          return href ? `[${children}](${href})` : children;
        }
        case "img": {
          const src = element.getAttribute("src");
          const alt = element.getAttribute("alt") || "";
          return src ? `![${alt}](${src})` : alt;
        }
        case "blockquote":
          return `> ${children}\n\n`;
        case "hr":
          return "---\n\n";
        case "div":
        case "span":
          return children;
        default:
          return children;
      }
    }
    return "";
  }

  return processNode(tempDiv).trim();
}

function getExerciseContent(): string | null {
  try {
    let exerciseElements = document.querySelectorAll(".exercise");

    if (exerciseElements.length === 0) {
      const iframeElement = document.querySelector<HTMLIFrameElement>(
        'iframe[title="教材"]'
      );
      const iframeDocument =
        iframeElement?.contentDocument ??
        iframeElement?.contentWindow?.document;

      if (iframeDocument) {
        exerciseElements = iframeDocument.querySelectorAll(".exercise");
      }
    }

    if (exerciseElements.length === 0) {
      return null;
    }

    let markdownContent = "";
    exerciseElements.forEach((element, index) => {
      if (index > 0) {
        markdownContent += "\n---\n\n";
      }
      markdownContent += `# Exercise ${index + 1}\n\n`;
      markdownContent += htmlToMarkdown(element.innerHTML);
    });

    return markdownContent;
  } catch (error) {
    logger.error(`Failed to get exercise content: ${error}`);
    return null;
  }
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    logger.error(`Failed to copy to clipboard: ${error}`);
    return false;
  }
}

const ButtonContainer: React.FC = () => {
  const [buttonPosition, setButtonPosition] = useState<
    "right-top" | "right-bottom" | "left-top" | "left-bottom"
  >("right-top");
  const [minimalMode, setMinimalMode] = useState(false);
  const [extensionEnabled, setExtensionEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [backgroundPlay, setBackgroundPlay] = useState(false);

  // Initialize miro functionality and load settings
  useEffect(() => {
    logger.info("Extension loaded.");
    logger.info(
      "Please star the repository if you like!\nhttps://github.com/operationcheck/miro"
    );

    (async () => {
      // Load settings
      const settings = await browser.storage.local.get([
        "buttonPosition",
        "minimalMode",
        "enabled",
        "autoPlayEnabled",
        "backgroundAutoPlay",
        "returnToChapter",
        "hideUI",
      ]);

      if (settings.buttonPosition) {
        setButtonPosition(
          settings.buttonPosition as
            | "right-top"
            | "right-bottom"
            | "left-top"
            | "left-bottom"
        );
      }
      if (settings.minimalMode !== undefined) {
        setMinimalMode(settings.minimalMode as boolean);
      }
      if (settings.enabled !== undefined) {
        isEnabled = settings.enabled as boolean;
        setExtensionEnabled(settings.enabled as boolean);
      }
      if (settings.autoPlayEnabled !== undefined) {
        autoPlayEnabled = settings.autoPlayEnabled as boolean;
        setAutoPlay(settings.autoPlayEnabled as boolean);
      }
      if (settings.backgroundAutoPlay !== undefined) {
        backgroundAutoPlay = settings.backgroundAutoPlay as boolean;
        setBackgroundPlay(settings.backgroundAutoPlay as boolean);
      }
      if (settings.returnToChapter !== undefined) {
        returnToChapter = settings.returnToChapter as boolean;
      }
      if (settings.hideUI !== undefined) {
        hideUI = settings.hideUI as boolean;
      }

      // Start miro functionality
      startMiroFunctionality();
    })();

    // Listen for storage changes
    const listener = (changes: {
      [key: string]: browser.Storage.StorageChange;
    }) => {
      if (changes.buttonPosition) {
        setButtonPosition(
          changes.buttonPosition.newValue as
            | "right-top"
            | "right-bottom"
            | "left-top"
            | "left-bottom"
        );
      }
      if (changes.minimalMode) {
        setMinimalMode(changes.minimalMode.newValue as boolean);
      }
      if (changes.enabled !== undefined) {
        isEnabled = changes.enabled.newValue as boolean;
        setExtensionEnabled(changes.enabled.newValue as boolean);
        logger.info(`Extension is now ${isEnabled ? "enabled" : "disabled"}`);
      }
      if (changes.autoPlayEnabled !== undefined) {
        autoPlayEnabled = changes.autoPlayEnabled.newValue as boolean;
        setAutoPlay(changes.autoPlayEnabled.newValue as boolean);
      }
      if (changes.backgroundAutoPlay !== undefined) {
        backgroundAutoPlay = changes.backgroundAutoPlay.newValue as boolean;
        setBackgroundPlay(changes.backgroundAutoPlay.newValue as boolean);
      }
    };

    browser.storage.onChanged.addListener(listener);

    // Message listener for context menu actions
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (message && typeof message === "object" && "action" in message) {
        const action = (message as { action: string }).action;

        if (action === "copyExercise") {
          handleCopyExercise();
        } else if (action === "askChatGPT") {
          handleAskAI("ChatGPT", "https://chatgpt.com/?q=");
        } else if (action === "askClaude") {
          handleAskAI("Claude", "https://claude.ai/new?q=");
        } else if (action === "askGenspark") {
          handleAskAI("Genspark", "https://www.genspark.ai/search?query=");
        } else if (action === "askFelo") {
          handleAskAI("Felo", "https://felo.ai/ja/search?q=");
        } else if (action === "askPerplexity") {
          handleAskAI("Perplexity", "https://www.perplexity.ai/search?q=");
        } else if (action === "copyAIPrompt") {
          handleCopyAIPrompt();
        }
      }
    });

    // Cleanup
    return () => {
      browser.storage.onChanged.removeListener(listener);
      stopUrlMonitoring();
    };
  }, []);

  // Miro functionality
  function startMiroFunctionality() {
    checkForSpecialContent();
    startUrlMonitoring();

    let intervalId = setInterval(() => {
      if (getIsValidPath()) {
        videoPlayer = getVideoPlayer();
        if (videoPlayer !== null) {
          if (!previousVideoPlayer) {
            logger.info("Video player found.");
            createPlayButton();
          }
          previousVideoPlayer = true;
          videoPlayer.setAttribute("playsinline", "");
          videoPlayer.setAttribute("muted", "");
          videoPlayer.setAttribute("autoplay", "");
          videoPlayer.setAttribute("controls", "");

          if (videoPlayer.ended) {
            handleVideoEnd();
          } else if (userInteracted && autoPlayEnabled && videoPlayer.paused) {
            videoPlayer.play().catch(logger.error);
          } else {
            videoPlayer.addEventListener("ended", handleVideoEnd);
          }
          clearInterval(intervalId);
        } else if (Date.now() - lastVideoPlayerTime > COOL_TIME) {
          logger.info("Video player not found.");
          lastVideoPlayerTime = Date.now();
        }
      }
    }, 500);

    // Set up mutation observer to handle DOM changes
    const observer = new MutationObserver(() => {
      videoPlayer = null;
      isValidPath = undefined;
      intervalId = setInterval(() => {
        // Restart the interval when DOM changes
        if (getIsValidPath()) {
          videoPlayer = getVideoPlayer();
          if (videoPlayer !== null) {
            if (!previousVideoPlayer) {
              logger.info("Video player found.");
              createPlayButton();
            }
            previousVideoPlayer = true;

            videoPlayer.setAttribute("playsinline", "");
            videoPlayer.setAttribute("muted", "");
            videoPlayer.setAttribute("autoplay", "");
            videoPlayer.setAttribute("controls", "");

            if (videoPlayer.ended) {
              handleVideoEnd();
            } else if (userInteracted && autoPlayEnabled && videoPlayer.paused) {
              videoPlayer.play().catch(logger.error);
            } else {
              videoPlayer.addEventListener("ended", handleVideoEnd);
            }

            clearInterval(intervalId);
          } else if (Date.now() - lastVideoPlayerTime > COOL_TIME) {
            logger.info("Video player not found.");
            lastVideoPlayerTime = Date.now();
          }
        }
      }, 500);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function createPlayButton() {
    if (hideUI || document.getElementById("videoPlayButton")) return;

    const button = document.createElement("button");
    button.id = "videoPlayButton";
    button.style.cssText = `
      position: fixed;
      z-index: 999999;
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      bottom: 20px;
      left: 20px;
    `;
    button.innerHTML = "<span>Play Video</span>";

    button.addEventListener("click", () => {
      userInteracted = true;
      if (videoPlayer) {
        videoPlayer.play().catch(logger.error);
        button.remove();
      }
    });

    document.body.appendChild(button);
  }

  function startUrlMonitoring(): void {
    checkForSpecialContent();
    urlCheckIntervalId = window.setInterval(() => {
      checkForSpecialContent();
    }, 2000);
    logger.info("URL monitoring started");
  }

  function stopUrlMonitoring(): void {
    if (urlCheckIntervalId) {
      clearInterval(urlCheckIntervalId);
      logger.info("URL monitoring stopped");
    }
  }

  function checkForSpecialContent(): void {
    const currentUrl = window.location.href.toLowerCase();
    if (currentUrl === lastCheckedUrl) return;

    lastCheckedUrl = currentUrl;
    logger.info(`Checking URL for special content: ${currentUrl}`);

    const specialKeywords = [
      "evaluation_test",
      "essay_test",
      "evaluation_report",
      "essay_report",
    ];
    const foundKeyword = specialKeywords.find((keyword) =>
      currentUrl.includes(keyword)
    );

    if (foundKeyword) {
      const messages = {
        evaluation_test:
          "Evaluation test detected! Please complete the assessment.",
        essay_test:
          "Essay test detected! Please complete the written assignment.",
        evaluation_report:
          "Evaluation report detected! Please review the assessment results.",
        essay_report:
          "Essay report detected! Please review the essay feedback.",
      };
      const message = messages[foundKeyword as keyof typeof messages];

      browser.runtime
        .sendMessage({
          action: "createNotification",
          title: "Miro Extension",
          notificationMessage: message,
        })
        .catch(() => {
          window.alert(message);
        });
    }
  }

  // AI helper functions
  async function handleCopyExercise() {
    const exerciseContent = getExerciseContent();
    if (!exerciseContent) {
      window.alert('Error: No exercise content found with class="exercise"');
      return;
    }

    const success = await copyToClipboard(exerciseContent);
    if (success) {
      window.alert("Exercise content copied to clipboard as Markdown!");
    } else {
      window.alert("Failed to copy exercise content to clipboard");
    }
  }

  async function handleAskAI(serviceName: string, baseUrl: string) {
    const exerciseContent = getExerciseContent();
    if (!exerciseContent) {
      logger.error(`No exercise elements found for ${serviceName}`);
      return;
    }

    const answerFormat = `Please analyze this exercise and provide a detailed answer.

Format your response as follows:
1. **Problem Analysis**: Briefly explain what the question is asking
2. **Solution**: Step-by-step solution or explanation
3. **Answer**: Final answer or conclusion
4. **Additional Notes**: Any relevant tips or concepts to remember

`;

    const fullQuestion = answerFormat + exerciseContent;
    const encodedQuestion = encodeURIComponent(fullQuestion);
    const serviceUrl = `${baseUrl}${encodedQuestion}`;

    try {
      window.open(serviceUrl, "_blank");
      logger.info(`Opened ${serviceName} with exercise question`);
    } catch (error) {
      logger.error(`Failed to open ${serviceName}: ${error}`);
    }
  }

  async function handleCopyAIPrompt() {
    const exerciseContent = getExerciseContent();
    if (!exerciseContent) {
      window.alert('Error: No exercise content found with class="exercise"');
      return;
    }

    const answerFormat = `Please analyze this exercise and provide a detailed answer.

Format your response as follows:
1. **Problem Analysis**: Briefly explain what the question is asking
2. **Solution**: Step-by-step solution or explanation
3. **Answer**: Final answer or conclusion
4. **Additional Notes**: Any relevant tips or concepts to remember

`;

    const fullPrompt = answerFormat + exerciseContent;
    const success = await copyToClipboard(fullPrompt);

    if (success) {
      window.alert("AI prompt and exercise content copied to clipboard!");
    } else {
      window.alert("Failed to copy AI prompt to clipboard");
    }
  }

  // UI handlers
  const toggleExtension = () => {
    const newState = !extensionEnabled;
    setExtensionEnabled(newState);
    isEnabled = newState;
    browser.storage.local.set({ enabled: newState });
  };

  const toggleAutoPlay = () => {
    const newState = !autoPlay;
    setAutoPlay(newState);
    autoPlayEnabled = newState;
    browser.storage.local.set({ autoPlayEnabled: newState });
  };

  const toggleBackgroundPlay = () => {
    const newState = !backgroundPlay;
    setBackgroundPlay(newState);
    backgroundAutoPlay = newState;
    browser.storage.local.set({ backgroundAutoPlay: newState });
  };

  const openSettings = () => {
    // browser.runtime.openOptionsPage() is not available in content script
    // Send message to background script to open options page
    browser.runtime.sendMessage({ action: "openOptionsPage" }).catch(() => {
      // Fallback: directly open options page in new tab
      const optionsUrl = browser.runtime.getURL("options.html");
      window.open(optionsUrl, "_blank");
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        ...(buttonPosition === "right-top" && { top: "20px", right: "20px" }),
        ...(buttonPosition === "right-bottom" && {
          bottom: "20px",
          right: "20px",
        }),
        ...(buttonPosition === "left-top" && { top: "20px", left: "20px" }),
        ...(buttonPosition === "left-bottom" && {
          bottom: "20px",
          left: "20px",
        }),
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        zIndex: 99999,
      }}
    >
      <Button
        onClick={toggleExtension}
        variant={extensionEnabled ? "default" : "danger"}
        minimize={minimalMode}
        icon={extensionEnabled ? <Play size={18} /> : <Square size={18} />}
      >
        {extensionEnabled ? "Enabled" : "Disabled"}
      </Button>

      {extensionEnabled && (
        <>
          <Button
            onClick={toggleAutoPlay}
            variant={autoPlay ? "default" : "secondary"}
            minimize={minimalMode}
            icon={<Play size={18} />}
          >
            Auto Play: {autoPlay ? "ON" : "OFF"}
          </Button>

          <Button
            onClick={toggleBackgroundPlay}
            variant={backgroundPlay ? "default" : "secondary"}
            minimize={minimalMode}
            icon={<Play size={18} />}
          >
            Background: {backgroundPlay ? "ON" : "OFF"}
          </Button>
        </>
      )}

      <Button
        onClick={openSettings}
        variant="secondary"
        minimize={minimalMode}
        icon={<Settings size={18} />}
      >
        Settings
      </Button>
    </div>
  );
};

// Create container for our button
const container = document.createElement("div");
container.id = "miro-extension";
document.body.appendChild(container);

// Render the button container
const root = createRoot(container);
root.render(<ButtonContainer />);
