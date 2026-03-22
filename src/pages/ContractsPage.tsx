import { Routes, Route } from "react-router-dom";
import ContractsOverviewTab from "./ContractsOverviewTab";
import DigitizationPage from "./DigitizationPage";
import ContractCreationWithOverview from "./ContractCreationWithOverview";

export default function ContractsPage() {
  return (
    <div className="page-container">
      <Routes>
        <Route index element={<ContractsOverviewTab />} />
        <Route path="digitize" element={<DigitizationPage />} />
        <Route path="newgen" element={<ContractCreationWithOverview />} />
      </Routes>
    </div>
  );
}
