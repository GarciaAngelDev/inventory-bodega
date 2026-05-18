"use client";

import { useAuthForm } from "@/stores/auth.store";
import UserProfile from "./user-profile";

const PageProfileContent = () => {

  const { user, setUser } = useAuthForm();

  return (
    <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Perfil</h2>
          <p className="text-muted-foreground">Gestiona tu información personal y configuración de cuenta</p>
        </div>
        {
          user && (
            <UserProfile user={user} setUser={setUser}/>
          )
        }
      </div>
  );
};

export default PageProfileContent;
