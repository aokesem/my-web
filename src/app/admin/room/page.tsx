import { redirect } from 'next/navigation';

export default function RoomAdminIndex() {
    redirect('/admin/room/quotes');
}