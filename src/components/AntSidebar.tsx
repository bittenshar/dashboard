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
import CreateEventModal from "./CreateEventModal";

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
  { key: "/", icon: <PieChartOutlined />, label: "Dashboard" },
  { key: "/users", icon: <DesktopOutlined />, label: "User Verification" },
  { key: "/events", icon: <ContainerOutlined />, label: "Event Management" },
  { key: "/feedback", icon: <AppstoreOutlined />, label: "User Feedback" },
  { key: "/admin", icon: <AppstoreOutlined />, label: "Admin" },
  { key: "/organisers", icon: <MailOutlined />, label: "Organisers" },
  { key: "/ads", icon: <AppstoreOutlined />, label: "Ads Management" },
  { key: "/analytics", icon: <PieChartOutlined />, label: "Analytics" },



];

const AntSidebar = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const navigate = useNavigate();
  const location = useLocation();

  // Optional: Update Tailwind `dark` class
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const [showCreateEvent, setShowCreateEvent] = useState(false);

  return (
    <>
      <div
        className={`min-h-screen flex flex-col justifyContent: "center" ${theme === "dark" ? "bg-[#00435]" : "bg-white"}`}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        style={{
          width: collapsed ? 60 : 200,
          transition: "width 0.3s ease",
          overflow: "hidden",
          alignItems: "flex-start",
        }}
      >
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
        size="small" />
        </div>

        
        <div className="py-8"></div>

        {/* Menu items */}
        <Menu
          selectedKeys={[location.pathname]}
          mode="inline"
          inlineCollapsed={collapsed}
          items={items}
          onClick={handleMenuClick}
          theme={theme}
          style={{
        border: "none",
        flexGrow: 1,
        textAlign: "left",
          }} />

        <Menu
          selectedKeys={[location.pathname]}
          mode="inline"
          inlineCollapsed={collapsed}
          items={[{ key: "", icon: <PlusOutlined />, label: "Create Event " }]}
          onClick={() => setShowCreateEvent(true)}
          theme={theme}
          style={{
        border: "none",
        marginTop: "auto",
        paddingBottom: 16,
        textAlign: "left",
          }} />



        <Switch
          checkedChildren={<BulbOutlined />}
          unCheckedChildren={<BulbOutlined />}
          checked={theme === "dark"}
          onChange={toggleTheme}
          title="Toggle theme"
          style={{ marginLeft: 16, marginBottom: 16 }} />
      </div>
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
