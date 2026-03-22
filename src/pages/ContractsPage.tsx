import { useLocation } from "react-router-dom";
import ContractsOverviewTab from "./ContractsOverviewTab";
import DigitizationPage from "./DigitizationPage";
import ContractCreationWithOverview from "./ContractCreationWithOverview";
import { BackToPipelineBanner } from "@/components/BackToPipelineBanner";

export default function ContractsPage() {
  const location = useLocation();

  let content;
  if (location.pathname === "/contracts/digitize") {
    content = <DigitizationPage />;
  } else if (location.pathname === "/contracts/newgen") {
    content = <ContractCreationWithOverview />;
  } else {
    content = <ContractsOverviewTab />;
  }

  return <div className="page-container"><BackToPipelineBanner />{content}</div>;
}
