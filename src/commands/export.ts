import { Command } from "@cliffy/command";
import { loadProfile } from "../storage/json-store.ts";
import { exportToMarkdown, printError, printSuccess } from "../utils/display.ts";

export const exportCommand = new Command()
  .name("export")
  .description("Export a profile to JSON or Markdown")
  .arguments("<username:string>")
  .option("-f, --format <format:string>", "Output format (json or md)", {
    default: "json",
  })
  .option("-o, --output <path:string>", "Output file path")
  .action(async (options, username: string) => {
    const profile = await loadProfile(username);

    if (!profile) {
      printError(`No saved profile found for '${username}'`);
      console.log();
      console.log(`Run \`git-know-you build ${username}\` to create a profile.`);
      process.exit(1);
    }

    const format = options.format as "json" | "md";

    if (format !== "json" && format !== "md") {
      printError(`Invalid format '${options.format}'. Use 'json' or 'md'.`);
      process.exit(1);
    }

    let content: string;
    let defaultExt: string;

    if (format === "md") {
      content = exportToMarkdown(profile);
      defaultExt = "md";
    } else {
      content = JSON.stringify(profile, null, 2);
      defaultExt = "json";
    }

    const outputPath = options.output || `./profiles/${username}.${defaultExt}`;

    if (options.output) {
      await Bun.write(outputPath, content);
      printSuccess(`Profile exported to ${outputPath}`);
    } else {
      // If no output specified, print to stdout
      console.log(content);
    }
  });
