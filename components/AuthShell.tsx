import Logo from "./Logo";
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo />
      {children}
    </div>
  );
}
