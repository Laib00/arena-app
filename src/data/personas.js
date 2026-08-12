import { NATIONALITIES, EDU_LEVELS } from "../constants";

/** Phase 1 focus: Property only. Set true later to show FP again. */
const ENABLE_FINANCIAL_PLANNING = false;
const SETTINGS = [
  { key: "Canvassing", desc: "This is a cold, unplanned encounter — the agent is reaching out or crossing paths with you (e.g. door-knocking, cold call, or bumping into you) with no prior relationship or appointment. You were not expecting this conversation." },
  { key: "First Appointment (Online-preceded)", desc: "You already exchanged messages or spoke briefly online (e.g. WhatsApp, a lead form, social media) before this. This is your first real conversation/meeting, so there's a little familiarity already, but you haven't properly met in person yet." },
  { key: "First Appointment (Self-Presentation)", desc: "This is a formal first face-to-face meeting where the agent has set up time specifically to introduce themselves and present their services to you. You agreed to this meeting but don't know the agent personally yet." },
];

const PROPERTY_AIMS = [
  { key: "Upgrade", desc: "want to move from a smaller/older home into a bigger or better one" },
  { key: "Downgrade", desc: "want to move from a bigger/older home into something smaller, simpler, or more manageable" },
  { key: "Buy First (New Purchase)", desc: "are purchasing property for the first time, with no home owned yet" },
  { key: "Sell", desc: "want to sell your current property, for reasons unrelated to also buying" },
  { key: "Rent", desc: "want to rent — either as a tenant looking for a place, or as a landlord looking for a tenant for your property" },
];

const FP_AIMS = [
  { key: "Protection Planning", desc: "want to review or close gaps in your insurance coverage (life, health, disability) to protect your family/income" },
  { key: "Wealth Accumulation / Investment", desc: "want to start or grow an investment portfolio to build long-term wealth" },
  { key: "Retirement Planning", desc: "want to plan and make sure you'll have enough income and savings for retirement" },
  { key: "Estate / Legacy Planning", desc: "want to plan how your assets will be distributed and protected for your family after you're gone" },
  { key: "Debt Restructuring", desc: "are carrying debt (credit card, personal loan, etc.) and want help restructuring or paying it down" },
];

const FIELD_LABELS = {
  Property: ["Budget (SGD)", "Home Ownership (Current)", "Preferred Property Type"],
  FP: ["Investable Assets / Income (SGD)", "Risk Appetite", "Existing Financial Products / Coverage"],
};

/**
 * Targeted practice challenges. Add more objects here later — the home UI wraps chips.
 * promptHint is injected into the roleplay system prompt (subtle, never announced).
 */
const CHALLENGES = [
  {
    id: "price_objection",
    label: "Price objection",
    promptHint: `TARGETED FOCUS — Price sensitivity (subtle, never announce this):
You have a real concern about price / value / affordability that fits your persona (budget, fees, "too expensive vs alternatives," etc.).
Do NOT open with a price objection or say you are here to practice objections.
Let rapport and the deal context develop first (several exchanges). Only raise price-related pushback when the agent discusses numbers, options, next steps, or tries to advance the sale — the way a real client would.
Keep returning to value/price tension naturally if they brush it off; don't drop it after one line.`,
  },
  {
    id: "rejection",
    label: "Rejection",
    promptHint: `TARGETED FOCUS — Rejection / disengagement (subtle, never announce this):
You are inclined to shut this down or walk away if the agent feels pushy, vague, or not useful — consistent with your personality.
Do NOT open by rejecting them or saying you want to leave.
Give a normal opening for the Setting. After a few turns, show growing reluctance (short answers, skepticism, "not sure this is for me," checking the time). If they don't earn your interest, escalate toward ending the conversation — as a real prospect would, not as a dramatic script.`,
  },
  {
    id: "ask_commitment",
    label: "Ask for commitment",
    promptHint: `TARGETED FOCUS — Commitment hesitation (subtle, never announce this):
You are interested enough to keep talking, but you resist committing (viewing, signing, next meeting, "yes let's proceed") without feeling ready.
Do NOT open by announcing you won't commit.
Engage normally first. When the agent asks for a clear next step or commitment, hesitate, defer ("I need to think," "let me check with…," "send me details first"), or set soft conditions. Stay in character — warm or firm per your DISC — but make earning a real commitment the hard part.`,
  },
];

