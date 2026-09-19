import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { Db, ObjectId } from "mongodb";

export interface RevalidationSource {
  url: string;
  title: string;
  publisher: string;
  publishedAt?: string;
  sourceType?: string;
  _id?: string;
}

export interface RevalidationLocation {
  state: string;
  lga?: string;
  town?: string;
}

export interface RevalidationCasualties {
  killed?: number | null;
  injured?: number | null;
  kidnapped?: number | null;
  displaced?: number | null;
}

export interface RevalidationCandidate {
  originalId?: string;
  title: string;
  date: Date;
  location: RevalidationLocation;
  group?: string;
  casualties: RevalidationCasualties;
  sources: RevalidationSource[];
  description: string;
  tags?: string[];
  status: "confirmed" | "unconfirmed" | "developing";
}

export function generateIncidentHash(title: string, dateStr: string, location: RevalidationLocation): string {
  const locStr = `${location.state}-${location.lga || ""}-${location.town || ""}`;
  const raw = `${title.toLowerCase().trim()}_${dateStr}_${locStr.toLowerCase().trim()}`;
  return createHash("sha256").update(raw).digest("hex");
}

export async function createDatabaseSnapshot(db: Db, snapshotPath: string): Promise<number> {
  const dir = path.dirname(snapshotPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const activeDocs = await db.collection("attacks").find({ _deleted: { $ne: true } }).toArray();
  fs.writeFileSync(snapshotPath, JSON.stringify(activeDocs, null, 2));
  return activeDocs.length;
}

export interface ValidationReport {
  totalChecked: number;
  invalidDates: number;
  invalidCasualties: number;
  duplicateHashes: number;
  emptyTitles: number;
  errors: string[];
}

export async function validateAttacksIntegrity(db: Db): Promise<ValidationReport> {
  const activeDocs = await db.collection("attacks").find({ _deleted: { $ne: true } }).toArray();
  const report: ValidationReport = {
    totalChecked: activeDocs.length,
    invalidDates: 0,
    invalidCasualties: 0,
    duplicateHashes: 0,
    emptyTitles: 0,
    errors: []
  };

  const seenHashes = new Set<string>();

  for (const doc of activeDocs) {
    if (!doc.date || !(doc.date instanceof Date) || isNaN(doc.date.getTime())) {
      report.invalidDates++;
      report.errors.push(`Doc ${doc._id}: Invalid date`);
    }

    if (!doc.title || typeof doc.title !== "string" || doc.title.trim().length === 0) {
      report.emptyTitles++;
      report.errors.push(`Doc ${doc._id}: Empty title`);
    }

    const c = doc.casualties || {};
    for (const key of ["killed", "injured", "kidnapped", "displaced"]) {
      if (c[key] !== null && c[key] !== undefined) {
        if (typeof c[key] !== "number" || c[key] < 0) {
          report.invalidCasualties++;
          report.errors.push(`Doc ${doc._id}: Invalid casualty ${key}: ${c[key]}`);
        }
      }
    }

    if (doc.hash) {
      if (seenHashes.has(doc.hash)) {
        report.duplicateHashes++;
        report.errors.push(`Doc ${doc._id}: Duplicate hash ${doc.hash}`);
      }
      seenHashes.add(doc.hash);
    }
  }

  return report;
}
