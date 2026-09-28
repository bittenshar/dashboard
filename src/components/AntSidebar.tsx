import { useState, useEffect, useMemo } from "react";
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
  ScanOutlined,
} from "@ant-design/icons";
import { Badge, Button, Menu, Switch } from "antd";
import type { MenuProps } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import { countByVerificationState, unwrapUsers } from "@/lib/verification";
import CreateEventModal from "./CreateEventModal";

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
  { key: "/", icon: <PieChartOutlined />, label: "Dashboard" },
  { key: "/users", icon: <DesktopOutlined />, label: "User Verification" },
  { key: "/face-check", icon: <ScanOutlined />, label: "Face ID Check" },
  { key: "/notifications", icon: <NotificationOutlined />, label: "Notifications" },
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
  const api = useApiContext();

  // Users with a selfie waiting for an admin — shown on the User Verification
  // icon so it's visible even with the sidebar collapsed.
  const toVerify = useMemo(() => countByVerificationState(unwrapUsers(api.users)).to_verify, [api.users]);
  const menuItems = useMemo<MenuItem[]>(
    () =>
      items.map((item: any) =>
        item?.key === "/users"
          ? {
              ...item,
              icon: (
                <Badge count={toVerify} size="small" offset={[6, -2]} overflowCount={99} title={`${toVerify} to verify`}>
                  {item.icon}
                </Badge>
              ),
              label: toVerify > 0 ? `${item.label} (${toVerify})` : item.label,
            }
          : item
      ),
    [toVerify]
  );

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
          items={menuItems}
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
