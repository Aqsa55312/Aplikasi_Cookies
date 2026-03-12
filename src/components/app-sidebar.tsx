import React from "react";
import { LayoutDashboard, Package, Calculator, Settings, Cookie, Receipt } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
const items = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/" },
  { title: "Inventory", icon: Package, url: "/inventory" },
  { title: "HPP Calculator", icon: Calculator, url: "/calculator" },
  { title: "Transactions", icon: Receipt, url: "/transactions" },
];
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  return (
    <Sidebar collapsible="icon" className="border-r border-[#4A2B11]/10">
      <SidebarHeader className="bg-[#FDF8F5] pb-4">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4A2B11] text-[#FDF8F5] shadow-lg">
            <Cookie className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#4A2B11] leading-none tracking-tight uppercase">Dubai Chewy</span>
            <span className="text-[10px] font-medium text-[#F4A261] uppercase tracking-widest mt-1">Cookies Manager</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-[#FDF8F5] px-2">
        <SidebarGroup>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.url}
                  className={cn(
                    "transition-all duration-200 hover:bg-[#F4A261]/10",
                    location.pathname === item.url
                      ? "bg-[#F4A261] text-white hover:bg-[#F4A261] shadow-sm"
                      : "text-[#4A2B11]/70 hover:text-[#4A2B11]"
                  )}
                >
                  <Link to={item.url}>
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-[#FDF8F5] border-t border-[#4A2B11]/5 py-4 px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#4A2B11]/5 flex items-center justify-center">
            <Settings className="h-4 w-4 text-[#4A2B11]/40" />
          </div>
          <span className="text-[10px] font-medium text-[#4A2B11]/40 uppercase tracking-tighter">System v1.0.0</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}