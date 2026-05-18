interface CalculateTotalItemsProps {
  total: number;
  currentPage: number;
  limit: number;
  name: string;
}

export const calculateTotalItems = ({ total, currentPage, limit, name }: CalculateTotalItemsProps) => {
  if (!total) return `0 ${name} encontradas`;
  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);
  return `Mostrando ${start}-${end} de ${total} ${name}`;
};