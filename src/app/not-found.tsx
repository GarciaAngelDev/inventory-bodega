import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-xl">Página no encontrada</p>
      <Link href="/dashboard">
        <Button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white cursor-pointer">
          <Home />
          Volver al inicio
        </Button>
      </Link>
    </div>
  )
}