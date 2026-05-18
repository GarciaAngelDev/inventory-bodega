import { LoginValidation, RegisterValidation } from "@/types/validations";
import { emailRegex } from "@/constants/auth";

export const loginValidation = (loginData: LoginValidation) => {

  if (!loginData.email || loginData.email === "") {
    return "El correo electrónico es obligatorio";
  }

  if (!emailRegex.test(loginData.email)) {
    return "El correo electrónico es inválido";
  }

  if (!loginData.password || loginData.password === "") {
    return "La contraseña es obligatoria";
  }

  if (loginData.password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }

  return null;
}

export const registerValidation = (registerData: RegisterValidation) => {

  if (!registerData.name || registerData.name === "") {
    return "El nombre es obligatorio";
  }

  if (!registerData.email || registerData.email === "") {
    return "El correo electrónico es obligatorio";
  }

  if (!emailRegex.test(registerData.email)) {
    return "El correo electrónico es inválido";
  }

  if (!registerData.password || registerData.password === "") {
    return "La contraseña es obligatoria";
  }

  if (registerData.password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }

  return null;
}