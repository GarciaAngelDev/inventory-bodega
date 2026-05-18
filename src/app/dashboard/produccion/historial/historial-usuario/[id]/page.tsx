import ProducerHistoriesUserPage from "@/components/dashboard/producers/histories/user/producer-histories-user-page";

export default async function HistoryUserPage({ params, }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ProducerHistoriesUserPage id={id} />
  )
}