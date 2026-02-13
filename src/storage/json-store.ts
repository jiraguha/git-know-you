import { ProfileSchema, type Profile } from "../schema/profile.ts";

const PROFILES_DIR = "./profiles";

async function ensureProfilesDir(): Promise<void> {
  try {
    await Bun.file(`${PROFILES_DIR}/.keep`).exists();
  } catch {
    // Directory doesn't exist, create it
  }

  const dir = Bun.file(PROFILES_DIR);
  if (!(await dir.exists())) {
    await Bun.$`mkdir -p ${PROFILES_DIR}`;
  }
}

export async function saveProfile(profile: Profile): Promise<string> {
  await ensureProfilesDir();

  const filePath = `${PROFILES_DIR}/${profile.username}.json`;
  const content = JSON.stringify(profile, null, 2);

  await Bun.write(filePath, content);

  return filePath;
}

export async function loadProfile(username: string): Promise<Profile | null> {
  const filePath = `${PROFILES_DIR}/${username}.json`;
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    return null;
  }

  try {
    const content = await file.text();
    const data = JSON.parse(content);
    return ProfileSchema.parse(data);
  } catch {
    return null;
  }
}

export async function listProfiles(): Promise<string[]> {
  await ensureProfilesDir();

  const glob = new Bun.Glob("*.json");
  const files: string[] = [];

  for await (const file of glob.scan(PROFILES_DIR)) {
    const username = file.replace(".json", "");
    files.push(username);
  }

  return files.sort();
}

export async function profileExists(username: string): Promise<boolean> {
  const filePath = `${PROFILES_DIR}/${username}.json`;
  const file = Bun.file(filePath);
  return file.exists();
}

export function getProfilePath(username: string): string {
  return `${PROFILES_DIR}/${username}.json`;
}
