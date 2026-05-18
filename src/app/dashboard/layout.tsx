"use client";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { logout } from "@/actions/auth.action";
import { useAuthForm } from "@/stores/auth.store";
import { toast } from "sonner";
import Link from "next/link";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {

  const router = useRouter();

  const { user, isAuthenticated, clearUser } = useAuthForm();

  const logoutUser = async () => {
    try {
      await logout();
      clearUser();
      router.push('/');
    } catch (error) {
      toast.error('Error al intentar cerrar sesión');
      console.error('Error logging out:', error);
    }
  };

  // Funcion para obtener las iniciales del nombre, maximo 2 iniciales
  const getInitialsToName = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        <header className="flex-shrink-0 flex items-center justify-between py-3 px-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="cursor-pointer" />
            <span>Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="rounded-md cursor-pointer">
                  {/* <AvatarImage src="https://github.com/shadcn.png" /> */}
                  <AvatarFallback>{isAuthenticated ? getInitialsToName(user!.name) : ''}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel className="select-none capitalize">{isAuthenticated ? user?.name : 'Usuario no registrado'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link href="/dashboard/perfil">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logoutUser} className="cursor-pointer">Cerrar Sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}