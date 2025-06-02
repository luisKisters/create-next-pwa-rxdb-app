"use client";

import { parseRevision } from "rxdb/plugins/core";

/**
 * Simple conflict resolution strategy
 * Based on replicationRevision - higher revision wins
 * Following the pattern from RxDB Supabase example
 */
export function resolveConflict(localDoc: any, remoteDoc: any) {
  console.log("Resolving conflict between:", {
    local: localDoc.id,
    localRev: localDoc.replicationRevision,
    remote: remoteDoc.id,
    remoteRev: remoteDoc.replicationRevision,
  });

  try {
    const localRevision = parseRevision(localDoc.replicationRevision);
    const remoteRevision = parseRevision(remoteDoc.replicationRevision);

    // Higher revision number wins
    if (localRevision.height > remoteRevision.height) {
      console.log("Local document wins conflict resolution");
      return localDoc;
    } else if (remoteRevision.height > localRevision.height) {
      console.log("Remote document wins conflict resolution");
      return remoteDoc;
    } else {
      // Same revision height - use timestamp as tiebreaker
      const localTime = new Date(localDoc.updatedAt).getTime();
      const remoteTime = new Date(remoteDoc.updatedAt).getTime();

      if (localTime > remoteTime) {
        console.log("Local document wins by timestamp");
        return localDoc;
      } else {
        console.log("Remote document wins by timestamp");
        return remoteDoc;
      }
    }
  } catch (error) {
    console.error("Error resolving conflict, defaulting to remote:", error);
    return remoteDoc;
  }
}
