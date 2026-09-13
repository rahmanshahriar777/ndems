import type { Metadata } from 'next';
import '../styles/globals.css';
import { AuthProvider } from '../context/auth-context';

export const metadata: Metadata = {
  title: 'Neoteric Digital — EMS | Enterprise Management System',
  description:
    'Neoteric Digital enterprise Employee Management System with attendance, leaves, payroll, and performance management.',
  icons: {
    icon: '/logo.png',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-white text-slate-900 antialiased selection:bg-primary-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
