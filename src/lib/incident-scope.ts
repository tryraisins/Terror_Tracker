/**
 * Conservative article-to-event screening shared by model and feed ingestion.
 * A source headline can contain incident vocabulary without describing a new
 * qualifying incident, so this runs before any record is written.
 */

export interface IncidentScopeInput {
  title?: string;
  description?: string;
  tags?: string[];
  group?: string;
}

const ORIGINAL_EVENT_VERB = /\b(?:attack(?:ed|s|ing)?|ambush(?:ed|es|ing)?|raid(?:ed|s|ing)?|shoot(?:ing|s|ers?|out)?|killed|injured|wounded|kidnap(?:ped|ping)?|abduct(?:ed|ing)?|bomb(?:ed|ing)?|explod(?:ed|ing)|clash(?:ed|es|ing)?|massacre[ds]?|storm(?:ed|s|ing)?)\b/i;
const ARMED_CONTEXT = /\b(?:armed|gunmen|bandits?|insurgents?|terrorists?|militants?|boko\s+haram|iswap|ied|explos(?:ion|ive)|cultists?|cult[- ]related|herdsmen|ipob|esn|kidnap(?:pers?|ping)?|abduct(?:ors?|ion)?)\b/i;
const FOLLOW_UP_WORDS = /\b(?:rescue|rescued|release|released|freed|recovered|recovery|aftercare|commend(?:ed|s)?|hails?\s+(?:the\s+)?rescue|gunned\s+down\s+during\s+rescue)\b/i;
const OPERATION_WORDS = /\b(?:deploy(?:ed|s|ment)?|patrol(?:led|s|ling)?|training|preparedness|clearance operation|security briefing|boost(?:ing)?\s+security|beef(?:ed|s|ing)?\s+up\s+security|operation\s+result|security forces?\s+(?:kill|killed|neutraliz|recover|rescue|arrest))\b/i;
const POLICY_WORDS = /\b(?:won['’]?t\s+negotiate|will\s+not\s+negotiate|negotiate\s+with|surrender|amnesty|policy statement|commissioner\s+(?:says|warns|vows)|governor\s+(?:says|hails|commends)|government\s+(?:hails|commends|says))\b/i;
const SPORTS_WORDS = /\b(?:football|soccer|champions?\s+league|caf|fixture|match|club|team|stadium|coach|player|league|san\s+pedro|depart(?:ed|s)?\s+for)\b/i;
const ORDINARY_CRIME_WORDS = /\b(?:phone\s+(?:snatcher|snatching|thief|theft)|stabb(?:ing|ed)|sentenc(?:ed|ing)|jail\s+term|court\s+(?:sentenc|convict|hears)|robbery\s+suspect)\b/i;
const MOB_ASSAULT = /\b(?:mob|lynch(?:ed|ing)?|vigilante justice)\b/i;

/** Returns a rejection reason, or null when the candidate may proceed. */
export function screenIncidentCandidate(input: IncidentScopeInput): string | null {
  const title = String(input.title || "").trim();
  const description = String(input.description || "").trim();
  // Use article narrative rather than model-added tags/group labels. A default
  // group such as "Unknown Gunmen" must not make a sports or court story look
  // like an armed incident.
  const combined = `${title} ${description}`.toLowerCase();
  const originalEventInTitle = ORIGINAL_EVENT_VERB.test(title);
  const armedContext = ARMED_CONTEXT.test(combined);

  // Follow-up headlines describe an outcome, not a second attack. They may
  // proceed only when the headline itself contains the original attack grain.
  if (FOLLOW_UP_WORDS.test(title) && !originalEventInTitle) {
    return "follow-up/rescue/operation report without an original attack event in the headline";
  }

  if (OPERATION_WORDS.test(combined) && !originalEventInTitle) {
    return "security deployment, preparedness, patrol, or operational-result report";
  }

  if (POLICY_WORDS.test(combined) && !originalEventInTitle) {
    return "policy, government reaction, negotiation, or surrender report";
  }

  if (SPORTS_WORDS.test(combined) && !armedContext) {
    return "sports or travel report rather than a security incident";
  }

  if (MOB_ASSAULT.test(combined) && !armedContext) {
    return "ordinary mob assault without organized armed activity";
  }

  if (ORDINARY_CRIME_WORDS.test(combined) && !armedContext) {
    return "ordinary isolated crime or legal report without organized armed activity";
  }

  return null;
}
