// file:App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Common Components
import ProtectedRoute from "./components/common/ProtectedRoute";

// Auth
import Login from "./pages/Login";

// --- Asset IT App ---
import Dashboard from "./apps/AssetIT/pages/Dashboard";
import AllAsset from "./apps/AssetIT/pages/asset/allAsset";
import UpdateAsset from "./apps/AssetIT/pages/asset/UpdateAsset";
import AddAsset from "./apps/AssetIT/pages/asset/AddAsset";
import DisposedAsset from "./apps/AssetIT/pages/asset/DisposedAsset";
import EmpList from "./apps/AssetIT/pages/employees/Emp_List";
import EmpAdd from "./apps/AssetIT/pages/employees/Emp_Add";
import EmpEdit from "./apps/AssetIT/pages/employees/Emp_Edit";
import AgencyManager from "./apps/AssetIT/pages/employees/Agency/AgencyManager";
import SetLocation from "./apps/AssetIT/pages/setting/setLocation";
import SetAssetType from "./apps/AssetIT/pages/setting/setAssetType";

// --- Line Support App ---
import LineSupportDashboard from "./apps/LineSupport/pages/LineSupportDashboard";
import LineSupportUsers from "./apps/LineSupport/pages/users";
import EscalatedIssues from "./apps/LineSupport/pages/EscalatedIssues";
import UserConversations from "./apps/LineSupport/pages/UserConversations";
import LineSupportSettings from "./apps/LineSupport/pages/LineSupportSettings";

// import Users from "./pages/Users";

function App() {
  return (
    <div className="text-l ">
      <Router>
        <Routes >
          {/* ✅ หน้า login */}
          <Route path="/" element={<Login />} />
          {/* ✅ หน้าหลังล็อกอินเท่านั้น */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        /> */}

          <Route
            path="/AllAsset"
            element={
              <ProtectedRoute>
                <AllAsset />
              </ProtectedRoute>
            }
          />

          <Route
            path="/AddAsset"
            element={
              <ProtectedRoute>
                <AddAsset />
              </ProtectedRoute>
            }
          />

          <Route
            path="/update-asset/:serial_no"
            element={
              <ProtectedRoute>
                <UpdateAsset />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disposed-asset"
            element={
              <ProtectedRoute>
                <DisposedAsset />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/emp_list"
            element={
              <ProtectedRoute>
                <EmpList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/emp_add"
            element={
              <ProtectedRoute>
                <EmpAdd />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/emp_edit/:emp_id"
            element={
              <ProtectedRoute>
                <EmpEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/agency"
            element={
              <ProtectedRoute>
                <AgencyManager />
              </ProtectedRoute>
            }
          />



          <Route
            path="/setting/location"
            element={
              <ProtectedRoute>
                <SetLocation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/setting/asset-type"
            element={
              <ProtectedRoute>
                <SetAssetType />
              </ProtectedRoute>
            }
          />
          <Route
            path="/line-support/dashboard"
            element={
              <ProtectedRoute>
                <LineSupportDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/line-support/users"
            element={
              <ProtectedRoute>
                <LineSupportUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/line-support/user/:lineUserId"
            element={
              <ProtectedRoute>
                <UserConversations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/line-support/escalated"
            element={
              <ProtectedRoute>
                <EscalatedIssues />
              </ProtectedRoute>
            }
          />

          <Route
            path="/line-support/settings"
            element={
              <ProtectedRoute>
                <LineSupportSettings />
              </ProtectedRoute>
            }
          />

        </Routes>
      </Router>
    </div>
  );
}

export default App;
