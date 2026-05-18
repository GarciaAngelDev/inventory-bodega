"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, User as UserIcon, Mail, Shield, Activity, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { User, UserRole, UserStatus } from "@/types"
import { updateProfileUserAction } from "@/actions/user.action"
import { AxiosError } from "axios"

const getStatusColor = (status: UserStatus) => {
  return status === UserStatus.ACTIVE
    ? "bg-green-500/10 text-green-500 border-green-500/20"
    : "bg-gray-500/10 text-gray-500 border-gray-500/20"
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface UserProfileProps {
  user: User;
  setUser: (user: User | null) => void;
}

const UserProfile = ({ user, setUser }: UserProfileProps) => {

  const [isEditingName, setIsEditingName] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isSubmittingName, setIsSubmittingName] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  const [nameForm, setNameForm] = useState({ name: user.name })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingName(true)

    try {
      const updateUser = await updateProfileUserAction(user.id!, nameForm)
      setUser({ ...user, name: updateUser.user.name })
      toast.success("Nombre actualizado correctamente")
      setIsEditingName(false)
    } catch (error) {
      console.log(error)
      toast.error("Error al actualizar nombre")
    } finally {
      setIsSubmittingName(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setIsSubmittingPassword(true)

    try {
      await updateProfileUserAction(user.id!, { oldPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      setIsChangingPassword(false)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast.success("Contraseña actualizada correctamente")
    } catch (error) {
      console.log(error)
      if (error instanceof AxiosError) {
        return toast.error(error.response?.data.error)
      }
      toast.error("Error al actualizar contraseña")
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  const cancelNameEdit = () => {
    setNameForm({ name: user.name })
    setIsEditingName(false)
  }

  const cancelPasswordChange = () => {
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setIsChangingPassword(false)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* Información del Usuario */}
      <Card className="sm:max-w-[280px] w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-xl capitalize">{user.name}</CardTitle>
          <CardDescription className="flex items-center justify-center gap-1">
            <Mail className="h-4 w-4" />
            {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Rol</span>
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
              {
                user.role === UserRole.SUPER ? "Super Administrador" :
                user.role === UserRole.ADMIN ? "Administrador" :
                user.role === UserRole.AUXILIAR ? "Auxiliar" :
                user.role === UserRole.INVENTORY ? "Gestor de Inventario" :
                user.role === UserRole.PRODUCER ? "Productor" :
                user.role === UserRole.SELLER ? "Gestor de Ventas" : ""
              }
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Estado</span>
            </div>
            <Badge variant="outline" className={getStatusColor(user.status!)}>
              {user.status === UserStatus.ACTIVE ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Configuración */}
      <div className="w-full space-y-6">
        {/* Cambiar Nombre */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>Actualiza tu nombre de usuario</CardDescription>
          </CardHeader>
          <CardContent>
            {!isEditingName ? (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Nombre completo</Label>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{user.name}</p>
                </div>
                <Button variant="outline" onClick={() => setIsEditingName(true)}>
                  Editar
                </Button>
              </div>
            ) : (
              <form onSubmit={handleNameSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={nameForm.name}
                    onChange={(e) => setNameForm({ name: e.target.value })}
                    placeholder="Ingresa tu nombre completo"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    {
                      isSubmittingName ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin" />
                          Guardando...
                        </div>
                      ) : (
                        "Guardar"
                      )
                    }
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={cancelNameEdit}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Cambiar Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>Cambia tu contraseña para mantener tu cuenta segura</CardDescription>
          </CardHeader>
          <CardContent>
            {!isChangingPassword ? (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Contraseña</Label>
                  <p className="text-sm text-muted-foreground mt-1">••••••••</p>
                </div>
                <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                  Cambiar contraseña
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Ingresa tu contraseña actual"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Ingresa tu nueva contraseña"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirma tu nueva contraseña"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    {
                      isSubmittingPassword ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin" />
                          Cambiando contraseña...
                        </div>
                      ) : (
                        "Cambiar contraseña"
                      )
                    }
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={cancelPasswordChange}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UserProfile;
