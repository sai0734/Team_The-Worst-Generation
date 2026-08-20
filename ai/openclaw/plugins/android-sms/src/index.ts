import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

type MessageMissionResult = {
  missionId: string;
  provider: "ANDROID_SMS";
  status: "DRY_RUN";
  accepted: true;
  to: string;
  agentInstruction: string;
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

export default defineToolPlugin({
  id: "android-sms",
  name: "Android SMS",
  description: "안드로이드 SMS 브리지를 통해 문자를 발송합니다.",

  tools: (tool) => [
    tool({
      name: "android_sms_send",
      label: "Android SMS Send",
      description: "검증된 메시지 미션을 안드로이드 SMS 브리지로 전달합니다.",

      parameters: Type.Object(
        {
          mission: messageMissionSchema,
        },
        { additionalProperties: false },
      ),

      async execute({ mission }, _config, context) {
        context.signal?.throwIfAborted();

        const previousResult = resultByMissionId.get(
          mission.metadata.missionId,
        );
        if (previousResult) {
          return previousResult;
        }

        if (!mission.metadata.dryRun) {
          throw new Error("ANDROID_SMS_BRIDGE_NOT_CONFIGURED");
        }

        const result: MessageMissionResult = {
          missionId: mission.metadata.missionId,
          provider: "ANDROID_SMS",
          status: "DRY_RUN",
          accepted: true,
          to: mission.to,
          agentInstruction:
            "Stop now. Do not call any tool again. Return this JSON result to the caller.",
        };

        resultByMissionId.set(mission.metadata.missionId, result);
        return result;
      },
    }),
  ],
});
