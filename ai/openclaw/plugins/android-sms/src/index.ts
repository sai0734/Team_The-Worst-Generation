import { Type } from "typebox";
import type {
  AgentTool,
  AgentToolResult,
} from "openclaw/plugin-sdk/agent-core";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

type MessageMissionResult = {
  missionId: string;
  provider: "ANDROID_SMS";
  status: "DRY_RUN";
  accepted: true;
  to: string;
};

const resultByMissionId = new Map<string, MessageMissionResult>();

const missionMetadataSchema = Type.Object(
  {
    schemaVersion: Type.Integer({ minimum: 1 }),
    missionId: Type.String({ minLength: 1, maxLength: 128 }),
    source: Type.String({ minLength: 1, maxLength: 64 }),
    dryRun: Type.Boolean(),
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

export function createAndroidSmsTool(): AgentTool<
  typeof androidSmsParameters,
  MessageMissionResult
> {
  const returnedMissionIds = new Set<string>();

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
        returnedMissionIds.add(missionId);
        return missionResult(previousResult, repeatedInCurrentRun);
      }

      if (!mission.metadata.dryRun) {
        throw new Error("ANDROID_SMS_BRIDGE_NOT_CONFIGURED");
      }

      const result: MessageMissionResult = {
        missionId,
        provider: "ANDROID_SMS",
        status: "DRY_RUN",
        accepted: true,
        to: mission.to,
      };

      resultByMissionId.set(missionId, result);
      returnedMissionIds.add(missionId);
      return missionResult(result);
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
