import type { RateScheduleTable } from "@/types";

export const defaultRateScheduleTable: RateScheduleTable = {
  headers: ["Section", "Channel", "Drug Type", "AWP Discount (%)", "Dispensing Fee ($)", "Notes"],
  rows: [
    { section: "Contract Term", cells: ["Year 1", "", "", "", "", "07/01/22 to 06/30/23"] },
    { section: "Contract Term", cells: ["Year 2", "", "", "", "", "07/01/23 to 06/30/24"] },
    { section: "Contract Term", cells: ["Year 3", "", "", "", "", "07/01/24 to 06/30/25"] },

    { section: "Base Administrative Fees", cells: ["Retail 30", "", "", "", "", "$0.00 per net paid claim"] },
    { section: "Base Administrative Fees", cells: ["Retail 90", "", "", "", "", "$0.00 per net paid claim"] },
    { section: "Base Administrative Fees", cells: ["Mail Service", "", "", "", "", "$0.00 per net paid claim"] },
    { section: "Base Administrative Fees", cells: ["Specialty", "", "", "", "", "$0.00 per net paid claim"] },

    { section: "Broker Fee and Paper Claim Fee", cells: ["Broker Fee", "", "", "", "", "$5.33 PEPM"] },
    { section: "Broker Fee and Paper Claim Fee", cells: ["Paper Claim Fee", "", "", "", "", "$2.50 per processed paper claim"] },

    { section: "AWP-based Pricing", cells: ["Retail 30", "Brand", 18.0, 1.75, "", "AWP minus 18.0%"] },
    { section: "AWP-based Pricing", cells: ["Retail 30", "Generic", 82.0, 1.75, "", "AWP minus 82.0%"] },
    { section: "AWP-based Pricing", cells: ["Retail 90", "Brand", 20.0, 0.00, "", "AWP minus 20.0%"] },
    { section: "AWP-based Pricing", cells: ["Retail 90", "Generic", 84.0, 0.00, "", "AWP minus 84.0%"] },
    { section: "AWP-based Pricing", cells: ["Mail", "Brand", 22.0, 0.00, "", "AWP minus 22.0%"] },
    { section: "AWP-based Pricing", cells: ["Mail", "Generic", 85.0, 0.00, "", "AWP minus 85.0%"] },
    { section: "AWP-based Pricing", cells: ["Specialty", "Brand (aggregate)", 20.0, 0.00, "", "AWP minus 20.0%"] },
    { section: "AWP-based Pricing", cells: ["Specialty", "Generic (aggregate)", 14.0, 0.00, "", "AWP minus 14.0%"] },

    { section: "Client Rebate Share (Brand Only)", cells: ["Retail 30", "Brand", "", "", "", "$150.00 per net paid brand claim"] },
    { section: "Client Rebate Share (Brand Only)", cells: ["Retail 90", "Brand", "", "", "", "$450.00 per net paid brand claim"] },
    { section: "Client Rebate Share (Brand Only)", cells: ["Mail", "Brand", "", "", "", "$450.00 per net paid brand claim"] },
    { section: "Client Rebate Share (Brand Only)", cells: ["Specialty", "Brand", "", "", "", "$1,200.00 per net paid brand claim"] },

    { section: "Example Brand Drugs (metadata only)", cells: ["Retail 30", "Brand", "", "", "", "Examples: Lipitor"] },
    { section: "Example Brand Drugs (metadata only)", cells: ["Specialty", "Brand", "", "", "", "Examples: Humira, Enbrel, Keytruda"] },
  ],
};
