import type {
  ContractDraftDocument, ContractDocSection, ExhibitRef,
  CoAuthorMessage, CoAuthorAction, Citation, DefinitionTerm, MissingField, StandardClause
} from "@/types";

// ─── Page calculation ───
function pageForSection(order: number): string {
  return `Page ${Math.max(1, Math.ceil(order * 1.8))}`;
}

// ─── Intent classification (deterministic, keyword-based) ───
type Intent =
  | "draft_full_contract"
  | "add_section"
  | "update_section"
  | "revise_section"
  | "qna"
  | "add_exhibit"
  | "insert_standard_clause"
  | "add_termination"
  | "add_compliance"
  | "add_fee_schedule"
  | "summarize"
  | "highlight_missing"
  | "generate_payment"
  | "outline"
  | "compare_versions"
  | "export_doc"
  | "guided_confirm"
  | "unknown";

function classifyIntent(text: string): Intent {
  const l = text.toLowerCase().trim();
  if (l.startsWith("/outline")) return "outline";
  if (l.startsWith("/add section")) return "add_section";
  if (l.startsWith("/revise section")) return "revise_section";
  if (l.startsWith("/insert clause")) return "insert_standard_clause";
  if (l.startsWith("/compare versions")) return "compare_versions";
  if (l.startsWith("/export")) return "export_doc";
  if (l.includes("draft full contract") || l.includes("draft contract from inputs") || l.includes("generate full")) return "draft_full_contract";
  if (l.includes("generate payment") || l.includes("payment & rate") || l.includes("payment section")) return "generate_payment";
  if (l.includes("termination clause") || l.includes("add termination")) return "add_termination";
  if (l.includes("compliance") || l.includes("hipaa") || l.includes("regulatory clause")) return "add_compliance";
  if (l.includes("fee schedule") || l.includes("exhibit a")) return "add_fee_schedule";
  if (l.includes("summarize") || l.includes("summary for legal")) return "summarize";
  if (l.includes("missing") || l.includes("highlight missing")) return "highlight_missing";
  if (l.includes("insert") && l.includes("clause")) return "insert_standard_clause";
  if (l.includes("add section") || l.includes("new section")) return "add_section";
  if (l.includes("revise") || l.includes("rewrite") || l.includes("update section")) return "revise_section";
  if (l.includes("add exhibit")) return "add_exhibit";
  if (l.includes("rate escalator") || l.includes("effective date") || l.includes("where is") || l.includes("what is") || l.includes("does this") || l.includes("compare with")) return "qna";
  if (l === "yes" || l === "confirm" || l === "looks good" || l === "approved" || l === "next" || l === "continue") return "guided_confirm";
  return "unknown";
}

// ─── Checklist items ───
export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export function computeChecklist(doc: ContractDraftDocument | null): ChecklistItem[] {
  const items: ChecklistItem[] = [
    { id: "parties", label: "Parties defined", done: false },
    { id: "term", label: "Term added", done: false },
    { id: "scope", label: "Scope added", done: false },
    { id: "payment", label: "Payment terms added", done: false },
    { id: "exhibits", label: "Exhibits referenced", done: false },
    { id: "signature", label: "Signature blocks present", done: false },
    { id: "termination", label: "Termination clause", done: false },
    { id: "compliance", label: "Compliance section", done: false },
  ];
  if (!doc) return items;
  const allText = doc.sections.map(s => s.title + " " + s.body).join(" ").toLowerCase();
  if (allText.includes("party a") || allText.includes("party b") || allText.includes("entered into")) items[0].done = true;
  if (allText.includes("term") && allText.includes("effective")) items[1].done = true;
  if (allText.includes("scope") || allText.includes("services")) items[2].done = true;
  if (allText.includes("payment") || allText.includes("reimbursement") || allText.includes("compensation")) items[3].done = true;
  if (doc.exhibits.length > 0) items[4].done = true;
  if (allText.includes("signature") || allText.includes("witness whereof")) items[5].done = true;
  if (allText.includes("termination") || allText.includes("terminate")) items[6].done = true;
  if (allText.includes("compliance") || allText.includes("hipaa") || allText.includes("regulatory")) items[7].done = true;
  return items;
}

