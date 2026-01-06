import { redirect } from 'next/navigation';

export default function AdminDashboard() {
    // Redirect to Books by default for now
    redirect('/admin/books');
}
