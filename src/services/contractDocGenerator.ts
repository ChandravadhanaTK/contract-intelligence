import type { ContractDraftDocument, ContractDocSection, ExhibitRef } from "@/types";

interface GenerateInput {
  contractId: string;
  name: string;
  parties: string;
  effectiveDate: string;
  term: string;
  paymentRate: string;
  servicesScope: string;
}

export function generateOptumStandardContractDoc(input: GenerateInput): ContractDraftDocument {
  const partiesParts = input.parties.split(/[,&]/).map(s => s.trim()).filter(Boolean);
  const partyA = partiesParts[0] || "United HealthCare Services, Inc.";
  const partyB = partiesParts[1] || "Provider Organization";

  const effDate = input.effectiveDate || "01/01/2025";
  const termText = input.term || "Three (3) years";

  const sections: ContractDocSection[] = [
    {
      id: "sec-1", order: 1, headingNumber: "1.0", title: "PARTIES AND DEFINITIONS",
      body: `This Provider Services Agreement ("Agreement") is entered into by and between:\n\n**Party A:** ${partyA} ("Plan")\n**Party B:** ${partyB} ("Provider")\n\n**Definitions:**\n- "Covered Services" means those health care services and supplies that are covered under a Member's benefit plan.\n- "Member" means an individual enrolled in a health benefit plan administered by Plan.\n- "Service Area" means the geographic area in which Provider is authorized to render Covered Services.\n- "Clean Claim" means a claim that has no defect or impropriety and includes all required information.\n- "Fee Schedule" means the schedule of reimbursement rates attached as Exhibit A.`
    },
    {
      id: "sec-2", order: 2, headingNumber: "2.0", title: "EFFECTIVE DATE AND TERM",
      body: `**2.1 Effective Date.** This Agreement shall become effective as of ${effDate} ("Effective Date").\n\n**2.2 Term.** The initial term of this Agreement shall be ${termText} from the Effective Date ("Initial Term").\n\n**2.3 Renewal.** Following the Initial Term, this Agreement shall automatically renew for successive one (1) year periods ("Renewal Terms") unless either party provides written notice of non-renewal at least one hundred eighty (180) days prior to the expiration of the then-current term.`
    },
    {
      id: "sec-3", order: 3, headingNumber: "3.0", title: "SCOPE OF SERVICES",
      body: `**3.1 Services.** ${input.servicesScope || "Provider shall deliver all medically necessary Covered Services to eligible Members in accordance with this Agreement, applicable law, and accepted standards of medical practice."}\n\n**3.2 Service Area.** Provider shall render services within the designated Service Area as identified in Exhibit B.\n\n**3.3 Referrals.** Provider shall make referrals for specialty care in accordance with Plan's referral policies and procedures.\n\n**3.4 Medical Records.** Provider shall maintain complete and accurate medical records for all services rendered to Members.`
    },
    {
      id: "sec-4", order: 4, headingNumber: "4.0", title: "COMPENSATION AND PAYMENT TERMS",
      body: `**4.1 Reimbursement.** ${input.paymentRate || "Plan shall reimburse Provider for Covered Services rendered to Members in accordance with the Fee Schedule attached as Exhibit A."}\n\n**4.2 Claims Submission.** Provider shall submit Clean Claims within ninety (90) days of the date of service.\n\n**4.3 Payment Timeline.** Plan shall process and pay Clean Claims within thirty (30) calendar days of receipt. Contested claims shall be resolved within sixty (60) calendar days.\n\n**4.4 Rate Adjustments.** Reimbursement rates shall be subject to annual adjustment based on the Consumer Price Index (CPI-U), effective January 1 of each year.\n\n**4.5 Coordination of Benefits.** Provider shall cooperate with Plan in the coordination of benefits with other payors.`
    },
    {
      id: "sec-5", order: 5, headingNumber: "5.0", title: "CONFIDENTIALITY AND DATA PROTECTION",
      body: `**5.1 Confidential Information.** Each party shall maintain the confidentiality of all non-public information received from the other party.\n\n**5.2 HIPAA Compliance.** Both parties shall comply with the Health Insurance Portability and Accountability Act of 1996 (HIPAA), including the Privacy Rule, Security Rule, and Breach Notification Rule.\n\n**5.3 PHI Protection.** All Protected Health Information (PHI) shall be encrypted at rest and in transit using AES-256 encryption standards.\n\n**5.4 Business Associate Agreement.** The parties shall execute a Business Associate Agreement as required under HIPAA, attached hereto as Exhibit D.`
    },
    {
      id: "sec-6", order: 6, headingNumber: "6.0", title: "COMPLIANCE AND REGULATORY",
      body: `**6.1 Legal Compliance.** Both parties shall comply with all applicable federal, state, and local laws and regulations governing the provision of health care services.\n\n**6.2 Fraud, Waste, and Abuse.** Provider shall maintain a compliance program to detect, prevent, and report fraud, waste, and abuse.\n\n**6.3 Audits.** Plan shall have the right to audit Provider's records and facilities upon reasonable notice to verify compliance with this Agreement.\n\n**6.4 Credentialing.** Provider shall maintain all required credentials, licenses, and certifications in good standing throughout the term of this Agreement.`
    },
    {
      id: "sec-7", order: 7, headingNumber: "7.0", title: "TERMINATION",
      body: `**7.1 Termination Without Cause.** Either party may terminate this Agreement without cause by providing one hundred eighty (180) days written notice.\n\n**7.2 Termination For Cause.** Either party may terminate for material breach with sixty (60) days written notice, provided the breaching party fails to cure within thirty (30) days.\n\n**7.3 Immediate Termination.** Plan may terminate immediately upon: (a) loss of Provider's license; (b) exclusion from federal programs; (c) fraud or criminal activity.\n\n**7.4 Continuity of Care.** Upon termination, Provider shall continue to provide services to Members with ongoing treatment for up to ninety (90) days.`
    },
    {
      id: "sec-8", order: 8, headingNumber: "8.0", title: "NOTICES",
      body: `**8.1** All notices required under this Agreement shall be in writing and delivered by certified mail, return receipt requested, or by nationally recognized overnight courier.\n\n**To Plan:**\nUnited HealthCare Services, Inc.\nAttn: Contract Administration\n9900 Bren Road East\nMinnetonka, MN 55343\n\n**To Provider:**\n${partyB}\n[Address to be provided]`
    },
    {
      id: "sec-9", order: 9, headingNumber: "9.0", title: "AMENDMENT",
      body: `**9.1** This Agreement may be amended only by written instrument signed by both parties.\n\n**9.2** Plan may modify policies, procedures, and fee schedules upon ninety (90) days written notice to Provider. Provider's continued participation after the effective date of such modification shall constitute acceptance.`
    },
    {
      id: "sec-10", order: 10, headingNumber: "10.0", title: "GOVERNING LAW AND DISPUTE RESOLUTION",
      body: `**10.1 Governing Law.** This Agreement shall be governed by and construed in accordance with the laws of the State of Minnesota.\n\n**10.2 Dispute Resolution.** Any dispute arising under this Agreement shall be resolved through the following progressive escalation:\n- Negotiation between designated representatives (30 days)\n- Mediation by a mutually agreed mediator (60 days)\n- Binding arbitration under AAA Commercial Rules\n\n**10.3 Costs.** Each party shall bear its own costs of dispute resolution; arbitration fees shall be shared equally.`
    },
    {
      id: "sec-11", order: 11, headingNumber: "11.0", title: "ASSIGNMENT AND DELEGATION",
      body: `**11.1** Neither party may assign this Agreement without the prior written consent of the other party.\n\n**11.2** Provider shall not delegate any material obligations under this Agreement to subcontractors without Plan's prior written approval.\n\n**11.3** Provider shall remain responsible for the performance of any delegated obligations.`
    },
    {
      id: "sec-12", order: 12, headingNumber: "12.0", title: "INDEMNIFICATION AND LIABILITY",
      body: `**12.1 Mutual Indemnification.** Each party shall indemnify and hold harmless the other party from claims arising from the indemnifying party's negligence or willful misconduct.\n\n**12.2 Limitation of Liability.** In no event shall either party be liable for indirect, incidental, consequential, or punitive damages.\n\n**12.3 Insurance.** Provider shall maintain professional liability insurance with minimum coverage of $1,000,000 per occurrence and $3,000,000 aggregate.`
    },
    {
      id: "sec-13", order: 13, headingNumber: "13.0", title: "NON-SOLICITATION",
      body: `**13.1** During the term and for twelve (12) months following termination, neither party shall directly solicit the employees of the other party who were involved in the performance of this Agreement.`
    },
    {
      id: "sec-14", order: 14, headingNumber: "14.0", title: "SIGNATURE",
      body: `IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.\n\n**${partyA}**\n\nBy: _________________________________\nName: _______________________________\nTitle: ________________________________\nDate: ________________________________\n\n\n**${partyB}**\n\nBy: _________________________________\nName: _______________________________\nTitle: ________________________________\nDate: ________________________________`
    },
  ];

  const exhibits: ExhibitRef[] = [
    { id: "ex-a", name: "Exhibit A – Fee Schedule", description: "Reimbursement rates and fee schedule for Covered Services", required: true },
    { id: "ex-b", name: "Exhibit B – Services & Service Area", description: "Detailed scope of services and geographic service area", required: true },
    { id: "ex-c", name: "Exhibit C – Reporting & Quality Measures", description: "Quality reporting requirements, HEDIS measures, and performance standards", required: true },
    { id: "ex-d", name: "Exhibit D – Business Associate Agreement", description: "HIPAA Business Associate Agreement", required: true },
  ];

  const renderedText = renderDocument(input.name, sections, exhibits);

  return {
    id: `doc-gen-${input.contractId}`,
    contractId: input.contractId,
    title: input.name || "Provider Services Agreement",
    parties: { partyA, partyB },
    effectiveDate: effDate,
    term: termText,
    servicesScope: input.servicesScope,
    paymentRateSection: input.paymentRate,
    sections,
    exhibits,
    renderedText,
    format: "markdown",
    lastGeneratedAt: new Date().toISOString(),
    version: 1,
  };
}

function renderDocument(title: string, sections: ContractDocSection[], exhibits: ExhibitRef[]): string {
  let text = `# PROVIDER SERVICES AGREEMENT\n\n## ${title || "Provider Services Agreement"}\n\n---\n\n`;
  for (const sec of sections) {
    text += `## ${sec.headingNumber} ${sec.title}\n\n${sec.body}\n\n---\n\n`;
  }
  text += `## EXHIBITS AND APPENDICES\n\n`;
  for (const ex of exhibits) {
    text += `- **${ex.name}**: ${ex.description}${ex.required ? " *(Required)*" : ""}\n`;
  }
  return text;
}
