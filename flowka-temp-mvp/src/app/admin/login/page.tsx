import { isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminLogin } from '@/components/admin-login';
export default async function Login() {
  if (await isAdmin()) redirect('/admin');
  return <AdminLogin />;
}