// ─── Guided interview steps ───
export interface GuidedStep {
  id: string;
  question: string;
  field: string;
  completed: boolean;
}

export const guidedSteps: GuidedStep[] = [
  { id: "g1", question: "Let's start by confirming the contracting parties. Who is Party A (Plan) and Party B (Provider)?", field: "parties", completed: false },
  { id: "g2", question: "What type of contract is this? (Facility / Professional / Ancillary)", field: "contractType", completed: false },
  { id: "g3", question: "Which products/lines of business should be covered? (Commercial / Medicare Advantage / Medicaid)", field: "products", completed: false },
  { id: "g4", question: "Please describe the services scope — specialties, locations, and service types.", field: "servicesScope", completed: false },
  { id: "g5", question: "What payment model should we use? (FFS, % of Medicare, Case Rate, Per Diem)", field: "paymentModel", completed: false },
  { id: "g6", question: "Should we include rate escalator terms? If yes, specify percentage, schedule, and effective date.", field: "escalator", completed: false },
  { id: "g7", question: "What termination notice period? (30 / 60 / 90 / 180 days)", field: "termination", completed: false },
  { id: "g8", question: "Which exhibits should be required? (Fee Schedule, Quality Reporting, BAA, Service Area)", field: "exhibits", completed: false },
  { id: "g9", question: "Who needs to sign? Specify signature roles (e.g., VP Network, Medical Director, Provider CEO).", field: "signatures", completed: false },
];

// ─── Process message ───
export interface CoAuthorResponse {
  message: CoAuthorMessage;
  updatedSections?: ContractDocSection[];
  updatedExhibits?: ExhibitRef[];
  newDefinitions?: DefinitionTerm[];
  newMissingFields?: MissingField[];
}

