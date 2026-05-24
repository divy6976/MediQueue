export type QueueToken = {
  id: number;
  tokenNumber: string;
  department: string;
  priority: string;
  status: string;
  createdAt?: string | Date;
  patientName?: string | null;
};

export function normalizeQueuePayload(payload: unknown): QueueToken[] {
  if (Array.isArray(payload)) return payload as QueueToken[];
  if (payload && typeof payload === "object") {
    const obj = payload as { queue?: unknown };
    if (Array.isArray(obj.queue)) return obj.queue as QueueToken[];
  }
  return [];
}

/** 1-based position in sorted waiting queue; null if token not waiting. */
export function getWaitingPosition(queue: QueueToken[], tokenId: number): number | null {
  const index = queue.findIndex((t) => t.id === tokenId);
  if (index === -1) return null;
  return index + 1;
}
