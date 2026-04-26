import { Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import AccessDenied from "../components/AccessDenied";

export default function SettingsPage() {
  const { can, permissions } = useAuth();
  console.log("User Permissions settings page:", can("settings.view"));
  console.log("User Permissions settings page:", permissions);

  if (!can("settings.view")) {
    return <AccessDenied />;
  }
  return (
    <div className="p-6">
      <Outlet />
    </div>
  );
}