export function processCoAuthorMessage(
  userText: string,
  draftId: string,
  currentDoc: ContractDraftDocument | null,
  standardClauses: StandardClause[],
  formData: { name: string; parties: string; effectiveDate: string; term: string; paymentRate: string; servicesScope: string },
): CoAuthorResponse {
  const intent = classifyIntent(userText);
  const msgId = `coauthor-${Date.now()}`;
  const time = new Date().toISOString();

  switch (intent) {
    case "draft_full_contract":
      return handleDraftFull(msgId, draftId, time, formData, currentDoc);
    case "generate_payment":
      return handleGeneratePayment(msgId, draftId, time, formData, currentDoc);
    case "add_termination":
      return handleAddTermination(msgId, draftId, time, currentDoc);
    case "add_compliance":
      return handleAddCompliance(msgId, draftId, time, currentDoc);
    case "add_fee_schedule":
      return handleAddExhibit(msgId, draftId, time, currentDoc);
    case "summarize":
      return handleSummarize(msgId, draftId, time, currentDoc);
    case "highlight_missing":
      return handleHighlightMissing(msgId, draftId, time, currentDoc);
    case "insert_standard_clause":
      return handleInsertStandardClause(msgId, draftId, time, userText, standardClauses, currentDoc);
    case "add_section": {
      const titleMatch = userText.match(/section[:\s]+["']?(.+?)["']?\s*$/i) || userText.match(/\/add section[:\s]+(.+)/i);
      const title = titleMatch?.[1] || "New Section";
      return handleAddSection(msgId, draftId, time, title, currentDoc);
    }
    case "revise_section": {
      const refMatch = userText.match(/section[:\s]+["']?(.+?)["']?\s*$/i) || userText.match(/\/revise section[:\s]+(.+)/i);
      const ref = refMatch?.[1] || "";
      return handleReviseSection(msgId, draftId, time, ref, currentDoc);
    }
    case "outline":
      return handleOutline(msgId, draftId, time, currentDoc);
    case "compare_versions":
      return handleCompareVersions(msgId, draftId, time);
    case "export_doc":
      return handleExport(msgId, draftId, time);
    case "qna":
      return handleQnA(msgId, draftId, time, userText, currentDoc);
    case "add_exhibit":
      return handleAddExhibit(msgId, draftId, time, currentDoc);
    case "guided_confirm":
      return {
        message: {
          id: msgId, draftId, role: "assistant", time,
          text: "Great! I've noted your confirmation. Let's proceed to the next step. What would you like to work on next?",
        },
      };
    default:
      return handleUnknown(msgId, draftId, time, userText, currentDoc);
  }
}

// ─── Handlers ───

function handleDraftFull(
  msgId: string, draftId: string, time: string,
  formData: { name: string; parties: string; effectiveDate: string; term: string; paymentRate: string; servicesScope: string },
  currentDoc: ContractDraftDocument | null,
): CoAuthorResponse {
  const partiesParts = formData.parties.split(/[,&]/).map(s => s.trim()).filter(Boolean);
  const partyA = partiesParts[0] || "United HealthCare Services, Inc.";
  const partyB = partiesParts[1] || "Provider Organization";

  const sections: ContractDocSection[] = [
    { id: "ca-1", order: 1, headingNumber: "1.0", title: "PARTIES AND DEFINITIONS", body: `This Provider Services Agreement is entered into by and between:\n\n**Party A:** ${partyA} ("Plan")\n**Party B:** ${partyB} ("Provider")\n\nDefinitions:\n- "Covered Services" – health care services covered under a Member's benefit plan.\n- "Member" – an individual enrolled in a health benefit plan.\n- "Clean Claim" – a claim with no defect, including all required information.` },
    { id: "ca-2", order: 2, headingNumber: "2.0", title: "EFFECTIVE DATE AND TERM", body: `**Effective Date:** ${formData.effectiveDate || "01/01/2025"}\n**Term:** ${formData.term || "Three (3) years"} with automatic annual renewal unless either party provides 180 days written notice.` },
    { id: "ca-3", order: 3, headingNumber: "3.0", title: "SCOPE OF SERVICES", body: `${formData.servicesScope || "Provider shall deliver all medically necessary Covered Services to eligible Members."}` },
    { id: "ca-4", order: 4, headingNumber: "4.0", title: "COMPENSATION AND PAYMENT TERMS", body: `${formData.paymentRate || "Plan shall reimburse Provider per the Fee Schedule (Exhibit A)."}\n\nClean Claims processed within 30 calendar days. Annual CPI-U adjustments effective January 1.` },
    { id: "ca-5", order: 5, headingNumber: "5.0", title: "CONFIDENTIALITY AND HIPAA", body: "Both parties shall comply with HIPAA Privacy and Security Rules. PHI encrypted using AES-256 at rest and in transit." },
    { id: "ca-6", order: 6, headingNumber: "6.0", title: "COMPLIANCE AND REGULATORY", body: "Both parties shall comply with all applicable federal and state regulations. Provider shall maintain FWA compliance program." },
    { id: "ca-7", order: 7, headingNumber: "7.0", title: "TERMINATION", body: "Either party may terminate without cause with 180 days notice. Termination for cause requires 60 days notice with 30-day cure period. Continuity of care for 90 days post-termination." },
    { id: "ca-8", order: 8, headingNumber: "8.0", title: "DISPUTE RESOLUTION", body: "Progressive escalation: Negotiation (30 days) → Mediation (60 days) → Binding arbitration under AAA rules. Costs shared equally." },
    { id: "ca-9", order: 9, headingNumber: "9.0", title: "SIGNATURE", body: `IN WITNESS WHEREOF:\n\n**${partyA}**\nBy: ___________________ Date: ___________\n\n**${partyB}**\nBy: ___________________ Date: ___________` },
  ];

  const exhibits: ExhibitRef[] = [
    { id: "ex-a", name: "Exhibit A – Fee Schedule", description: "Reimbursement rates for Covered Services", required: true },
    { id: "ex-b", name: "Exhibit B – Service Area", description: "Geographic service area definition", required: true },
    { id: "ex-d", name: "Exhibit D – BAA", description: "HIPAA Business Associate Agreement", required: true },
  ];

  const citations: Citation[] = sections.map((s, i) => ({
    refType: "ContractDraft" as const,
    sectionRef: s.headingNumber,
    pageRef: pageForSection(i + 1),
  }));

  const actions: CoAuthorAction[] = sections.map(s => ({
    type: "add_section" as const,
    sectionRef: s.headingNumber,
    title: s.title,
    body: s.body,
  }));

  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: `I've drafted a complete Provider Services Agreement with ${sections.length} sections and ${exhibits.length} exhibits based on your inputs.\n\n**Sections created:**\n${sections.map(s => `• ${s.headingNumber} ${s.title}`).join("\n")}\n\n**Exhibits:**\n${exhibits.map(e => `• ${e.name}`).join("\n")}\n\nReview the draft below and let me know if you'd like to modify any section.`,
      actions,
      citations,
    },
    updatedSections: sections,
    updatedExhibits: exhibits,
  };
}

function handleGeneratePayment(
  msgId: string, draftId: string, time: string,
  formData: { paymentRate: string },
  currentDoc: ContractDraftDocument | null,
): CoAuthorResponse {
  const paymentBody = `**4.1 Reimbursement.** ${formData.paymentRate || "Plan shall reimburse Provider based on 110% of Medicare Fee Schedule."}\n\n**4.2 Claims Submission.** Provider shall submit Clean Claims within 90 days of service date.\n\n**4.3 Payment Timeline.** Clean Claims paid within 30 calendar days. Contested claims resolved within 60 calendar days.\n\n**4.4 Rate Escalator.** Annual CPI-U adjustment effective January 1 of each year.\n\n**4.5 Coordination of Benefits.** Provider shall cooperate with Plan for COB with other payors.`;

  const action: CoAuthorAction = {
    type: "update_section",
    sectionRef: "4.0",
    title: "COMPENSATION AND PAYMENT TERMS",
    body: paymentBody,
  };

  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: `I've generated a detailed Payment & Rate section covering reimbursement methodology, claims timeline, rate escalator, and COB provisions.\n\nKey terms:\n• Claims: 30 calendar days for clean claims\n• Escalator: Annual CPI-U adjustment\n• Submission window: 90 days from date of service`,
      actions: [action],
      citations: [{ refType: "ContractDraft", sectionRef: "4.0", pageRef: pageForSection(4) }],
    },
    updatedSections: currentDoc ? currentDoc.sections.map(s =>
      s.headingNumber === "4.0" ? { ...s, body: paymentBody } : s
    ) : undefined,
  };
}

