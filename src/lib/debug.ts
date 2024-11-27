import { DebugLog } from "@/types/nodes";

export function createDebugLog(
  type: DebugLog["type"],
  label: string,
  value: any
): DebugLog {
  return {
    type,
    label,
    value,
    timestamp: Date.now(),
  };
}
