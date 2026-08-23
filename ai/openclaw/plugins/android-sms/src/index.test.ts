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
    const fetchMock = async () =>
      new Response(
        JSON.stringify({
          missionId: "msg_repeat_guard_test",
          provider: "ANDROID_SMS",
          status: "SUCCESS",
          accepted: true,
          to: "01012345678",
        }),
        { status: 200 },
      );
    const options = {
      fetch: fetchMock as typeof fetch,
      env: {
        ANDROID_SMS_BRIDGE_URL: "http://127.0.0.1:8787",
        ANDROID_SMS_BRIDGE_KEY: "bridge-secret",
      },
    };
    const mission = {
      metadata: {
        schemaVersion: 1,
        missionId: "msg_repeat_guard_test",
        source: "POSTMAN",
        requestedBy: "test",
        requestedAt: "2026-08-21T02:00:00+09:00",
      },
      to: "01012345678",
      content: "send test",
    };
    const tool = createAndroidSmsTool(options);

    const first = await tool.execute("call-1", { mission });
    const repeated = await tool.execute("call-2", { mission });
    const retryRun = await createAndroidSmsTool(options).execute(
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

  it("rejects send without a bridge", async () => {
    const tool = createAndroidSmsTool({ env: {} });

    await expect(
      tool.execute("call-live-missing", {
        mission: {
          metadata: {
            schemaVersion: 1,
            missionId: "msg_live_missing",
            source: "POSTMAN",
            requestedBy: "test",
            requestedAt: "2026-08-21T02:00:00+09:00",
          },
          to: "01012345678",
          content: "live test",
        },
      }),
    ).rejects.toThrow("ANDROID_SMS_BRIDGE_NOT_CONFIGURED");
  });

  it("posts a mission to the sms bridge once", async () => {
    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://192.168.0.12:8787/sms");
      expect(init?.method).toBe("POST");
      expect(init?.headers).toMatchObject({
        "content-type": "application/json",
        "x-android-sms-key": "bridge-secret",
      });
      expect(JSON.parse(String(init?.body))).toEqual({
        missionId: "msg_live_bridge",
        to: "01012345678",
        content: "live test",
      });

      return new Response(
        JSON.stringify({
          missionId: "msg_live_bridge",
          provider: "ANDROID_SMS",
          status: "SUCCESS",
          accepted: true,
          to: "01012345678",
        }),
        { status: 200 },
      );
    };

    const result = await createAndroidSmsTool({
      fetch: fetchMock as typeof fetch,
      env: {
        ANDROID_SMS_BRIDGE_URL: "http://192.168.0.12:8787",
        ANDROID_SMS_BRIDGE_KEY: "bridge-secret",
      },
    }).execute("call-live", {
      mission: {
        metadata: {
          schemaVersion: 1,
          missionId: "msg_live_bridge",
          source: "HOSPITAL_RESERVATION",
          requestedBy: "test",
          requestedAt: "2026-08-21T02:00:00+09:00",
        },
        to: "01012345678",
        content: "live test",
      },
    });

    expect(result.details).toEqual({
      missionId: "msg_live_bridge",
      provider: "ANDROID_SMS",
      status: "SUCCESS",
      accepted: true,
      to: "01012345678",
    });
  });
});
