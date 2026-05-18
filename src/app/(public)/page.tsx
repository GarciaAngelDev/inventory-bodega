import LoginForm from "@/components/auth/forms/login-form";

export default function Home() {
  return (
    <div className="container mx-auto px-4 lg:px-0 h-[calc(100vh-60px)]">
      <div className="flex items-center justify-center h-full">
        <LoginForm />
      </div>
    </div>
  );
}
