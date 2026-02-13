import { Command } from "@cliffy/command";
import { loadProfile } from "../storage/json-store.ts";
import { displayProfile, printError } from "../utils/display.ts";

export const showCommand = new Command()
  .name("show")
  .description("Display a saved profile")
  .arguments("<username:string>")
  .action(async (_options, username: string) => {
    const profile = await loadProfile(username);

    if (!profile) {
      printError(`No saved profile found for '${username}'`);
      console.log();
      console.log(`Run \`dev-profile build ${username}\` to create a profile.`);
      process.exit(1);
    }

    displayProfile(profile);
  });