// id, grade, name, age, occupation, nationality, edu, disc, badExp, badExpReason, needLevel, lifeStage, field1, field2, field3, notes
const PROPERTY_PERSONAS = [
  ["P01","Easy","Grace Teo",34,"Marketing Executive","Singaporean","Bachelor's Degree","I","No","No — no significant negative past experience with agents","High (actively searching now)","Young family, kids under 12","$1,200,000","Owns 1 HDB flat (MOP cleared)","Condo (private, non-landed)",""],
  ["P02","Easy","Daniel Ong",29,"Software Engineer","Singaporean","Bachelor's Degree","S","No","No — no significant negative past experience with agents","Medium (considering within 6-12 months)","Single, no dependents","$800,000","Renting, no property owned","HDB resale/BTO",""],
  ["P03","Medium","Kavitha",41,"Accountant","Singaporean","Master's Degree","C","No","No — no significant negative past experience with agents","High (actively searching now)","Family with teenage children","$1,500,000","Owns 1 private condo","Landed property",""],
  ["P04","Medium","Kumar",45,"Business Owner (F&B)","Singapore PR (originally Chinese national)","Diploma","D","No","No — no significant negative past experience with agents","High (actively searching now)","Empty nesters (kids have moved out)","$2,200,000","Owns multiple properties (investor)","Open to any type, prioritizing location/budget over type",""],
  ["P05","Medium","Su Mei",58,"Retired","Singaporean","N-Level / O-Level","S","No","No — no significant negative past experience with agents","Medium (considering within 6-12 months)","Retired, no dependents","$900,000","Owns 1 landed property","Condo (private, non-landed)","This is your family home of 30 years. You are emotionally attached and will need reassurance and patience, not just numbers."],
  ["P06","Medium","Jason Koh",33,"Teacher","Singaporean","Bachelor's Degree","I","No","No — no significant negative past experience with agents","High (actively searching now)","Young family, kids under 12","$750,000","Owns 1 HDB flat (MOP cleared)","Condo (private, non-landed)","Your budget is tight relative to what you want. You are optimistic and will need gentle, honest expectation-setting."],
  ["P07","Medium","Aidah",27,"Nurse","Filipino","Diploma","S","No","No — no significant negative past experience with agents","Medium (considering within 6-12 months)","Single, no dependents","$650,000","Living with parents, no property owned","HDB resale/BTO","You are a first-time buyer and easily overwhelmed by paperwork and jargon. You need things explained simply and patiently."],
  ["P08","Medium","Marcus Lee",52,"Banker","Singaporean","Master's Degree","D","No","No — no significant negative past experience with agents","Urgent (hard deadline / forced timeline)","Empty nesters (kids have moved out)","$1,800,000","Owns multiple properties (investor)","Open to any type, prioritizing location/budget over type","You're busy and impatient — you want the bottom line fast and dislike long explanations."],
  ["P09","Hard","Vanessa Chua",47,"Lawyer","Singaporean","Master's Degree","C","Yes","Yes — a previous agent misrepresented a defect that only surfaced after moving in","High (actively searching now)","Family with teenage children","$1,600,000","Owns 1 private condo","Landed property","You are guarded because of a past bad experience. Test the agent early with a pointed question about conflicts of interest before opening up."],
  ["P10","Hard","Zhi Yong",44,"Engineer (Manufacturing)","Singaporean","Bachelor's Degree","D","No","No — no significant negative past experience with agents","Urgent (hard deadline / forced timeline)","Family with teenage children","$1,100,000","Owns 1 private condo","Open to any type, prioritizing location/budget over type","This is a divorce-driven sale. You are emotionally volatile — irritable, occasionally snap, and don't want to discuss your ex-spouse's involvement directly."],
  ["P11","Hard","Farhan",39,"Consultant","Indian national","Master's Degree","C","Yes","Yes — a previous agent gave inconsistent or inaccurate information about paperwork","Medium (considering within 6-12 months)","Single, no dependents","$2,000,000","Owns multiple properties (investor)","Condo (private, non-landed)","You are a foreign investor unfamiliar with Singapore rules (ABSD etc) and distrustful after being given wrong information before. You ask a lot of verification questions."],
  ["P12","Hard","Michelle Goh",50,"Finance Manager","Singapore PR (originally Malaysian)","Master's Degree","D","Yes","Yes — a previous agent seemed to prioritize a fast commission over their actual interests","High (actively searching now)","Empty nesters (kids have moved out)","$1,900,000","Owns 1 landed property","Landed property","You are a tough, savvy negotiator who has read up extensively. You push back hard on any number and question the agent's motives."],
  ["P13","Hard","Yusof",55,"Hawker Stall Owner","Malaysian","N-Level / O-Level","S","No","No — no significant negative past experience with agents","Urgent (hard deadline / forced timeline)","Multi-generational household, caring for aging parents","$600,000","Owns 1 HDB flat (MOP cleared)","HDB resale/BTO","You are under real financial distress and selling out of necessity, though you are ashamed to say so directly. You need sensitivity, not just efficiency."],
  ["P14","Hard","Meera",36,"Architect","Singaporean","Master's Degree","C","Yes","Yes — a previous agent gave inconsistent or inaccurate information about paperwork","Low (just exploring, no urgency)","Young couple, no kids yet","$1,300,000","Renting, no property owned","Condo (private, non-landed)","You are extremely meticulous and slow-moving despite low urgency — you will scrutinize every detail and ask the agent to re-verify things repeatedly."],
  ["P15","Impossible","Boon Keng",60,"Entrepreneur (Startup)","Singaporean","Professional Certification / PhD","D","Yes","Yes — a previous agent seemed to prioritize a fast commission over their actual interests","Urgent (hard deadline / forced timeline)","Empty nesters (kids have moved out)","$700,000","Owns 1 HDB flat (MOP cleared)","Landed property","You insist on a landed property despite a budget roughly a third of what's realistic for one. You have fired multiple agents already. When told this is unrealistic, do not accept it easily — deflect, say 'that's your job to find it,' or imply the agent isn't trying hard enough. Stay skeptical of any compromise."],
  ["P16","Impossible","Geok Hoon",63,"Academic / Professor","Singaporean","Professional Certification / PhD","C","Yes","Yes — a previous agent didn't disclose they were representing both sides of the deal","Urgent (hard deadline / forced timeline)","Retired, no dependents","$1,000,000","Owns 1 HDB flat (MOP cleared)","Open to any type, prioritizing location/budget over type","You demand a guarantee that your next property will appreciate in value — something no ethical agent can promise. When told this isn't possible, don't accept it — ask for 'some kind of assurance' repeatedly, or hint you'll find an agent who will promise it."],
];

