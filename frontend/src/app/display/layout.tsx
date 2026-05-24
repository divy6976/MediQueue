import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MediQueue · Live Board",
};

export default function DisplayLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="fixed inset-0 z-0 flex h-full w-full min-h-0 flex-col overflow-hidden overscroll-none bg-slate-50">
      {children}
    </div>
  );
}
