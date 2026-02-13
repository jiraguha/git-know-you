import { Command } from "@cliffy/command";
import { listProfiles } from "../storage/json-store.ts";
import { displayProfileList } from "../utils/display.ts";

export const listCommand = new Command()
  .name("list")
  .description("List all saved profiles")
  .action(async () => {
    const profiles = await listProfiles();
    displayProfileList(profiles);
  });
