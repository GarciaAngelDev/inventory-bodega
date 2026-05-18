import { ModeToggle } from "@/components/ui/mode-toggle";

interface HomeLayoutProps {
  children: React.ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <>
      <header className="py-3">
        <div className="container mx-auto px-4 lg:px-0">
          <div className="flex items-center justify-end">
            <ModeToggle />
          </div>
        </div>
      </header>
      {children}
    </>
  )
} 