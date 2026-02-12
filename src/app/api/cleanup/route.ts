import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";

/**
 * One-time cleanup endpoint to remove incidents where only
 * terrorists/attackers were killed (no civilian or security force casualties).
 * 
 * Protected by cron secret. Call with:
 *   POST /api/cleanup
 *   Header: x-cron-secret: <your_secret>
 *   Body (optional): { "dryRun": true } to preview without deleting
 */
export async function POST(req: NextRequest) {
  const securityError = applySecurityChecks(req, {
    rateLimit: 5,
    rateLimitWindow: 3600_000,
    requireCronSecret: true,
  });
  if (securityError) return securityError;

  try {
    let dryRun = true; // Default to dry run for safety
    try {
      const body = await req.json();
      if (body.dryRun === false) dryRun = false;
    } catch {
      // No body or invalid JSON — keep dry run
    }

    await connectDB();

    // Fetch ALL attacks so we can do thorough text analysis
    const allAttacks = await Attack.find({})
      .select("title description casualties date location group")
      .lean();

    console.log(`[CLEANUP] Scanning ${allAttacks.length} total records...`);

    const toRemove: any[] = [];

    for (const attack of allAttacks) {
      const title = ((attack as any).title || "").toLowerCase();
      const description = ((attack as any).description || "").toLowerCase();
      const combined = `${title} ${description}`;

      // Check if this is a military/security operation against terrorists
      const isSecurityOperation = /\b(troops?|soldiers?|military|army|air\s*force|naf|joint\s*task\s*force|jtf|operation\s*hadin\s*kai|ophk|operation\s*whirl\s*stroke|operation\s*safe\s*haven|defence\s*headquarters?|dhq|cjtf)\b/i.test(combined);

      // Check if the incident describes neutralizing/killing attackers
      const describesAttackerDeaths = /\b(neutrali[sz]ed?|eliminat(ed?|ing)|kill(ed|s|ing)?|took\s*out|wiped\s*out|gunned\s*down)\b.*\b(terrorists?|insurgents?|bandits?|militants?|iswap|boko\s*haram|fighters?|combatants?|gunmen|criminals?|kidnappers?)\b/i.test(combined) ||
        /\b(terrorists?|insurgents?|bandits?|militants?|iswap|boko\s*haram|fighters?|combatants?|gunmen|criminals?|kidnappers?)\b.*\b(neutrali[sz]ed?|eliminat(ed?|ing)|kill(ed|s|ing)?|took\s*out|wiped\s*out|gunned\s*down)\b/i.test(combined);

      // Check if there are ANY mentions of civilian/non-combatant/security force harm
      // Layer 1: Adjacent pattern — "soldiers killed", "killed civilians"
      const adjacentVictimHarm = /\b(civilians?\s*(killed|died|injured|wounded|kidnapped|abducted|displaced|affected|hurt|attacked|massacred|slaughtered))\b/i.test(combined) ||
        /\b(villagers?|residents?|farmers?|herders?|travell?ers?|passengers?|worshippers?|students?|women|children|teachers?|lecturers?|professors?|doctors?|nurses?|drivers?|commuters?|pastors?|imams?|clerics?|traditional\s*rulers?|monarchs?|youths?|traders?|marketers?|soldiers?|troops?|police?|officers?|personnel?|vigilantes?|hunters?|security\s*operatives?)\s*(were\s*)?(killed|died|injured|wounded|kidnapped|abducted|displaced|attacked|missing|ambushed)\b/i.test(combined) ||
        /\b(killed|attacked|kidnapped|abducted|murdered|assassinated|ambushed)\s*(civilians?|villagers?|residents?|farmers?|herders?|travell?ers?|passengers?|worshippers?|students?|women|children|teachers?|lecturers?|professors?|doctors?|nurses?|drivers?|commuters?|pastors?|imams?|clerics?|traditional\s*rulers?|monarchs?|youths?|traders?|marketers?|soldiers?|troops?|police?|officers?|personnel?|vigilantes?|hunters?|security\s*operatives?)\b/i.test(combined);

      // Layer 2: Presence-based — if a victim role word appears ANYWHERE in the text
      // AND a harm verb also appears, treat as civilian harm (handles "Professor X was ... killed")
      const victimRolePresent = /\b(civilian|villager|resident|farmer|herder|traveller|traveler|passenger|worshipper|student|woman|child|teacher|lecturer|professor|doctor|nurse|driver|commuter|pastor|imam|cleric|monarch|youth|trader|marketer|soldier|police|officer|vigilante|hunter)\b/i.test(combined);
      const harmVerbPresent = /\b(killed|died|injured|wounded|kidnapped|abducted|displaced|attacked|murdered|assassinated|ambushed|slaughtered|massacred)\b/i.test(combined);
      const presenceBasedVictimHarm = victimRolePresent && harmVerbPresent;

      const mentionsCivilianHarm = adjacentVictimHarm || presenceBasedVictimHarm;

      // Check for active voice where the group is the subject (e.g., "ISWAP kills...", "Bandits kidnap...")
      // This almost always indicates a civilian/security force attack, NOT a counter-insurgency op
      const isActiveAttack = /\b(boko\s*haram|iswap|bandits?|gunmen|terrorists?|insurgents?|militants?)\s+(kill(ed|s|ing)?|abduct(ed|s|ing)?|attack(ed|s|ing)?|kidnap(ped|s|ping)?|storm(ed|s|ing)?|invad(ed|s|ing)?|raid(ed|s|ing)?)/i.test(title);

      // Check if "rescued" is a key part (military rescuing kidnapped persons is a positive outcome, not an attack)
      const isRescueOperation = /\b(rescued?|freed?|liberat(ed?|ing))\s*\d*\s*(abducted|kidnapped|captive|hostage)/i.test(combined);

      // 1. If it mentions civilian/soldier harm explicitly, KEEP IT
      if (mentionsCivilianHarm) continue;

      // 2. If the TITLE clearly shows an active attack by a group, ALWAYS KEEP IT
      //    e.g. "ISWAP Abducts and Kills..." — the group is the attacker, not the victim
      if (isActiveAttack) continue;

      if (isSecurityOperation && describesAttackerDeaths) {
        // This looks like a military operation report, not a civilian attack
        toRemove.push(attack);
        console.log(`[CLEANUP] Flagged: "${(attack as any).title}" — security operation, no civilian casualties mentioned`);
        continue;
      }

      // Also catch rescue-only operations (no attack on civilians)
      if (isSecurityOperation && isRescueOperation && !mentionsCivilianHarm) {
        const cas = (attack as any).casualties || {};
        // If killed count seems to be attacker deaths (and no kidnapping/displacement of civilians)
        if ((cas.killed > 0 || cas.injured > 0) && !cas.kidnapped && !cas.displaced) {
          toRemove.push(attack);
          console.log(`[CLEANUP] Flagged: "${(attack as any).title}" — rescue operation with attacker deaths only`);
          continue;
        }
      }

      // Catch records where casualties are purely attacker deaths based on number matching
      // e.g., "neutralized 16 terrorists" and killed=16
      if (describesAttackerDeaths && !mentionsCivilianHarm) {
        const numberMatch = combined.match(/\b(neutrali[sz]ed?|eliminat(?:ed?|ing)|kill(?:ed|s|ing)?)\s+(?:more\s+than\s+)?(\d+)\s+(terrorists?|insurgents?|bandits?|militants?|fighters?|combatants?|gunmen|criminals?)/i);
        if (numberMatch) {
          const reportedAttackerKills = parseInt(numberMatch[2], 10);
          const recordedKilled = (attack as any).casualties?.killed || 0;
          // If the killed count matches or is close to the attacker count, it's attacker deaths
          if (recordedKilled > 0 && recordedKilled <= reportedAttackerKills + 5) {
            toRemove.push(attack);
            console.log(`[CLEANUP] Flagged: "${(attack as any).title}" — killed count (${recordedKilled}) matches attacker deaths (${reportedAttackerKills})`);
            continue;
          }
        }
      }
    }

    console.log(`[CLEANUP] Found ${toRemove.length} attacker-only incidents out of ${allAttacks.length} total`);

    if (dryRun) {
      return setCORSHeaders(
        NextResponse.json({
          mode: "DRY RUN — nothing deleted",
          totalScanned: allAttacks.length,
          flagged: toRemove.length,
          incidents: toRemove.map((a: any) => ({
            id: a._id,
            title: a.title,
            description: a.description?.slice(0, 200) + "...",
            date: a.date,
            location: a.location?.state,
            casualties: a.casualties,
          })),
          tip: 'Send { "dryRun": false } in the request body to actually delete them',
        })
      );
    }

    // Actually delete
    const ids = toRemove.map((a: any) => a._id);
    const result = await Attack.deleteMany({ _id: { $in: ids } });

    return setCORSHeaders(
      NextResponse.json({
        mode: "LIVE — records deleted",
        totalScanned: allAttacks.length,
        deleted: result.deletedCount,
        incidents: toRemove.map((a: any) => ({
          id: a._id,
          title: a.title,
          date: a.date,
        })),
      })
    );
  } catch (error) {
    console.error("[CLEANUP] Error:", error);
    return setCORSHeaders(
      NextResponse.json(
        { error: "Cleanup failed", details: String(error) },
        { status: 500 }
      )
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCORSHeaders(response);
}
