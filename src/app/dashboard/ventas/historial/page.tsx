import SaleHistoriesAdminPage from "@/components/dashboard/sales/histories/admin/sale-histories-admin-page";
import SaleHistoriesPage from "@/components/dashboard/sales/histories/sale-histories-page";
import { verifyToken } from "@/lib/auth";
import { UserRole } from "@/types";
import { cookies } from "next/headers";

export default async function SalesHistory() {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return <div>No estas autorizado para realizar esta accion</div>;
  }

  const { id, role } = verifyToken(token);

  if(role === UserRole.ADMIN || role === UserRole.SUPER || role === UserRole.AUXILIAR) {
    return <SaleHistoriesAdminPage />;
  }

  return (
    <SaleHistoriesPage />
  );
}