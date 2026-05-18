import ProducerHistoriesPage from "@/components/dashboard/producers/histories/producer-histories-page";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { UserRole } from "@/types";
import ProducersHistoriesAdminPage from "@/components/dashboard/producers/histories/admin/producers-histories-admin-page";

export default async function HistorialProduccion() {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return <div>No estas autorizado para realizar esta accion</div>;
  }

  const { id, role } = verifyToken(token);

  if(role === UserRole.ADMIN || role === UserRole.SUPER || role === UserRole.AUXILIAR) {
    return <ProducersHistoriesAdminPage />;
  }

  return (
    <ProducerHistoriesPage />
  )
}