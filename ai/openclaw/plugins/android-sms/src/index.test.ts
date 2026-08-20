import { describe, expect, it } from "vitest";
import entry, { createAndroidSmsTool } from "./index.js";
import { getToolPluginMetadata } from "openclaw/plugin-sdk/tool-plugin";

describe("android-sms", () => {
  it("declares android sms tool metadata", () => {
    expect(
      getToolPluginMetadata(entry)?.tools.map((tool) => tool.name),
    ).toEqual(["android_sms_send"]);
  });

  it("returns normally once and terminates a repeated call in one run", async () => {
    const mission = {
      metadata: {
        schemaVersion: 1,
        missionId: "msg_repeat_guard_test",
        source: "POSTMAN",
        dryRun: true,
        requestedBy: "test",
        requestedAt: "2026-08-21T02:00:00+09:00",
      },
      to: "01012345678",
      content: "DRY_RUN test",
    };
    const tool = createAndroidSmsTool();

    const first = await tool.execute("call-1", { mission });
    const repeated = await tool.execute("call-2", { mission });
    const retryRun = await createAndroidSmsTool().execute(
      "call-3",
      { mission },
    );

    expect(first.terminate).toBeUndefined();
    expect(repeated.terminate).toBe(true);
    expect(retryRun.terminate).toBeUndefined();
    expect(first.details).toEqual(repeated.details);
    expect(first.details).toEqual(retryRun.details);
    expect(first.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("FINAL_JSON_START"),
    });
  });
});