const FP_PERSONAS = [
  ["F01","Easy","Xin Yi",30,"Teacher","Singaporean","Bachelor's Degree","I","No","No — no significant negative past experience with advisors","High (actively searching now)","Young couple, no kids yet","$50,000 investable, $6,000/month income","Balanced — wants steady growth, can tolerate some ups and downs","Has term life insurance only, no investments beyond CPF",""],
  ["F02","Easy","Amir",26,"Civil Servant","Singaporean","Diploma","S","No","No — no significant negative past experience with advisors","Medium (considering within 6-12 months)","Single, no dependents","$20,000 investable, $4,500/month income","Conservative — prioritizes capital preservation, very uncomfortable with volatility","Has no insurance and no investments — starting from scratch",""],
  ["F03","Medium","Wei Jie",42,"Engineer (Manufacturing)","Singaporean","Master's Degree","C","No","No — no significant negative past experience with advisors","High (actively searching now)","Family with teenage children","$300,000 investable, $15,000/month income","Growth-oriented — comfortable with moderate risk for higher long-term returns","Has a small self-directed stock/ETF portfolio, minimal insurance beyond MediShield",""],
  ["F04","Medium","Hui Ling",35,"Entrepreneur (Startup)","Singaporean","Bachelor's Degree","D","No","No — no significant negative past experience with advisors","High (actively searching now)","Young couple, no kids yet","$150,000 investable, $12,000/month income","Aggressive — actively seeks high-growth, high-volatility opportunities","Has investments through a robo-advisor, has never worked with a human advisor before",""],
  ["F05","Medium","Deepa",56,"Nurse","Singaporean","Diploma","S","No","No — no significant negative past experience with advisors","Medium (considering within 6-12 months)","Empty nesters (kids have moved out)","$400,000 investable, $7,000/month income","Conservative — prioritizes capital preservation, very uncomfortable with volatility","Has CPF/SRS savings but no private investments","You are anxious about outliving your savings and will need a lot of reassurance about downside protection."],
  ["F06","Medium","Ravi",48,"Sales Executive","Singaporean","Bachelor's Degree","I","No","No — no significant negative past experience with advisors","Medium (considering within 6-12 months)","Family with teenage children","$180,000 investable, $9,000/month income","Balanced — wants steady growth, can tolerate some ups and downs","Has multiple insurance policies from different agents, feels over-insured and confused","You genuinely don't know what coverage you already have. You'll need help just making sense of your existing policies before anything else."],
  ["F07","Medium","Nurul",33,"Marketing Executive","Malaysian","Bachelor's Degree","D","No","No — no significant negative past experience with advisors","Urgent (hard deadline / forced timeline)","Young family, kids under 12","$5,000 investable, $6,500/month income","Conservative — prioritizes capital preservation, very uncomfortable with volatility","Has term life insurance only, no investments beyond CPF","You are stressed about debt and slightly defensive/embarrassed about your financial situation."],
  ["F08","Medium","Muthu",61,"Retired","Singaporean","Master's Degree","C","No","No — no significant negative past experience with advisors","Medium (considering within 6-12 months)","Multi-generational household, caring for aging parents","$800,000 investable, $4,000/month income","Balanced — wants steady growth, can tolerate some ups and downs","Has CPF/SRS savings but no private investments",""],
  ["F09","Hard","Sarah Lim",45,"Doctor","Singaporean","Professional Certification / PhD","C","Yes","Yes — a previous advisor sold them an investment-linked policy they didn't fully understand","High (actively searching now)","Family with teenage children","$600,000 investable, $20,000/month income","Balanced — wants steady growth, can tolerate some ups and downs","Has an old endowment plan from years ago, no other investments","You are guarded and will ask the advisor to explain every product in plain terms before you'll consider anything, having been burned by jargon before."],
  ["F10","Hard","Benjamin Tan",50,"Banker","Singaporean","Master's Degree","D","Yes","Yes — a previous advisor churned their portfolio to generate more commissions","High (actively searching now)","Empty nesters (kids have moved out)","$1,200,000 investable, $18,000/month income","Growth-oriented — comfortable with moderate risk for higher long-term returns","Has a small self-directed stock/ETF portfolio, minimal insurance beyond MediShield","You scrutinize any fee or transaction the advisor proposes and directly ask how they're compensated."],
  ["F11","Hard","Fatimah",38,"HR Manager","Singaporean","Bachelor's Degree","S","Yes","Yes — a previous advisor disappeared after the policy was signed","Medium (considering within 6-12 months)","Young family, kids under 12","$100,000 investable, $8,500/month income","Conservative — prioritizes capital preservation, very uncomfortable with volatility","Has an old endowment plan from years ago, no other investments","You're hesitant to re-engage with any advisor at all. You need to feel a genuine ongoing relationship, not just a one-time sale, before trusting again."],
  ["F12","Hard","Arun",41,"IT Manager","Singaporean","Master's Degree","D","Yes","Yes — a previous advisor recommended a product that didn't match their risk profile","High (actively searching now)","Young family, kids under 12","$250,000 investable, $13,000/month income","Conservative — prioritizes capital preservation, very uncomfortable with volatility","Has multiple insurance policies from different agents, feels over-insured and confused","You are wary of being sold to again and will directly ask how this recommendation is different from what got you burned before."],
  ["F13","Hard","Priya",44,"Lawyer","Singapore PR (originally Malaysian)","Master's Degree","C","Yes","Yes — a previous advisor seemed more focused on AUM targets than their actual goals","Medium (considering within 6-12 months)","Family with teenage children","$900,000 investable, $22,000/month income","Balanced — wants steady growth, can tolerate some ups and downs","Has CPF/SRS savings but no private investments","You are skeptical of every recommendation's underlying motive and will ask pointed questions about why a specific product is being suggested."],
  ["F14","Hard","Hafiz",39,"Freelance Designer","Singaporean","Diploma","I","Yes","Yes — a previous advisor didn't clearly explain early surrender penalties before they signed","Low (just exploring, no urgency)","Single, no dependents","$40,000 investable, $7,000/month income","Conservative — prioritizes capital preservation, very uncomfortable with volatility","Has an old endowment plan from years ago, no other investments","You are emotionally raw about a costly mistake from a penalty you didn't see coming, and reluctant to commit to anything new despite having a real need."],
  ["F15","Impossible","Zulkifli",58,"Business Owner (F&B)","Singaporean","Diploma","D","Yes","Yes — a previous advisor gave advice that contradicted what was promised during the sales pitch","Urgent (hard deadline / forced timeline)","Empty nesters (kids have moved out)","$2,000,000 investable, $25,000/month income","Aggressive — actively seeks high-growth, high-volatility opportunities","Has multiple insurance policies from different agents, feels over-insured and confused","You want guaranteed high returns with zero risk of loss. When told this isn't realistic or something a licensed advisor can promise, push back — say other advisors have offered this, or suggest this advisor lacks experience or connections."],
  ["F16","Impossible","Hidayah",64,"Academic / Professor","Singaporean","Professional Certification / PhD","C","Yes","Yes — a previous advisor churned their portfolio to generate more commissions","Urgent (hard deadline / forced timeline)","Retired, no dependents","$1,500,000 investable, $3,000/month income","Conservative — prioritizes capital preservation, very uncomfortable with volatility","Has no insurance and no investments — starting from scratch","You insist on ultra-conservative, capital-guaranteed products, but simultaneously expect 8%+ annual returns. When the agent points out this is contradictory, don't resolve it — deflect, get defensive, or ask them to 'just find something that does both.'"],
];

