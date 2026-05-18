import { UserRole } from "@/types";
import { DashboardNavigationItem } from "@/types/dashboard";
import { Archive, ArchiveRestore, Cylinder, Home, LayoutPanelLeft, Package, PackagePlus, Users } from "lucide-react";

export const dashboardNavigation: DashboardNavigationItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    roles: [UserRole.SUPER, UserRole.ADMIN, UserRole.AUXILIAR]
  },
  {
    title: "Inventario",
    url: "/dashboard/inventario",
    icon: Archive,
    roles: [UserRole.SUPER, UserRole.ADMIN, UserRole.AUXILIAR, UserRole.INVENTORY]
  },
  {
    title: "Producción",
    url: "/dashboard/produccion",
    icon: PackagePlus,
    roles: [UserRole.SUPER, UserRole.ADMIN, UserRole.AUXILIAR, UserRole.PRODUCER]
  },
  {
    title: "Ventas",
    url: "/dashboard/ventas",
    icon: ArchiveRestore,
    roles: [UserRole.SUPER, UserRole.ADMIN, UserRole.AUXILIAR, UserRole.SELLER]
  },
  {
    title: "Productos",
    url: "/dashboard/productos",
    icon: Package,
    roles: [UserRole.SUPER, UserRole.ADMIN, UserRole.AUXILIAR]
  },
  {
    title: "Categorias",
    url: "/dashboard/categorias",
    icon: LayoutPanelLeft,
    roles: [UserRole.SUPER, UserRole.ADMIN, UserRole.AUXILIAR]
  },
  {
    title: "Insumos",
    url: "/dashboard/insumos",
    icon: Cylinder,
    roles: [UserRole.SUPER, UserRole.ADMIN, UserRole.AUXILIAR]
  },
  {
    title: "Usuarios",
    url: "/dashboard/usuarios",
    icon: Users,
    roles: [UserRole.SUPER, UserRole.ADMIN]
  }
]