function handleAddTermination(
  msgId: string, draftId: string, time: string,
  currentDoc: ContractDraftDocument | null,
): CoAuthorResponse {
  const body = "**7.1 Termination Without Cause.** Either party may terminate this Agreement without cause by providing one hundred eighty (180) days written notice.\n\n**7.2 Termination For Cause.** Either party may terminate for material breach with sixty (60) days written notice, provided the breaching party fails to cure within thirty (30) days.\n\n**7.3 Immediate Termination.** Plan may terminate immediately upon: (a) loss of Provider's license; (b) exclusion from federal programs; (c) fraud or criminal activity.\n\n**7.4 Continuity of Care.** Upon termination, Provider shall continue services to Members with ongoing treatment for up to ninety (90) days.";

  const action: CoAuthorAction = {
    type: "insert_clause",
    sectionRef: "7.0",
    title: "TERMINATION",
    body,
  };

  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: "I've added a comprehensive Termination clause covering:\n• Without Cause: 180 days written notice\n• For Cause: 60 days with 30-day cure period\n• Immediate: license loss, federal exclusion, fraud\n• Continuity of Care: 90-day transition period",
      actions: [action],
      citations: [{ refType: "ContractDraft", sectionRef: "7.0", pageRef: pageForSection(7) }],
    },
    updatedSections: currentDoc ? upsertSection(currentDoc.sections, "7.0", "TERMINATION", body) : undefined,
  };
}

