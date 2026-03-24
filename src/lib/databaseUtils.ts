import { supabase } from './supabaseClient';
import { deleteImageFromStorage } from './imageUtils';

interface SafeDeleteOptions {
    table: string;
    id: number | string;
    imageFields?: string[]; // 需要清理图片的字段名，支持字符串或字符串数组
}

/**
 * 通用安全删除工具函数
 * 在删除数据库记录前，先获取关联的图片 URL，删除成功后再清理存储空间
 */
export async function supaSafeDelete({ table, id, imageFields = [] }: SafeDeleteOptions) {
    try {
        // 1. 先查询出该记录的所有数据，以便提取图片 URL
        const { data: record, error: fetchError } = await supabase
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !record) {
            throw new Error(`无法找到 ID 为 ${id} 的记录：${fetchError?.message}`);
        }

        // 2. 提取所有关联的图片 URL
        const urlsToDelete: string[] = [];
        for (const field of imageFields) {
            const val = record[field];
            if (!val) continue;

            if (Array.isArray(val)) {
                // 处理数组（如 stills），过滤掉非字符串项
                val.forEach(item => {
                    if (typeof item === 'string') {
                        // 处理可能存在的 url|pos 格式
                        urlsToDelete.push(item.split('|')[0]);
                    }
                });
            } else if (typeof val === 'string') {
                // 处理单字段（如 cover_url）
                urlsToDelete.push(val.split('|')[0]);
            }
        }

        // 3. 执行数据库删除操作
        const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw deleteError;
        }

        // 4. 数据库确认删除后，异步清理存储空间中的图片
        // 我们不等待图片删除完成，直接返回成功，清理动作在后台执行
        if (urlsToDelete.length > 0) {
            console.log(`Starting background cleanup for ${urlsToDelete.length} images...`);
            Promise.all(urlsToDelete.map(url => deleteImageFromStorage(url)))
                .then(() => console.log('Cleanup completed.'))
                .catch(err => console.error('Cleanup failed:', err));
        }

        return { success: true };
    } catch (error: any) {
        console.error('Safe delete failed:', error);
        return { success: false, error: error.message };
    }
}
