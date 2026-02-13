#!/usr/bin/env bun
import { Command } from "@cliffy/command";
import { buildCommand } from "./commands/build.ts";
import { showCommand } from "./commands/show.ts";
import { listCommand } from "./commands/list.ts";
import { exportCommand } from "./commands/export.ts";
import { refreshCommand } from "./commands/refresh.ts";

const program = new Command()
  .name("git-know-you")
  .version("1.0.0")
  .description(
    "Showcase your open source journey — turn any GitHub username into a contribution profile"
  )
  .command("build", buildCommand)
  .command("show", showCommand)
  .command("list", listCommand)
  .command("export", exportCommand)
  .command("refresh", refreshCommand);

await program.parse(process.argv.slice(2));
