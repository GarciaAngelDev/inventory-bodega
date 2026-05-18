"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, UserRound } from "lucide-react";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { login } from "@/actions/auth.action";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useAuthStore } from "@/stores/auth.store";

const loginSchema = z.object({
  email: z.string()
    .min(1, { message: "El correo electrónico es obligatorio" })
    .email({ message: "El correo electrónico es inválido" }),
  password: z.string()
    .min(1, { message: "La contraseña es obligatoria" })
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
});

const LoginForm = () => {

  const router = useRouter();

  const { setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const user = await login(data.email, data.password);
      setIsLoading(false);
      setUser(user);
      router.push("/dashboard");
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      if(error instanceof AxiosError) {
        toast.error(error.response?.data.error);
        return;
      }
      toast.error("Error al iniciar sesión");
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>
          Ingrese sus datos para iniciar sesión
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email" className="after:ml-0.5 after:text-red-500 after:content-['*']">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tuemail@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="after:ml-0.5 after:text-red-500 after:content-['*']">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
            </div>
          </div>
          <div className="w-full mt-6">
            <Button
              type="submit"
              className="w-full flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
              disabled={isLoading}
            >
              {
                isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando Sesión
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    Iniciar Sesión
                  </div>
                )
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default LoginForm;