function handleAddCompliance(
  msgId: string, draftId: string, time: string,
  currentDoc: ContractDraftDocument | null,
): CoAuthorResponse {
  const body = "**6.1 Legal Compliance.** Both parties shall comply with all applicable federal, state, and local laws governing health care services.\n\n**6.2 HIPAA.** All Protected Health Information (PHI) shall be handled in accordance with HIPAA Privacy and Security Rules. PHI encrypted at rest and in transit using AES-256.\n\n**6.3 Fraud, Waste, and Abuse.** Provider shall maintain an active FWA compliance program.\n\n**6.4 Audits.** Plan may audit Provider's records upon reasonable notice.\n\n**6.5 Credentialing.** Provider shall maintain all credentials per NCQA standards.";

  const action: CoAuthorAction = {
    type: "insert_clause",
    sectionRef: "6.0",
    title: "COMPLIANCE AND REGULATORY",
    body,
  };

  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: "I've added a Compliance (HIPAA/Regulatory) clause covering:\n• Legal compliance with all applicable laws\n• HIPAA Privacy & Security (AES-256 encryption)\n• FWA compliance program\n• Audit rights\n• Credentialing (NCQA standards)",
      actions: [action],
      citations: [{ refType: "ContractDraft", sectionRef: "6.0", pageRef: pageForSection(6) }],
    },
    updatedSections: currentDoc ? upsertSection(currentDoc.sections, "6.0", "COMPLIANCE AND REGULATORY", body) : undefined,
  };
}

function handleAddExhibit(
  msgId: string, draftId: string, time: string,
  currentDoc: ContractDraftDocument | null,
): CoAuthorResponse {
  const newExhibit: ExhibitRef = {
    id: `ex-${Date.now()}`,
    name: "Exhibit A – Fee Schedule",
    description: "Comprehensive fee schedule with reimbursement rates for all Covered Services, including CPT/HCPCS codes and associated rates",
    required: true,
  };

  const updatedExhibits = currentDoc ? [...currentDoc.exhibits] : [];
  if (!updatedExhibits.find(e => e.name.includes("Fee Schedule"))) {
    updatedExhibits.push(newExhibit);
  }

  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: "I've added Exhibit A – Fee Schedule reference to the contract. This exhibit will contain the comprehensive reimbursement rates for all Covered Services.\n\nThe Fee Schedule reference is now linked from Section 4.0 (Compensation and Payment Terms).",
      actions: [{ type: "add_exhibit", exhibitName: newExhibit.name, exhibitDescription: newExhibit.description }],
      citations: [{ refType: "ContractDraft", sectionRef: "Exhibits", pageRef: pageForSection(currentDoc?.sections.length || 10) }],
    },
    updatedExhibits,
  };
}

function handleSummarize(
  msgId: string, draftId: string, time: string,
  currentDoc: ContractDraftDocument | null,
): CoAuthorResponse {
  if (!currentDoc || currentDoc.sections.length === 0) {
    return {
      message: { id: msgId, draftId, role: "assistant", time, text: "No draft content to summarize yet. Please generate or add sections first." },
    };
  }

  const sectionList = currentDoc.sections.map(s => `• **${s.headingNumber} ${s.title}**`).join("\n");
  const exhibitList = currentDoc.exhibits.map(e => `• ${e.name}`).join("\n");

  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: `**Executive Summary for Legal Review**\n\n**Contract:** ${currentDoc.title}\n**Parties:** ${currentDoc.parties.partyA} and ${currentDoc.parties.partyB}\n**Effective Date:** ${currentDoc.effectiveDate}\n**Term:** ${currentDoc.term}\n\n**Sections (${currentDoc.sections.length}):**\n${sectionList}\n\n**Exhibits (${currentDoc.exhibits.length}):**\n${exhibitList}\n\n**Version:** ${currentDoc.version}\n**Last Generated:** ${new Date(currentDoc.lastGeneratedAt).toLocaleString()}`,
      citations: currentDoc.sections.map((s, i) => ({
        refType: "ContractDraft" as const,
        sectionRef: s.headingNumber,
        pageRef: pageForSection(i + 1),
      })),
    },
  };
}

