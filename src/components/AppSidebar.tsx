import { useState, useEffect } from "react";
import {
  AppstoreOutlined,
  ContainerOutlined,
  DesktopOutlined,
  MailOutlined,
  MenuUnfoldOutlined,
  PieChartOutlined,
  BulbOutlined,
  PlusOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { Button, Menu, Switch } from "antd";
import type { MenuProps } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // assumes context provides user object
import CreateEventModal from "./CreateEventModal";

// Define sidebar items with permissions
const rawItems = [
  { key: "/", icon: <PieChartOutlined />, label: "Dashboard", permission: null },
  { key: "/users", icon: <DesktopOutlined />, label: "User Verification", permission: "users" },
  { key: "/events", icon: <ContainerOutlined />, label: "Event Management", permission: "events" },
  { key: "/employees", icon: <AppstoreOutlined />, label: "Employee Management", permission: "admin" },
  { key: "/ads", icon: <AppstoreOutlined />, label: "Ads Management", permission: "admin" },
  { key: "/feedback", icon: <AppstoreOutlined />, label: "User Feedback", permission: "all" },
  { key: "/notifications", icon: <NotificationOutlined />, label: "Notifications", permission: "all" },
  { key: "/admin", icon: <AppstoreOutlined />, label: "Admin", permission: "admin" },
  { key: "/organisers", icon: <MailOutlined />, label: "Organisers", permission: "all" },
  { key: "/analytics", icon: <PieChartOutlined />, label: "Analytics", permission: "all" },
  { key: "/settings", icon: <AppstoreOutlined />, label: "Settings", permission: "all" },
  { key: "/help", icon: <AppstoreOutlined />, label: "Help", permission: "all" },
  { key: "/terms", icon: <AppstoreOutlined />, label: "Terms of Service", permission: "all" },
  { key: "/privacy", icon: <AppstoreOutlined />, label: "Privacy Policy", permission: "all" },
];

const AntSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const { user } = useAuth(); // 👈 assumes user object has `role` and `permissions` array

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === "dark" ? "light" : "dark"));

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key) navigate(key);
  };

  // 👇 Permission checker
  const hasPermission = (permission: string | null) => {
    if (!permission) return true;
    if (!user) return false;
    const userPermissions = user.permissions || [];
    return user.role === "Admin" || userPermissions.includes("all") || userPermissions.includes(permission);
  };

  // 👇 Filter items based on permission
  const menuItems = rawItems
    .filter(item => hasPermission(item.permission))
    .map(item => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
    }));

  return (
    <>
      <div
        className={`min-h-screen flex flex-col ${theme === "dark" ? "bg-[#00435]" : "bg-white"}`}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        style={{
          width: collapsed ? 60 : 200,
          transition: "width 0.3s ease",
          overflow: "hidden",
          alignItems: "flex-start",
        }}
      >
        {/* Toggle Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "flex-start" : "center",
            width: "100%",
          }}
        >
          <Button
            type="primary"
            icon={<MenuUnfoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            size="small"
          />
        </div>

        <div className="py-8" />

        {/* Filtered Menu Items */}
        <Menu
          selectedKeys={[location.pathname]}
          mode="inline"
          inlineCollapsed={collapsed}
          items={menuItems}
          onClick={handleMenuClick}
          theme={theme}
          style={{
            border: "none",
            flexGrow: 1,
            textAlign: "left",
          }}
        />

        {/* Create Event Button */}
        {hasPermission("events") && (
          <Menu
            selectedKeys={[]}
            mode="inline"
            inlineCollapsed={collapsed}
            items={[{ key: "create", icon: <PlusOutlined />, label: "Create Event" }]}
            onClick={() => setShowCreateEvent(true)}
            theme={theme}
            style={{
              border: "none",
              marginTop: "auto",
              paddingBottom: 16,
              textAlign: "left",
            }}
          />
        )}

        {/* Theme Switch */}
        <Switch
          checkedChildren={<BulbOutlined />}
          unCheckedChildren={<BulbOutlined />}
          checked={theme === "dark"}
          onChange={toggleTheme}
          title="Toggle theme"
          style={{ marginLeft: 16, marginBottom: 16 }}
        />
      </div>

      {/* Create Event Modal */}
      <CreateEventModal 
        isOpen={showCreateEvent} 
        onClose={() => setShowCreateEvent(false)}
        onEventCreated={() => {
          // Event created - could trigger a global refresh if needed
          console.log('Event created from sidebar');
        }}
      />
    </>
  );
};

export default AntSidebar;
