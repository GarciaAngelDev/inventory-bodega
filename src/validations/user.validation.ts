import { emailRegex } from "@/constants/auth";
import { User } from "@/types";

export const createUserValidation = (user: User) => {

  if (!user.name || user.name === "") {
    return "El nombre es requerido";
  }

  if (user.name.length < 2) {
    return "El nombre debe tener al menos 2 caracteres";
  }

  if(!user.email || user.email === ""){
    return "El correo es requerido";
  }

  if(!emailRegex.test(user.email)) {
    return "El correo es invalido";
  }

  if(!user.password || user.password === ""){
    return "La contraseña es requerida";
  }

  if(user.password.length < 8){
    return "La contraseña debe tener al menos 8 caracteres";
  }

  return null;
}

export const updateUserValidation = (user: User) => {

  if (!user.name || user.name === "") {
    return "El nombre es requerido";
  }

  if (user.name.length < 2) {
    return "El nombre debe tener al menos 2 caracteres";
  }

  if(!user.email || user.email === ""){
    return "El correo es requerido";
  }

  if(!emailRegex.test(user.email)) {
    return "El correo es invalido";
  }

  return null;
}