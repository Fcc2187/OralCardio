import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const testUrl = process.env.SUPABASE_TEST_URL;
const testAnonKey = process.env.SUPABASE_TEST_ANON_KEY;
const testEmail = process.env.SUPABASE_TEST_EMAIL;
const describeIntegration = testUrl && testAnonKey && testEmail ? describe : describe.skip;

describeIntegration("Supabase password policy", () => {
  it.each([
    ["a password shorter than 8 characters", "Aa!1234", "length"],
    ["a password without an uppercase letter", "lowercase!2026", "characters"],
    ["a password without a lowercase letter", "UPPERCASE!2026", "characters"],
    ["a password without a digit", "MinhaSenha!", "characters"],
    ["a password without a special character", "Uppercase2026", "characters"],
  ])("rejects %s through the Auth API", async (_description, password, reason) => {
    const supabase = createClient(testUrl!, testAnonKey!, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });

    const { error } = await supabase.auth.signUp({
      email: testEmail!,
      password,
    });

    expect(error).toMatchObject({ code: "weak_password", reasons: expect.arrayContaining([reason]) });
  });
});