function toPersonaObj(row, industry) {
  const [id, grade, name, age, occupation, nationality, edu, disc, badExp, badExpReason, needLevel, lifeStage, field1, field2, field3, notes] = row;
  return { id, grade, name, age, occupation, nationality, edu, disc, badExp, badExpReason, needLevel, lifeStage, field1, field2, field3, notes, industry };
}

const ALL_PERSONAS = [
  ...PROPERTY_PERSONAS.map((r) => toPersonaObj(r, "Property")),
  ...FP_PERSONAS.map((r) => toPersonaObj(r, "FP")),
];

const GRADE_ORDER = ["Easy", "Medium", "Hard", "Impossible"];

/* ---------- Random client generator (wildcard option) ---------- */

const RANDOM_NAMES = [
  "Wei Ming", "Hui Ling", "Kai Xuan", "Mei Fen", "Jun Hao", "Siti Aishah", "Rajesh", "Priya",
  "Farhan", "Nurul", "Benjamin Tan", "Sarah Lim", "Muthu", "Kavitha", "Zhi Yong", "Xin Yi",
  "Amir", "Fatimah", "Daniel Ong", "Michelle Goh", "Kumar", "Deepa", "Yusof", "Aidah",
  "Jason Koh", "Grace Teo", "Wei Jie", "Su Mei", "Arun", "Lakshmi", "Hafiz", "Aina",
  "Marcus Lee", "Vanessa Chua", "Boon Keng", "Geok Hoon", "Ravi", "Meera", "Zulkifli", "Hidayah",
];

