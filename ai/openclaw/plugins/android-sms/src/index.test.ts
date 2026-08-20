import { describe, expect, it } from "vitest";
import entry from "./index.js";
import { getToolPluginMetadata } from "openclaw/plugin-sdk/tool-plugin";

describe("android-sms", () => {
  it("declares android sms tool metadata", () => {
    expect(
      getToolPluginMetadata(entry)?.tools.map((tool) => tool.name),
    ).toEqual(["android_sms_send"]);
  });
});
