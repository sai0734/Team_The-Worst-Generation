export interface ParsedHealthCheckResult {
  status: string;
  verdict: string;
  action: string;
}

const LABEL_PATTERN =
  /(상태|판정|대처법)\s*:\s*([\s\S]*?)(?=(?:상태|판정|대처법)\s*:|$)/g;

export const parseHealthCheckResult = (
  raw: string,
): ParsedHealthCheckResult => {
  const sections: Record<string, string> = {};

  let match: RegExpExecArray | null;
  while ((match = LABEL_PATTERN.exec(raw)) !== null) {
    const [, label, content] = match;
    sections[label] = content.replace(/\s+/g, " ").trim();
  }

  return {
    status: sections["상태"] ?? "",
    verdict: sections["판정"] ?? "",
    action: sections["대처법"] ?? raw.replace(/\s+/g, " ").trim(),
  };
};
