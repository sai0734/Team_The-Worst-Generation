import { Type } from "typebox";
import type {
  AgentTool,
  AgentToolResult,
} from "openclaw/plugin-sdk/agent-core";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

type MessageMissionResult = {
  missionId: string;
  provider: "ANDROID_SMS";
  status: "SUCCESS";
  accepted: true;
  to: string;
};

type AndroidSmsToolOptions = {
  fetch?: typeof fetch;
  env?: NodeJS.Dict<string>;
};

const resultByMissionId = new Map<string, MessageMissionResult>();

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const missionMetadataSchema = Type.Object(
  {
    schemaVersion: Type.Integer({ minimum: 1 }),
    missionId: Type.String({ minLength: 1, maxLength: 128 }),
    source: Type.String({ minLength: 1, maxLength: 64 }),
    requestedBy: Type.String({ minLength: 1, maxLength: 255 }),
    requestedAt: Type.String({ format: "date-time" }),
  },
  { additionalProperties: false },
);

const messageMissionSchema = Type.Object(
  {
    metadata: missionMetadataSchema,
    to: Type.String({
      pattern: "^01[016789][0-9]{7,8}$",
      description: "대한민국 휴대전화 번호",
    }),
    content: Type.String({
      minLength: 1,
      maxLength: 2000,
    }),
  },
  { additionalProperties: false },
);

const androidSmsParameters = Type.Object(
  {
    mission: messageMissionSchema,
  },
  { additionalProperties: false },
);

function missionResult(
  result: MessageMissionResult,
  terminate = false,
): AgentToolResult<MessageMissionResult> {
  const resultJson = JSON.stringify(result, null, 2);

  return {
    content: [
      {
        type: "text",
        text: [
          "ANDROID_SMS_SEND_COMPLETED",
          "The mission is complete. Never call android_sms_send again in this run.",
          "Return only the JSON between FINAL_JSON_START and FINAL_JSON_END as the final assistant response.",
          "FINAL_JSON_START",
          resultJson,
          "FINAL_JSON_END",
        ].join("\n"),
      },
    ],
    details: result,
    ...(terminate ? { terminate: true } : {}),
  };
}

function bridgeConfig(env: NodeJS.Dict<string>) {
  const url = env.ANDROID_SMS_BRIDGE_URL?.trim().replace(/\/$/, "");
  const key = env.ANDROID_SMS_BRIDGE_KEY?.trim();
  if (!url || !key) {
    throw new Error("ANDROID_SMS_BRIDGE_NOT_CONFIGURED");
  }
  return { url, key };
}

async function sendThroughBridge(
  mission: {
    metadata: { missionId: string };
    to: string;
    content: string;
  },
  options: Required<Pick<AndroidSmsToolOptions, "fetch" | "env">>,
  signal?: AbortSignal,
): Promise<MessageMissionResult> {
  const { url, key } = bridgeConfig(options.env);
  const response = await options.fetch(`${url}/sms`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-android-sms-key": key,
    },
    body: JSON.stringify({
      missionId: mission.metadata.missionId,
      to: mission.to,
      content: mission.content,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`ANDROID_SMS_BRIDGE_FAILED:${response.status}`);
  }

  const payload = (await response.json()) as Partial<MessageMissionResult>;
  if (
    payload.provider !== "ANDROID_SMS" ||
    payload.status !== "SUCCESS" ||
    payload.accepted !== true ||
    payload.to !== mission.to
  ) {
    throw new Error("ANDROID_SMS_BRIDGE_INVALID_RESPONSE");
  }

  return {
    missionId: mission.metadata.missionId,
    provider: "ANDROID_SMS",
    status: payload.status,
    accepted: true,
    to: mission.to,
  };
}

export function createAndroidSmsTool(
  options: AndroidSmsToolOptions = {},
): AgentTool<typeof androidSmsParameters, MessageMissionResult> {
  const returnedMissionIds = new Set<string>();
  const request = options.fetch ?? fetch;
  const env = options.env ?? process.env;

  console.info(
    "[android-sms] TOOL_CONFIGURED mode=LIVE_ONLY " +
      `bridgeUrlConfigured=${Boolean(env.ANDROID_SMS_BRIDGE_URL?.trim())} ` +
      `bridgeKeyConfigured=${Boolean(env.ANDROID_SMS_BRIDGE_KEY?.trim())}`,
  );

  return {
    name: "android_sms_send",
    label: "Android SMS Send",
    description:
      "검증된 메시지 미션을 안드로이드 SMS 브리지로 정확히 한 번 전달합니다. 이 대화에 android_sms_send 도구 결과가 이미 있으면 다시 호출하지 말고, 그 결과 JSON을 최종 응답으로 그대로 출력해야 합니다.",
    parameters: androidSmsParameters,
    async execute(_toolCallId, { mission }, signal) {
      signal?.throwIfAborted();

      const missionId = mission.metadata.missionId;
      const repeatedInCurrentRun = returnedMissionIds.has(missionId);
      const previousResult = resultByMissionId.get(missionId);

      if (previousResult) {
        console.info(
          `[android-sms] CACHE_HIT missionId=${missionId} ` +
            `repeatedInCurrentRun=${repeatedInCurrentRun}`,
        );
        returnedMissionIds.add(missionId);
        return missionResult(previousResult, repeatedInCurrentRun);
      }

      const startedAt = Date.now();
      console.info(
        `[android-sms] SEND_START missionId=${missionId} mode=LIVE_ONLY`,
      );

      try {
        const result = await sendThroughBridge(
          mission,
          { fetch: request, env },
          signal,
        );

        resultByMissionId.set(missionId, result);
        returnedMissionIds.add(missionId);
        console.info(
          `[android-sms] SEND_SUCCESS missionId=${missionId} ` +
            `status=${result.status} elapsedMs=${Date.now() - startedAt}`,
        );
        return missionResult(result);
      } catch (error) {
        console.error(
          `[android-sms] SEND_FAILED missionId=${missionId} ` +
            `reason=${errorMessage(error)} elapsedMs=${Date.now() - startedAt}`,
        );
        throw error;
      }
    },
  };
}

export default defineToolPlugin({
  id: "android-sms",
  name: "Android SMS",
  description: "안드로이드 SMS 브리지를 통해 문자를 발송합니다.",

  tools: (tool) => [
    tool({
      name: "android_sms_send",
      label: "Android SMS Send",
      description:
        "검증된 메시지 미션을 안드로이드 SMS 브리지로 정확히 한 번 전달합니다. 도구 결과를 받은 뒤에는 다시 호출하지 말고 결과 JSON만 최종 응답으로 출력합니다.",

      parameters: androidSmsParameters,

      factory() {
        return createAndroidSmsTool();
      },
    }),
  ],
});
