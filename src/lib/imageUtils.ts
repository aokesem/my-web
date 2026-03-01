/**
 * 图片压缩工具模块
 * 在上传到 Supabase 之前，自动压缩图片：
 * 1. 限制最大宽度至 MAX_WIDTH (1600px)
 * 2. 转换为 WebP 格式
 * 3. 压缩质量至 QUALITY (0.82)
 * 4. 如果压缩后体积 >= 原文件，则跳过压缩直接返回原文件
 */

const MAX_WIDTH = 1600;
const QUALITY = 0.82;

/**
 * 通过 Canvas 对图片进行 Resize + WebP 压缩
 * @param file 原始图片文件
 * @returns 压缩后的 File 对象（可能是 WebP 格式），或在不需要压缩时返回原文件
 */
export async function compressImage(file: File): Promise<File> {
    // 跳过非图片文件
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // 跳过 GIF（保留动画）和 SVG（矢量图无需压缩）
    if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
        return file;
    }

    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            // 计算目标尺寸
            let targetWidth = img.naturalWidth;
            let targetHeight = img.naturalHeight;

            if (targetWidth > MAX_WIDTH) {
                const ratio = MAX_WIDTH / targetWidth;
                targetWidth = MAX_WIDTH;
                targetHeight = Math.round(targetHeight * ratio);
            }

            // 如果图片尺寸本身已经小于上限且体积小于 100KB，直接跳过
            if (targetWidth === img.naturalWidth && file.size < 100 * 1024) {
                resolve(file);
                return;
            }

            // 使用 Canvas 进行压缩
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(file);
                return;
            }

            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            canvas.toBlob(
                (blob) => {
                    if (!blob || blob.size >= file.size) {
                        // 压缩后反而更大或失败，返回原文件
                        resolve(file);
                        return;
                    }

                    // 生成新的 File 对象，保持原始文件名但扩展名改为 .webp
                    const baseName = file.name.replace(/\.[^.]+$/, '');
                    const compressedFile = new File([blob], `${baseName}.webp`, {
                        type: 'image/webp',
                        lastModified: Date.now(),
                    });

                    resolve(compressedFile);
                },
                'image/webp',
                QUALITY
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            // 无法解码的图片直接返回原文件
            resolve(file);
        };

        img.src = objectUrl;
    });
}

/**
 * 自动从公网 URL 解析出 Bucket 和 文件路径，并向 Supabase 发送删除指令
 * @param url Supabase storage 中图片的公网 URL
 */
export async function deleteImageFromStorage(url: string | null | undefined) {
    if (!url || !url.includes('supabase.co/storage/v1/object/public/')) return;
    try {
        const urlParts = url.split('/storage/v1/object/public/');
        if (urlParts.length < 2) return;

        // 提取 bucket 和内部路径
        const pathParts = urlParts[1].split('/');
        const bucket = pathParts[0];
        const filePath = pathParts.slice(1).join('/');

        console.log(`Deleting from bucket: ${bucket}, path: ${filePath}`);

        // 需要动态引入 supabase client 避免循环引用，或者从传入参数
        const { supabase } = await import('@/lib/supabaseClient');

        const { error } = await supabase.storage.from(bucket).remove([filePath]);
        if (error) {
            console.error('Failed to delete orphaned image:', error);
        }
    } catch (e) {
        console.error('Exception when deleting image:', e);
    }
}
