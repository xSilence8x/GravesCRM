import {
  LayoutDashboard,
  Users,
  Landmark,
  MapPin,
  FileText,
  Map,
  Bell,
  Flower2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Přehled", url: "/", icon: LayoutDashboard },
  { title: "Klienti", url: "/clients", icon: Users },
  { title: "Hřbitovy", url: "/graveyards", icon: Landmark },
  { title: "Hroby", url: "/graves", icon: MapPin },
  { title: "Faktury", url: "/invoices", icon: FileText },
  { title: "Mapa", url: "/map", icon: Map },
  { title: "Připomínky", url: "/reminders", icon: Bell },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Flower2 className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-base md:text-sm font-bold text-sidebar-accent-foreground">GraveCare</h2>
              <p className="text-sm md:text-xs text-sidebar-muted">Management System</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm md:text-xs">Navigace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="py-1 md:py-0">
                  <SidebarMenuButton asChild className="py-2 md:py-2 px-3 md:px-2 h-auto md:h-auto">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50 flex items-center"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                    >
                      <item.icon className="mr-2 h-6 w-6 md:h-4 md:w-4" />
                      {!collapsed && <span className="text-lg md:text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
