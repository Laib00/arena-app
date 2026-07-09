// Shared option lists used by both the signup form (Auth.jsx) and the main
// app (App.jsx), so a person's Agent Profile can be collected once at
// registration and stay consistent everywhere it's used afterward.

export const DISC = {
  D: { name: "Dominance", desc: "Direct, decisive, results-oriented. Wants the bottom line fast, gets impatient with long explanations, may push back hard or interrupt if they feel the conversation is dragging. Respects confidence, not comfortable with hesitation." },
  I: { name: "Influence", desc: "Outgoing, talkative, enthusiastic, relationship-driven. Warms up quickly, enjoys small talk, persuaded by rapport and excitement more than spreadsheets. Can be scattered on details and change their mind mid-conversation." },
  S: { name: "Steadiness", desc: "Calm, patient, loyal, dislikes pressure or sudden change. Needs reassurance, prefers a slow steady pace, uncomfortable being rushed into a decision. Values trust built over time." },
  C: { name: "Conscientiousness", desc: "Analytical, detail-oriented, skeptical by default. Wants data, comparisons, and proof before deciding. Asks precise follow-up questions, uncomfortable with vague or emotional answers." },
};

export const SALES_STYLES = [
  "Consultative", "Relationship-based", "Direct / Assertive closer",
  "Educator / Advisor", "Data-driven / Analytical", "Solution selling",
];

export const CERTIFICATIONS = [
  "CEA Registered (R Number) — Property",
  "CMFAS Papers 1, 5, 9, 9A — Financial Planning (Life Insurance & ILPs)",
  "CMFAS Papers 1, 2, 5 — Financial Planning (General Insurance & Investments)",
  "AWP (Associate Wealth Planner) Certified",
  "Newly certified / still completing licensing",
];

export const NATIONALITIES = [
  "Singaporean", "Singapore PR (originally Malaysian)", "Singapore PR (originally Chinese national)",
  "Singapore PR (originally Indian national)", "Singapore PR (originally Filipino)", "Foreigner (Work Pass holder)",
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Argentine", "Armenian", "Australian",
  "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Belarusian", "Belgian",
  "Belizean", "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Botswanan", "Brazilian", "British", "Bruneian",
  "Bulgarian", "Burkinabe", "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean",
  "Chadian", "Chilean", "Chinese national", "Colombian", "Congolese", "Costa Rican", "Croatian", "Cuban",
  "Cypriot", "Czech", "Danish", "Djiboutian", "Dominican", "Dutch", "Ecuadorian", "Egyptian", "Emirati",
  "English", "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese",
  "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Guatemalan", "Guinean", "Guyanese", "Haitian",
  "Honduran", "Hong Konger", "Hungarian", "Icelandic", "Indian national", "Indonesian", "Iranian", "Iraqi",
  "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakh", "Kenyan",
  "Kiwi (New Zealander)", "Kuwaiti", "Kyrgyz", "Lao", "Latvian", "Lebanese", "Liberian", "Libyan",
  "Lithuanian", "Luxembourgish", "Macanese", "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivian",
  "Malian", "Maltese", "Mauritanian", "Mauritian", "Mexican", "Moldovan", "Monegasque", "Mongolian",
  "Montenegrin", "Moroccan", "Mozambican", "Namibian", "Nepalese", "Nicaraguan", "Nigerian", "Nigerien",
  "North Korean", "Norwegian", "Omani", "Pakistani", "Panamanian", "Papua New Guinean", "Paraguayan",
  "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Salvadoran", "Saudi",
  "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Slovak", "Slovenian", "Somali",
  "South African", "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Surinamese", "Swazi", "Swedish",
  "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", "Trinidadian",
  "Tunisian", "Turkish", "Turkmen", "Ugandan", "Ukrainian", "Uruguayan", "Uzbek", "Venezuelan", "Vietnamese",
  "Welsh", "Yemeni", "Zambian", "Zimbabwean",
];

export const EDU_LEVELS = ["N-Level / O-Level", "Diploma", "Bachelor's Degree", "Master's Degree", "Professional Certification / PhD"];