function handleHighlightMissing(
  msgId: string, draftId: string, time: string,
  currentDoc: ContractDraftDocument | null,
): CoAuthorResponse {
  const checklist = computeChecklist(currentDoc);
  const missing = checklist.filter(c => !c.done);

  if (missing.length === 0) {
    return {
      message: { id: msgId, draftId, role: "assistant", time, text: "All key sections are present in the draft. The contract appears complete. Consider a final legal review." },
    };
  }

  const missingFields: MissingField[] = missing.map(m => ({
    id: `mf-${m.id}`,
    fieldKey: m.id,
    reason: `${m.label} is missing from the current draft`,
    suggestedPrompt: `Add ${m.label.toLowerCase()} to the contract`,
  }));

  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: `**Missing Information Detected:**\n\n${missing.map(m => `⚠️ ${m.label}`).join("\n")}\n\nClick any suggestion below to add the missing content, or ask me to draft specific sections.`,
      actions: missing.map(m => ({
        type: "mark_missing_field" as const,
        fieldKey: m.id,
        reason: `${m.label} is missing`,
      })),
    },
    newMissingFields: missingFields,
  };
}

function handleInsertStandardClause(
  msgId: string, draftId: string, time: string,
  userText: string,
  standardClauses: StandardClause[],
  currentDoc: ContractDraftDocument | null,
): CoAuthorResponse {
  const lower = userText.toLowerCase();
  const keywords = ["termination", "compliance", "claims", "quality", "privacy", "network", "grievance", "dispute", "scope", "term", "services", "reimbursement", "rate"];
  const matchedKeyword = keywords.find(k => lower.includes(k));

  const matched = matchedKeyword
    ? standardClauses.find(c => c.clauseName.toLowerCase().includes(matchedKeyword) || c.tags.some(t => t.toLowerCase().includes(matchedKeyword)))
    : null;

  if (matched) {
    const nextOrder = currentDoc ? Math.max(...currentDoc.sections.map(s => s.order), 0) + 1 : 1;
    const newSection: ContractDocSection = {
      id: `sec-std-${matched.id}`,
      order: nextOrder,
      headingNumber: `${nextOrder}.0`,
      title: matched.clauseName.toUpperCase(),
      body: matched.text,
    };

    return {
      message: {
        id: msgId, draftId, role: "assistant", time,
        text: `I've inserted the standard clause **"${matched.clauseName}"** from the clause library.\n\n**Article:** ${matched.articleName}\n**Tags:** ${matched.tags.join(", ")}\n\nThe clause has been added as Section ${newSection.headingNumber}. You can edit it in the document preview.`,
        actions: [{ type: "insert_clause", sectionRef: newSection.headingNumber, title: newSection.title, body: newSection.body }],
        citations: [{ refType: "ContractDraft", sectionRef: newSection.headingNumber, pageRef: pageForSection(nextOrder) }],
      },
      updatedSections: currentDoc ? [...currentDoc.sections, newSection] : [newSection],
    };
  }

  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: `I couldn't find a matching standard clause for "${userText}". Available clauses:\n${standardClauses.map(c => `• ${c.clauseName} (${c.tags.join(", ")})`).join("\n")}\n\nTry specifying one of the clause names above, or use the "Insert from Library" button.`,
    },
  };
}

function handleAddSection(
  msgId: string, draftId: string, time: string,
  title: string,
  currentDoc: ContractDraftDocument | null,
): CoAuthorResponse {
  const nextOrder = currentDoc ? Math.max(...currentDoc.sections.map(s => s.order), 0) + 1 : 1;
  const section: ContractDocSection = {
    id: `sec-custom-${Date.now()}`,
    order: nextOrder,
    headingNumber: `${nextOrder}.0`,
    title: title.toUpperCase(),
    body: `[Draft content for ${title}. Please provide details or ask the agent to generate content for this section.]`,
  };

  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: `I've added a new section **"${section.headingNumber} ${title}"** to the draft. The section contains placeholder text — please provide more details and I'll generate the full content.`,
      actions: [{ type: "add_section", sectionRef: section.headingNumber, title: section.title, body: section.body }],
      citations: [{ refType: "ContractDraft", sectionRef: section.headingNumber, pageRef: pageForSection(nextOrder) }],
    },
    updatedSections: currentDoc ? [...currentDoc.sections, section] : [section],
  };
}

