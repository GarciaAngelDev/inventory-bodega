import SaleHistoriesUserPage from "@/components/dashboard/sales/histories/user/sale-histories-user-page";

export default async function HistorialUsuario({params,}: {params: Promise<{ id: string }>}) {
  const { id } = await params;
  return (
    <SaleHistoriesUserPage id={id} />
  );
}