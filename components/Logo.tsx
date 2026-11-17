import Link from "next/link";
export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" width={30} height={30} className="h-[30px] w-[30px]" />
      Sheetpress
    </Link>
  );
}