function handleReviseSection(
  msgId: string, draftId: string, time: string,
  ref: string,
  currentDoc: ContractDraftDocument | null,
): CoAuthorResponse {
  if (!currentDoc) {
    return { message: { id: msgId, draftId, role: "assistant", time, text: "No draft exists yet. Please generate a draft first." } };
  }

  const section = currentDoc.sections.find(s =>
    s.headingNumber.includes(ref) || s.title.toLowerCase().includes(ref.toLowerCase())
  );

  if (!section) {
    return {
      message: {
        id: msgId, draftId, role: "assistant", time,
        text: `I couldn't find a section matching "${ref}". Available sections:\n${currentDoc.sections.map(s => `• ${s.headingNumber} ${s.title}`).join("\n")}`,
      },
    };
  }

  const revisedBody = section.body
    .replace(/shall/g, "shall, in accordance with applicable law,")
    .replace(/Provider/g, "Provider (as defined herein)")
    .replace(/\./g, ".")
    + "\n\n[This section has been revised for formal legal language per your request.]";

  const action: CoAuthorAction = {
    type: "update_section",
    sectionRef: section.headingNumber,
    title: section.title,
    oldText: section.body,
    newText: revisedBody,
  };

  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: `I've revised Section ${section.headingNumber} "${section.title}" with more formal legal language. Review the changes in the diff card below.`,
      actions: [action],
      citations: [{ refType: "ContractDraft", sectionRef: section.headingNumber, pageRef: pageForSection(section.order) }],
    },
  };
}

function handleOutline(
  msgId: string, draftId: string, time: string,
  currentDoc: ContractDraftDocument | null,
): CoAuthorResponse {
  if (!currentDoc || currentDoc.sections.length === 0) {
    return { message: { id: msgId, draftId, role: "assistant", time, text: "No draft content available. Generate a draft first." } };
  }

  const outline = currentDoc.sections.map((s, i) => `${s.headingNumber} ${s.title} — ${pageForSection(i + 1)}`).join("\n");

  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: `**Table of Contents**\n\n${outline}\n\n**Exhibits:**\n${currentDoc.exhibits.map(e => `• ${e.name}`).join("\n") || "None"}`,
      citations: currentDoc.sections.map((s, i) => ({
        refType: "ContractDraft" as const,
        sectionRef: s.headingNumber,
        pageRef: pageForSection(i + 1),
      })),
    },
  };
}

function handleCompareVersions(msgId: string, draftId: string, time: string): CoAuthorResponse {
  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: "**Version Comparison Summary:**\n\nVersion history shows all changes made during this session. Each section modification creates a new version entry.\n\nUse the version indicator at the bottom of the document preview to track changes. Major actions that update versions:\n• Adding new sections\n• Modifying existing content\n• Inserting standard clauses\n• Applying suggested changes",
    },
  };
}

function handleExport(msgId: string, draftId: string, time: string): CoAuthorResponse {
  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: "To export the document, use the **Print / PDF** button in the document preview toolbar above. This will open a print dialog where you can save as PDF.\n\nYou can also use **Copy** to copy the full document text to clipboard, or **Send to Redlining** to push the draft into the redlining workflow.",
    },
  };
}

