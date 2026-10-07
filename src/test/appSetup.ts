// ErinnerMich's own test setup, listed after web-base's owned setup.ts in
// vitest.config.ts: every test starts with empty stores and no settings.
import { afterEach } from "vitest";
import { clearAll } from "../lib/db";

afterEach(async () => {
  await clearAll();
  window.localStorage.clear();
});
