import './globals.css';

export const metadata = {
  title: 'Vocab Match Edu ⚡ - เกมจับคู่คำศัพท์เรียลไทม์',
  description: 'แอปพลิเคชันจับคู่คำศัพท์เรียลไทม์เพื่อการเรียนการสอน',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}