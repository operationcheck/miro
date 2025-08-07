const fs = require("node:fs");
const path = require("node:path");
const archiver = require("archiver");

(async () => {
  try {
    // Ensure dist directory exists (should be built with pnpm build first)
    if (!fs.existsSync("./dist")) {
      console.error("dist directory not found. Run 'pnpm build' first.");
      process.exit(1);
    }

    // Create firefox build directory
    fs.mkdirSync("./dist/firefox", { recursive: true });

    // Copy manifest.json to firefox directory and modify it
    const manifestPath = "./dist/manifest.json";
    const firefoxManifestPath = "./dist/firefox/manifest.json";
    
    const data = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(data);
    
    // Add Firefox-specific settings
    manifest.browser_specific_settings = {
      gecko: {
        id: "operationcheck@proton.me",
      },
    };
    
    // Find the background script file dynamically
    const assetsDir = "./dist/assets";
    const backgroundFile = fs.readdirSync(assetsDir).find(file => file.startsWith("background-"));
    
    // Modify background for Firefox (Manifest V2 style)
    manifest.background = {
      scripts: [`assets/${backgroundFile}`],
      persistent: false,
    };
    
    // Remove run_at from content_scripts for Firefox compatibility
    if (manifest.content_scripts && manifest.content_scripts[0]) {
      const { run_at, ...contentScript } = manifest.content_scripts[0];
      manifest.content_scripts[0] = contentScript;
    }
    
    fs.writeFileSync(firefoxManifestPath, JSON.stringify(manifest, null, 2), "utf8");

    // Copy all other files from dist to firefox directory
    const distFiles = fs.readdirSync("./dist");
    for (const file of distFiles) {
      if (file !== "firefox" && file !== "manifest.json") {
        const srcPath = path.join("./dist", file);
        const destPath = path.join("./dist/firefox", file);
        
        if (fs.statSync(srcPath).isDirectory()) {
          // Copy directory recursively
          copyDirectoryRecursively(srcPath, destPath);
        } else {
          // Copy file
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    // Create firefox.zip
    console.log("Creating firefox.zip...");
    const output = fs.createWriteStream("./dist/firefox.zip");
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", () => {
      console.log(`Firefox extension created: ${archive.pointer()} total bytes`);
      
      // Clean up firefox directory after zip creation
      fs.rmSync("./dist/firefox", { recursive: true, force: true });
      console.log("Firefox build completed successfully!");
    });

    archive.on("warning", (err) => {
      if (err.code === "ENOENT") {
        console.warn("Warning:", err);
      } else {
        throw err;
      }
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);

    // Add all files from firefox directory to archive
    archive.directory("./dist/firefox/", false);

    await archive.finalize();

  } catch (err) {
    console.error("Firefox build failed:", err);
    process.exit(1);
  }
})();

// Helper function to copy directories recursively
function copyDirectoryRecursively(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectoryRecursively(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}