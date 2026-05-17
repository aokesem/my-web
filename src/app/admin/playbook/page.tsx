import { redirect } from 'next/navigation';

/** 旧「任务森林」管理已下线，跳转至信息溯源管理 */
export default function LegacyPlaybookAdminPage() {
    redirect('/admin/library/info-source');
}