function handleQnA(
  msgId: string, draftId: string, time: string,
  userText: string,
  currentDoc: ContractDraftDocument | null,
): CoAuthorResponse {
  const lower = userText.toLowerCase();

  if (!currentDoc || currentDoc.sections.length === 0) {
    return { message: { id: msgId, draftId, role: "assistant", time, text: "No draft content available to query. Please generate a draft first." } };
  }

  // Search draft sections for relevant content
  for (let i = 0; i < currentDoc.sections.length; i++) {
    const sec = currentDoc.sections[i];
    const secLower = (sec.title + " " + sec.body).toLowerCase();

    if (lower.includes("rate escalator") && (secLower.includes("escalator") || secLower.includes("cpi"))) {
      return {
        message: {
          id: msgId, draftId, role: "assistant", time,
          text: `The rate escalator is defined in Section ${sec.headingNumber} "${sec.title}". The draft specifies annual CPI-U adjustments effective January 1 of each year.`,
          citations: [{ refType: "ContractDraft", sectionRef: sec.headingNumber, pageRef: pageForSection(i + 1) }],
        },
      };
    }
    if (lower.includes("termination") && secLower.includes("terminat")) {
      return {
        message: {
          id: msgId, draftId, role: "assistant", time,
          text: `Termination is addressed in Section ${sec.headingNumber} "${sec.title}". It covers without-cause termination (180 days notice), for-cause termination (60 days with cure period), and continuity of care provisions.`,
          citations: [{ refType: "ContractDraft", sectionRef: sec.headingNumber, pageRef: pageForSection(i + 1) }],
        },
      };
    }
    if ((lower.includes("orthopedic") || lower.includes("services") || lower.includes("scope")) && secLower.includes("service")) {
      return {
        message: {
          id: msgId, draftId, role: "assistant", time,
          text: `Services scope is defined in Section ${sec.headingNumber} "${sec.title}". The section covers: ${sec.body.substring(0, 200)}...`,
          citations: [{ refType: "ContractDraft", sectionRef: sec.headingNumber, pageRef: pageForSection(i + 1) }],
        },
      };
    }
    if (lower.includes("effective date") && secLower.includes("effective")) {
      return {
        message: {
          id: msgId, draftId, role: "assistant", time,
          text: `The effective date is specified in Section ${sec.headingNumber} "${sec.title}". Effective Date: ${currentDoc.effectiveDate}. Term: ${currentDoc.term}.`,
          citations: [{ refType: "ContractDraft", sectionRef: sec.headingNumber, pageRef: pageForSection(i + 1) }],
        },
      };
    }
  }

  // Compare with uploaded
  if (lower.includes("compare with uploaded") || lower.includes("compare with original")) {
    return {
      message: {
        id: msgId, draftId, role: "assistant", time,
        text: "**Cross-Reference Comparison:**\n\nThe current draft has been generated from your inputs. To compare with an uploaded contract:\n1. Navigate to Upload Contract to process the original\n2. Return here and ask about specific sections\n\nI'll cite both the draft and uploaded document sections for comparison.",
        citations: [
          { refType: "ContractDraft", sectionRef: "1.0", pageRef: "Page 1" },
          { refType: "UploadedDoc", sectionRef: "1.0", pageRef: "Page 1" },
        ],
      },
    };
  }

  // General fallback
  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: `Based on the current draft (${currentDoc.sections.length} sections), I can help with:\n• Section-specific questions (e.g., "What is the termination notice?")\n• Rate and payment queries\n• Service scope details\n• Compliance requirements\n\nTry asking about a specific topic or use quick prompts above.`,
    },
  };
}

function handleUnknown(
  msgId: string, draftId: string, time: string,
  userText: string,
  currentDoc: ContractDraftDocument | null,
): CoAuthorResponse {
  return {
    message: {
      id: msgId, draftId, role: "assistant", time,
      text: `I understand you're asking about: "${userText}"\n\nI can help with:\n• **Draft full contract** from form inputs\n• **Add/modify sections** (termination, compliance, payment)\n• **Insert standard clauses** from the library\n• **Q&A** about the current draft with citations\n• **Slash commands:** /outline, /add section, /revise section, /insert clause, /compare versions, /export doc\n\nWhat would you like to do?`,
    },
  };
}

// ─── Utility ───
function upsertSection(sections: ContractDocSection[], headingNumber: string, title: string, body: string): ContractDocSection[] {
  const idx = sections.findIndex(s => s.headingNumber === headingNumber);
  if (idx >= 0) {
    return sections.map((s, i) => i === idx ? { ...s, title, body } : s);
  }
  const nextOrder = Math.max(...sections.map(s => s.order), 0) + 1;
  return [...sections, { id: `sec-${Date.now()}`, order: nextOrder, headingNumber, title, body }];
}