const RANDOM_OCCUPATIONS = [
  "Teacher", "Civil Servant", "Software Engineer", "Nurse", "Business Owner (F&B)",
  "Marketing Executive", "Finance Manager", "Doctor", "Lawyer", "Sales Executive",
  "Architect", "Consultant", "IT Manager", "Accountant", "Entrepreneur (Startup)",
  "Retired", "Homemaker", "Freelance Designer", "Pilot", "HR Manager",
  "Engineer (Manufacturing)", "Academic / Professor", "Hawker Stall Owner", "Banker",
];

const RANDOM_NEED_LEVELS = [
  "Low (just exploring, no urgency)", "Medium (considering within 6-12 months)",
  "High (actively searching now)", "Urgent (hard deadline / forced timeline)",
];

const RANDOM_LIFE_STAGES = [
  "Single, no dependents", "Young couple, no kids yet", "Young family, kids under 12",
  "Family with teenage children", "Empty nesters (kids have moved out)",
  "Retired, no dependents", "Multi-generational household, caring for aging parents",
];

const RANDOM_PROPERTY_BAD_EXP = [
  "a previous agent went silent for weeks after the listing was signed",
  "a previous agent pressured them into a decision they later regretted",
  "a previous agent misrepresented a defect that only surfaced after moving in",
  "a previous agent seemed to prioritize a fast commission over their actual interests",
  "a previous agent gave inconsistent or inaccurate information about paperwork",
  "a previous agent double-booked viewings and wasted a lot of their time",
  "a previous agent didn't disclose they were representing both sides of the deal",
];

