import { UserRole } from "@/types/user";
import { DashboardNavigationItem } from "@/types/dashboard";

export function filterNavigationByRole(
  navigation: DashboardNavigationItem[],
  role?: UserRole
): DashboardNavigationItem[] {
  if (!role) return [];
  return navigation.filter((item) => item.roles?.includes(role));
}

export function getFirstAccessibleRoute(
  navigation: DashboardNavigationItem[],
  role?: UserRole
): string {
  if (!role) return '/dashboard';
  const accessibleItems = filterNavigationByRole(navigation, role);
  return accessibleItems.length > 0 ? accessibleItems[0].url : '/dashboard';
}
