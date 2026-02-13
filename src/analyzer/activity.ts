import type { ActivityLevel, ProjectCounts } from "../schema/profile.ts";

export function computeActivityLevel(totals: ProjectCounts): ActivityLevel {
  const totalActions =
    totals.commits +
    totals.pull_requests +
    totals.issues_created +
    totals.reviews +
    totals.discussions;

  if (totalActions === 0) {
    return "inactive";
  }

  if (totalActions < 50) {
    return "occasional";
  }

  if (totalActions <= 500) {
    return "active";
  }

  return "prolific";
}

export function getActivityDescription(level: ActivityLevel): string {
  switch (level) {
    case "inactive":
      return "No activity";
    case "occasional":
      return "Occasional contributor";
    case "active":
      return "Active contributor";
    case "prolific":
      return "Prolific contributor";
  }
}
