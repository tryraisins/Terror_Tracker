/**
 * Evidence-bound article-to-event screening shared by model and feed ingestion.
 * A source headline can contain incident vocabulary without describing a new
 * qualifying incident, so this runs before any record is written. Routine
 * Nigerian Army/security-force work is intentionally outside the public scope;
 * explicit kidnapping-victim rescues remain allowed as follow-up evidence.
 */

export interface IncidentScopeInput {
  title?: string;
  description?: string;
  tags?: string[];
  group?: string;
}

const ORIGINAL_EVENT_VERB = /\b(?:attack(?:ed|s|ing)?|ambush(?:ed|es|ing)?|raid(?:ed|s|ing)?|shoot(?:ing|s|ers?|out)?|kill(?:ed|s|ing)?|injur(?:ed|es|ing)?|wound(?:ed|s|ing)?|kidnap(?:ped|ping)?|abduct(?:ed|ing)?|bomb(?:ed|ing)?|explod(?:ed|ing)|clash(?:ed|es|ing)?|massacre[ds]?|storm(?:ed|s|ing)?|burn(?:ed|t|ing)?|torch(?:ed|es|ing)?|destroy(?:ed|s|ing)?|vandaliz(?:ed|es|ing)?|vandalis(?:ed|es|ing)?|sabotag(?:ed|es|ing)?|raz(?:ed|es|ing)?)\b/i;
const QUALIFYING_EVENT_NOUN = /\b(?:attack(?:ed|s|ing)?|ambush(?:ed|es|ing)?|raid(?:ed|s|ing)?|shoot(?:ing|s|ers?|out)?|open(?:s)?\s+fire|kidnap(?:ped|ping)?|abduct(?:ed|ing)?|bomb(?:ed|ing)?|ied|explod(?:ed|ing)|clash(?:es|ed|ing)?|massacre[ds]?|hostage|captive|arson|sabotage|destruction|vandalism)\b/i;
const ARMED_CONTEXT = /\b(?:armed|gunmen|bandits?|insurgents?|terrorists?|militants?|boko\s+haram|iswap|ied|explos(?:ion|ive)|cultists?|cult[- ]related|herdsmen|ipob|esn|kidnap(?:pers?|ping)?|abduct(?:ors?|ion)?)\b/i;
const FOLLOW_UP_WORDS = /\b(?:rescue|rescued|release|released|freed|recovered|recovery|aftercare|commend(?:ed|s)?|hails?\s+(?:the\s+)?rescue|gunned\s+down\s+during\s+rescue)\b/i;
const OPERATION_WORDS = /\b(?:deploy(?:ed|s|ment)?|patrol(?:led|s|ling)?|training|preparedness|clearance operation|security briefing|boost(?:ing)?\s+security|beef(?:ed|s|ing)?\s+up\s+security|operation\s+result|security forces?\s+(?:kill|killed|neutraliz|recover|rescue|arrest)|raid(?:ed|s|ing)?\s+(?:a|the)?\s*(?:bandit|terrorist|insurgent|gunmen)|ambush(?:ed|es|ing)?\s+(?:bandit|terrorist|insurgent|gunmen))\b/i;
const POLICY_WORDS = /\b(?:won['’]?t\s+negotiate|will\s+not\s+negotiate|negotiate\s+with|surrender|amnesty|policy statement|commissioner\s+(?:says|warns|vows)|governor\s+(?:says|hails|commends)|government\s+(?:hails|commends|says))\b/i;
const SPORTS_WORDS = /\b(?:football|soccer|champions?\s+league|caf|fixture|match|club|team|stadium|coach|player|league|san\s+pedro|depart(?:ed|s)?\s+for)\b/i;
const ORDINARY_CRIME_WORDS = /\b(?:phone\s+(?:snatcher|snatching|thief|theft)|stabb(?:ing|ed)|sentenc(?:ed|ing)|jail\s+term|court\s+(?:sentenc|convict|hears)|robber(?:y|s?)\s+(?:suspect|attack)?|mob\s+attack)\b/i;
const MOB_ASSAULT = /\b(?:mob|lynch(?:ed|ing)?|vigilante justice)\b/i;
const ARMY_ACTIVITY = /\b(?:army|troops?|soldiers?|military|police|officers?|security\s+forces?|joint\s+task\s+force|jtf|operation\s+hadin\s+kai|ophk|air\s+force|naf|defence\s+headquarters?|dhq|cjtf)\b/i;
const ARMY_OPERATION = /\b(?:deploy(?:ed|s|ment)?|patrol(?:led|s|ling)?|raid(?:ed|s|ing)?|ambush(?:ed|es|ing)?|attack(?:ed|s|ing)?|kill(?:ed|s|ing)?|bomb(?:ed|s|ing)?|strike(?:s|struck|ing)?|clear(?:ed|ance)?|neutraliz(?:e|ed|es|ing)|eliminat(?:e|ed|es|ing)|recover(?:ed|y)?|arrest(?:ed|s)?|overpower(?:ed|s|ing)?)\b/i;
const ARREST_OR_LEGAL_RESULT = /\b(?:arrest(?:ed|s)?|detain(?:ed|s)?|charg(?:ed|es|ing)?|prosecut(?:ed|es|ing)?|sentenc(?:ed|ing)?|court|recover(?:ed|y)?\s+(?:weapons?|arms?|rifles?))\b/i;
const RESCUE_KIDNAP_VICTIMS = /\b(?:rescu(?:e|ed|ing)|fre(?:e|ed|eing)|liberat(?:e|ed|ing))\b[\s\S]{0,100}\b(?:kidnap(?:ped|ping)?|abduct(?:ed|ion|ing)?|hostage|captive|victim)/i;
const HOSTILE_ATTACK_ON_SECURITY = /\b(?:boko\s+haram|iswap|bandits?|gunmen|terrorists?|insurgents?|militants?|ipob|esn|herdsmen|cultists?)\b[\s\S]{0,100}\b(?:attack(?:ed|s|ing)?|ambush(?:ed|es|ing)?|kill(?:ed|s|ing)?|shoot(?:s|ing)?|shot|bomb(?:ed|s|ing)?|raid(?:ed|s|ing)?|clash(?:ed|es|ing)?|abduct(?:ed|ing)?|kidnap(?:ped|ping)?)\b[\s\S]{0,100}\b(?:soldiers?|troops?|army|police|officers?|convoy|patrol|base|barracks?|station)\b/i;
const DIRECT_SECURITY_HARM = /\b(?:soldiers?|troops?|army|police|officers?|personnel|convoy|patrol|base|barracks?|station|security\s+forces?)\b[\s\S]{0,100}\b(?:(?:was|were|have\s+been|had\s+been|got)\s+(?:ambushed|attacked|bombed|targeted|killed|injured|wounded)|(?:ambushed|attacked|bombed|targeted)\s+by|(?:killed|injured|wounded)\s+(?:in|during|by|after|following|when|while)|came\s+under\s+attack|under\s+attack|suffered\s+(?:casualties|losses))\b/i;
const ORGANIZED_GROUP = /\b(?:group|gang|mob|crowd|militia|cultists?|hoodlums?|thugs?|political\s+thugs?|party\s+(?:supporters?|members?|youths?)|armed\s+men|gunmen|bandits?|terrorists?|insurgents?|militants?|attackers?|assailants?)\b/i;
const PROPERTY_TARGET = /\b(?:property|properties|home|house|houses|shop|shops|market|markets|office|offices|secretariat|campaign\s+office|party\s+office|vehicle|vehicles|car|cars|bus|buses|school|church|mosque|farm|farms|warehouse|infrastructure|pipeline|power\s+facility|billboards?)\b/i;
const PROPERTY_DESTRUCTION = /\b(?:arson|set\s+(?:it|them|the\s+\w+)\s+ablaze|burn(?:ed|t|ing)?|torch(?:ed|es|ing)?|destroy(?:ed|s|ing)?|vandaliz(?:ed|es|ing)?|vandalis(?:ed|es|ing)?|sabotag(?:ed|es|ing)?|raz(?:ed|es|ing)?|smash(?:ed|es|ing)?|damage(?:d|s|ing)?)\b/i;
const PREMEDITATED_OR_COORDINATED = /\b(?:premeditated|pre-planned|planned|coordinated|organised|organized|mobilised|mobilized|targeted|stormed|invaded|raided|attacked|arson|set\s+(?:it|them|the\s+\w+)\s+ablaze)\b/i;
const POLITICAL_CONTEXT = /\b(?:political|politics|election|electoral|campaign|rally|polling\s+unit|inec|party|pdp|apc|lp|nnpp|adc|app|ypp|candidate|governor(?:ship)?|chairmanship|secretariat)\b/i;
const VIOLENT_OR_COERCIVE_ACTION = /\b(?:attack(?:ed|s|ing)?|assault(?:ed|s|ing)?|beat(?:en|ing)?|shoot(?:ing|s)?|shot|kill(?:ed|s|ing)?|injur(?:ed|es|ing)?|kidnap(?:ped|ping)?|abduct(?:ed|ing)?|raid(?:ed|s|ing)?|clash(?:ed|es|ing)?|threaten(?:ed|s|ing)?|intimidat(?:ed|es|ing)?|disrupt(?:ed|s|ing)?|burn(?:ed|t|ing)?|torch(?:ed|es|ing)?|destroy(?:ed|s|ing)?|vandaliz(?:ed|es|ing)?|vandalis(?:ed|es|ing)?|sabotag(?:ed|es|ing)?)\b/i;

export function isKidnappingVictimRescue(input: IncidentScopeInput): boolean {
  const text = `${input.title || ""} ${input.description || ""}`;
  return RESCUE_KIDNAP_VICTIMS.test(text) || /\b(?:rescu(?:e|ed|ing)|fre(?:e|ed|eing)|liberat(?:e|d|ing))\b[\s\S]{0,100}\b(?:kidnappers?|abductors?)\b/i.test(text);
}

/** Returns a rejection reason, or null when the candidate may proceed. */
export function screenIncidentCandidate(input: IncidentScopeInput): string | null {
  const title = String(input.title || "").trim();
  const description = String(input.description || "").trim();
  // Use article narrative rather than model-added tags/group labels. A default
  // group such as "Unknown Gunmen" must not make a sports or court story look
  // like an armed incident.
  const combined = `${title} ${description}`.toLowerCase();
  const originalEventInTitle = ORIGINAL_EVENT_VERB.test(title);
  const originalEventInText = ORIGINAL_EVENT_VERB.test(combined);
  const qualifyingEventNoun = QUALIFYING_EVENT_NOUN.test(combined);
  const armedContext = ARMED_CONTEXT.test(combined);
  const permittedRescue = isKidnappingVictimRescue({ title, description });
  const organizedPropertyAttack = ORGANIZED_GROUP.test(combined) && PROPERTY_TARGET.test(combined) && PROPERTY_DESTRUCTION.test(combined) && PREMEDITATED_OR_COORDINATED.test(combined);
  const organizedPoliticalAttack = POLITICAL_CONTEXT.test(combined) && ORGANIZED_GROUP.test(combined) && VIOLENT_OR_COERCIVE_ACTION.test(combined);
  const relaxedQualifyingEvent = organizedPropertyAttack || organizedPoliticalAttack;

  if (!originalEventInText && !permittedRescue && !relaxedQualifyingEvent) {
    return "no specific violent incident or abduction event in the source narrative";
  }

  const hasVictimOrTargetContext = /\b(?:civilian|villager|resident|farmer|herder|travell?er|passenger|worshipper|student|woman|child|teacher|lecturer|professor|doctor|nurse|driver|commuter|pastor|imam|cleric|monarch|youth|trader|marketer|soldier|troops?|police|officer|personnel|vigilante|hunter|community|village|market|convoy|base|barracks?|station|position|road|killed|injur(?:ed|y)?|wound(?:ed|ing)?|kidnap(?:ped|ping)?|abduct(?:ed|ing)?)\b/i.test(combined);
  if (!armedContext && !permittedRescue && !relaxedQualifyingEvent && !(qualifyingEventNoun && hasVictimOrTargetContext)) {
    return "no organized armed/security-incident context";
  }

  if (/\b(?:elephant|animal|wildlife|flood|landslide|building collapse|tanker|road)\s+attack\b/i.test(combined) && !armedContext) {
    return "accident, disaster, animal or other non-security event";
  }

  // Follow-up headlines describe an outcome, not a second attack. They may
  // proceed only when the headline itself contains the original attack grain.
  if (FOLLOW_UP_WORDS.test(title) && !originalEventInTitle && !permittedRescue) {
    return "follow-up/rescue/operation report without an original attack event in the headline";
  }

  if (permittedRescue && !originalEventInTitle && !originalEventInText) {
    return "rescue report does not identify the original abduction or attack";
  }

  if (OPERATION_WORDS.test(combined) && !originalEventInTitle) {
    return "security deployment, preparedness, patrol, or operational-result report";
  }

  // A qualifying incident is often described by police or military sources.
  // Do not treat that attribution as a routine security operation when the
  // candidate headline itself records the original civilian attack.
  if (ARMY_ACTIVITY.test(combined) && ARMY_OPERATION.test(combined) && !originalEventInTitle && !permittedRescue && !HOSTILE_ATTACK_ON_SECURITY.test(combined) && !DIRECT_SECURITY_HARM.test(combined)) {
    return "routine Nigerian Army/security operation; only kidnapping-victim rescues are in scope";
  }

  if (ARREST_OR_LEGAL_RESULT.test(title) && /\b(?:after|following|over)\b/i.test(title) && !/\b(?:kidnap|abduct|hostage|captive)\b/i.test(title)) {
    return "arrest or legal-result headline rather than the original qualifying incident";
  }

  if (POLICY_WORDS.test(combined) && !originalEventInTitle) {
    return "policy, government reaction, negotiation, or surrender report";
  }

  if (SPORTS_WORDS.test(combined) && !armedContext) {
    return "sports or travel report rather than a security incident";
  }

  if (MOB_ASSAULT.test(combined) && !armedContext && !organizedPoliticalAttack && !organizedPropertyAttack) {
    return "ordinary mob assault without organized armed activity";
  }

  if (ORDINARY_CRIME_WORDS.test(combined) && !armedContext && !organizedPoliticalAttack && !organizedPropertyAttack) {
    return "ordinary isolated crime or legal report without organized armed activity";
  }

  return null;
}