const RANDOM_FP_BAD_EXP = [
  "a previous advisor sold them an investment-linked policy they didn't fully understand",
  "a previous advisor churned their portfolio to generate more commissions",
  "a previous advisor disappeared after the policy was signed",
  "a previous advisor recommended a product that didn't match their risk profile",
  "a previous advisor seemed more focused on AUM targets than their actual goals",
  "a previous advisor didn't clearly explain early surrender penalties before they signed",
  "a previous advisor gave advice that contradicted what was promised during the sales pitch",
];

const RANDOM_HOME_OWNERSHIP = [
  "Renting, no property owned", "Living with parents, no property owned",
  "Owns 1 HDB flat (still under MOP)", "Owns 1 HDB flat (MOP cleared)",
  "Owns 1 Executive Condo (EC)", "Owns 1 private condo", "Owns 1 landed property",
  "Owns multiple properties (investor)",
];

const RANDOM_PROPERTY_TYPE = [
  "HDB resale/BTO", "Condo (private, non-landed)", "Executive Condominium (EC)",
  "Landed property", "Open to any type, prioritizing location/budget over type",
];

const RANDOM_RISK_APPETITE = [
  "Conservative — prioritizes capital preservation, very uncomfortable with volatility",
  "Balanced — wants steady growth, can tolerate some ups and downs",
  "Growth-oriented — comfortable with moderate risk for higher long-term returns",
  "Aggressive — actively seeks high-growth, high-volatility opportunities",
];

const RANDOM_FP_PRODUCTS = [
  "Has term life insurance only, no investments beyond CPF",
  "Has an old endowment plan from years ago, no other investments",
  "Has CPF/SRS savings but no private investments",
  "Has a small self-directed stock/ETF portfolio, minimal insurance beyond MediShield",
  "Has no insurance and no investments — starting from scratch",
  "Has multiple insurance policies from different agents, feels over-insured and confused",
  "Has investments through a robo-advisor, has never worked with a human advisor before",
];

