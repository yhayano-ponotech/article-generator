import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Draft, Session, Reference, ExportJob } from "@/types/domain";

/**
 * IndexedDB schema for article generator
 * Based on docs/design.md section 6
 */

interface ArticleDB extends DBSchema {
  drafts: {
    key: string;
    value: Draft;
    indexes: { "by-updated": Date };
  };
  sessions: {
    key: string;
    value: Session;
    indexes: { "by-draft": string };
  };
  references: {
    key: string;
    value: Reference;
    indexes: { "by-draft": string };
  };
  exports: {
    key: string;
    value: ExportJob;
    indexes: { "by-draft": string };
  };
}

const DB_NAME = "article-generator-db";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<ArticleDB> | null = null;

/**
 * Initialize and get database instance
 */
export async function getDB(): Promise<IDBPDatabase<ArticleDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ArticleDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Drafts store
      if (!db.objectStoreNames.contains("drafts")) {
        const draftStore = db.createObjectStore("drafts", { keyPath: "id" });
        draftStore.createIndex("by-updated", "updatedAt");
      }

      // Sessions store
      if (!db.objectStoreNames.contains("sessions")) {
        const sessionStore = db.createObjectStore("sessions", { keyPath: "id" });
        sessionStore.createIndex("by-draft", "draftId");
      }

      // References store
      if (!db.objectStoreNames.contains("references")) {
        const refStore = db.createObjectStore("references", { keyPath: "id" });
        refStore.createIndex("by-draft", "draftId");
      }

      // Exports store
      if (!db.objectStoreNames.contains("exports")) {
        const exportStore = db.createObjectStore("exports", { keyPath: "id" });
        exportStore.createIndex("by-draft", "draftId");
      }
    },
  });

  return dbInstance;
}

/**
 * Draft operations
 */
export async function saveDraft(draft: Draft): Promise<void> {
  const db = await getDB();
  await db.put("drafts", draft);
}

export async function getDraft(id: string): Promise<Draft | undefined> {
  const db = await getDB();
  return await db.get("drafts", id);
}

export async function getAllDrafts(): Promise<Draft[]> {
  const db = await getDB();
  return await db.getAllFromIndex("drafts", "by-updated");
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("drafts", id);
}

/**
 * Session operations
 */
export async function saveSession(session: Session): Promise<void> {
  const db = await getDB();
  await db.put("sessions", session);
}

export async function getSession(id: string): Promise<Session | undefined> {
  const db = await getDB();
  return await db.get("sessions", id);
}

export async function getSessionsByDraft(draftId: string): Promise<Session[]> {
  const db = await getDB();
  return await db.getAllFromIndex("sessions", "by-draft", draftId);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("sessions", id);
}

/**
 * Reference operations
 */
export async function saveReference(ref: Reference): Promise<void> {
  const db = await getDB();
  await db.put("references", ref);
}

export async function getReference(id: string): Promise<Reference | undefined> {
  const db = await getDB();
  return await db.get("references", id);
}

export async function getReferencesByDraft(draftId: string): Promise<Reference[]> {
  const db = await getDB();
  return await db.getAllFromIndex("references", "by-draft", draftId);
}

export async function deleteReference(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("references", id);
}

/**
 * Export operations
 */
export async function saveExport(exportJob: ExportJob): Promise<void> {
  const db = await getDB();
  await db.put("exports", exportJob);
}

export async function getExport(id: string): Promise<ExportJob | undefined> {
  const db = await getDB();
  return await db.get("exports", id);
}

export async function getExportsByDraft(draftId: string): Promise<ExportJob[]> {
  const db = await getDB();
  return await db.getAllFromIndex("exports", "by-draft", draftId);
}

export async function deleteExport(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("exports", id);
}

/**
 * Utility: Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
