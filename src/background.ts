import logger from "./logger";
import browser from "webextension-polyfill";

// Handle messages from content script
browser.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message && typeof message === "object" && "action" in message) {
    if (
      message.action === "createNotification" &&
      "title" in message &&
      "notificationMessage" in message
    ) {
      const title =
        typeof message.title === "string" ? message.title : "Miro Extension";
      const notificationMessage =
        typeof message.notificationMessage === "string"
          ? message.notificationMessage
          : "";

      // Since notification permission is declared in manifest.json, we can create notifications directly
      createNotificationNow();

      function createNotificationNow() {
        const notificationId = `miro-${Date.now()}`;
        browser.notifications
          .create(notificationId, {
            type: "basic",
            iconUrl: "src/assets/icon128.png",
            title: title,
            message: notificationMessage,
          })
          .then(() => {
            logger.info(
              `Notification created with ID: ${notificationId}, message: ${notificationMessage}`
            );
            sendResponse({ success: true, notificationId });
          })
          .catch((error) => {
            logger.error(`Failed to create notification: ${error}`);
            sendResponse({ success: false, error: error.message });
          });
      }
    } else if (message.action === "openOptionsPage") {
      // Handle opening options page from content script
      browser.runtime
        .openOptionsPage()
        .then(() => {
          logger.info("Options page opened from content script");
          sendResponse({ success: true });
        })
        .catch((error) => {
          logger.error(`Failed to open options page: ${error}`);
          sendResponse({ success: false, error: error.message });
        });
    } else {
      // Send response immediately for unhandled messages
      sendResponse({ success: false, error: "Unknown action" });
    }
  } else {
    // Send response immediately for invalid messages
    sendResponse({ success: false, error: "Invalid message format" });
  }

  // Always return true to indicate we will send a response
  return true;
});

browser.runtime.onInstalled.addListener(() => {
  void browser.storage.local.get("enabled").then(() => {
    // Create the parent menu item
    browser.contextMenus.create({
      id: "miro",
      title: "Miro",
      contexts: ["all"],
    });

    // Create the toggle submenu items under Miro
    browser.contextMenus.create({
      id: "toggle",
      parentId: "miro",
      title: "Toggle enabled",
      contexts: ["all"],
    });

    browser.contextMenus.create({
      id: "copyExercise",
      parentId: "miro",
      title: "Copy exercise to clipboard",
      contexts: ["all"],
    });

    browser.contextMenus.create({
      id: "askAI",
      parentId: "miro",
      title: "Ask AI",
      contexts: ["all"],
    });

    // AI service submenu items
    browser.contextMenus.create({
      id: "askChatGPT",
      parentId: "askAI",
      title: "ChatGPT",
      contexts: ["all"],
    });

    browser.contextMenus.create({
      id: "askClaude",
      parentId: "askAI",
      title: "Claude",
      contexts: ["all"],
    });

    browser.contextMenus.create({
      id: "askGenspark",
      parentId: "askAI",
      title: "Genspark",
      contexts: ["all"],
    });

    browser.contextMenus.create({
      id: "askFelo",
      parentId: "askAI",
      title: "Felo",
      contexts: ["all"],
    });

    browser.contextMenus.create({
      id: "askPerplexity",
      parentId: "askAI",
      title: "Perplexity",
      contexts: ["all"],
    });

    browser.contextMenus.create({
      id: "copyAIPrompt",
      parentId: "askAI",
      title: "Copy prompt to clipboard",
      contexts: ["all"],
    });

    browser.contextMenus.create({
      id: "returnToChapter",
      parentId: "miro",
      title: "Return to chapter on completion",
      contexts: ["all"],
    });

    browser.contextMenus.create({
      id: "hideUI",
      parentId: "miro",
      title: "Hide UI buttons",
      contexts: ["all"],
    });

    browser.contextMenus.create({
      id: "openRepository",
      parentId: "miro",
      title: "Open repository",
      contexts: ["all"],
    });
  });
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  try {
    if (info.menuItemId === "toggle") {
      void browser.storage.local.get("enabled").then((data) => {
        const enabled = data.enabled !== true; // Toggle the enabled state
        void browser.storage.local.set({ enabled });
        logger.info(`Extension is now ${enabled ? "enabled" : "disabled"}`);
      });
    } else if (info.menuItemId === "copyExercise") {
      // Send message to content script to copy exercise
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: "copyExercise" })
          .catch((error) => {
            logger.error(`Failed to send copyExercise message: ${error}`);
          });
      }
    } else if (info.menuItemId === "askChatGPT") {
      // Send message to content script to ask ChatGPT about exercise
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: "askChatGPT" })
          .catch((error) => {
            logger.error(`Failed to send askChatGPT message: ${error}`);
          });
      }
    } else if (info.menuItemId === "askClaude") {
      // Send message to content script to ask Claude about exercise
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: "askClaude" })
          .catch((error) => {
            logger.error(`Failed to send askClaude message: ${error}`);
          });
      }
    } else if (info.menuItemId === "askGenspark") {
      // Send message to content script to ask Genspark about exercise
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: "askGenspark" })
          .catch((error) => {
            logger.error(`Failed to send askGenspark message: ${error}`);
          });
      }
    } else if (info.menuItemId === "askFelo") {
      // Send message to content script to ask Felo about exercise
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: "askFelo" })
          .catch((error) => {
            logger.error(`Failed to send askFelo message: ${error}`);
          });
      }
    } else if (info.menuItemId === "askPerplexity") {
      // Send message to content script to ask Perplexity about exercise
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: "askPerplexity" })
          .catch((error) => {
            logger.error(`Failed to send askPerplexity message: ${error}`);
          });
      }
    } else if (info.menuItemId === "copyAIPrompt") {
      // Send message to content script to copy AI prompt
      if (tab?.id) {
        browser.tabs
          .sendMessage(tab.id, { action: "copyAIPrompt" })
          .catch((error) => {
            logger.error(`Failed to send copyAIPrompt message: ${error}`);
          });
      }
    } else if (info.menuItemId === "returnToChapter") {
      void browser.storage.local.get("returnToChapter").then((data) => {
        const returnToChapter = data.returnToChapter !== true; // Toggle the return to chapter state
        void browser.storage.local.set({ returnToChapter });
        logger.info(
          `Return to chapter is now ${returnToChapter ? "enabled" : "disabled"}`
        );
      });
    } else if (info.menuItemId === "hideUI") {
      void browser.storage.local.get("hideUI").then((data) => {
        const hideUI = data.hideUI !== true; // Toggle the hideUI state
        void browser.storage.local.set({ hideUI });
        logger.info(`UI buttons are now ${hideUI ? "hidden" : "visible"}`);
      });
    } else if (info.menuItemId === "openRepository") {
      // Open the repository in a new tab
      browser.tabs
        .create({
          url: "https://github.com/operationcheck/miro",
        })
        .then(() => {
          logger.info("Repository opened in new tab");
        })
        .catch((error) => {
          logger.error(`Failed to open repository: ${error}`);
        });
    }
  } catch (error) {
    logger.error(`Context menu error: ${error}`);
  }
});

// Open the options page in a new tab when the icon is clicked
browser.action.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});