const RANDOM_IMPOSSIBLE_NOTES_PROPERTY = [
  "You insist on a property type/location well beyond what your budget realistically allows. When told this is unrealistic, do not accept it easily — deflect, or imply the agent isn't trying hard enough.",
  "You demand a guarantee that your property will appreciate in value — something no ethical agent can promise. Keep asking for 'some kind of assurance' even after being told this isn't possible.",
  "You contradict your own stated priorities mid-conversation (e.g. insist on both lowest price AND best location/condition) and get frustrated if the agent points out the tension instead of just delivering both.",
];

const RANDOM_IMPOSSIBLE_NOTES_FP = [
  "You want guaranteed high returns with zero risk of loss. When told this isn't realistic or something a licensed advisor can promise, push back — say other advisors have offered this.",
  "You insist on ultra-conservative, capital-guaranteed products, but simultaneously expect very high annual returns. When the agent points out this is contradictory, don't resolve it — deflect or get defensive.",
  "You've fired multiple advisors already and openly compare this agent unfavorably to unnamed 'better' advisors, without ever specifying what you actually want changed.",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBudget() {
  const amt = (300 + Math.floor(Math.random() * 2701)) * 1000; // 300k - 3000k
  return `$${amt.toLocaleString()}`;
}

function randomInvestable() {
  const assets = (20 + Math.floor(Math.random() * 1981)) * 1000; // 20k - 2000k
  const income = (3 + Math.floor(Math.random() * 28)) * 1000; // 3k - 30k
  return `$${assets.toLocaleString()} investable, $${income.toLocaleString()}/month income`;
}

function generateRandomClient(industryKey) {
  // industryKey: "Property" or "FP"
  const grade = pick(["Easy", "Easy", "Medium", "Medium", "Medium", "Hard", "Hard", "Impossible"]);
  const disc = pick(["D", "I", "S", "C"]);
  const badExp = grade === "Easy" ? "No" : pick(["Yes", "Yes", "No"]);
  const badExpReason =
    badExp === "Yes"
      ? `Yes — ${pick(industryKey === "Property" ? RANDOM_PROPERTY_BAD_EXP : RANDOM_FP_BAD_EXP)}`
      : `No — no significant negative past experience with ${industryKey === "Property" ? "agents" : "advisors"}`;
  const notes =
    grade === "Impossible"
      ? pick(industryKey === "Property" ? RANDOM_IMPOSSIBLE_NOTES_PROPERTY : RANDOM_IMPOSSIBLE_NOTES_FP)
      : "";

  const field1 = industryKey === "Property" ? randomBudget() : randomInvestable();
  const field2 = industryKey === "Property" ? pick(RANDOM_HOME_OWNERSHIP) : pick(RANDOM_RISK_APPETITE);
  const field3 = industryKey === "Property" ? pick(RANDOM_PROPERTY_TYPE) : pick(RANDOM_FP_PRODUCTS);

  return {
    id: `RAND-${Date.now()}`,
    grade,
    name: pick(RANDOM_NAMES),
    age: 24 + Math.floor(Math.random() * 49),
    occupation: pick(RANDOM_OCCUPATIONS),
    nationality: pick(NATIONALITIES),
    edu: pick(EDU_LEVELS),
    disc,
    badExp,
    badExpReason,
    needLevel: pick(RANDOM_NEED_LEVELS),
    lifeStage: pick(RANDOM_LIFE_STAGES),
    field1,
    field2,
    field3,
    notes,
    industry: industryKey,
    isRandom: true,
  };
}

export {
  ENABLE_FINANCIAL_PLANNING,
  SETTINGS,
  PROPERTY_AIMS,
  FP_AIMS,
  FIELD_LABELS,
  CHALLENGES,
  PROPERTY_PERSONAS,
  FP_PERSONAS,
  toPersonaObj,
  ALL_PERSONAS,
  GRADE_ORDER,
  generateRandomClient,
};
