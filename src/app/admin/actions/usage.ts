"use server";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getUsageStats() {
    try {
        // 1. 获取数据库和存储大小 (通过我们创建的 RPC)
        const { data: dbSizeMb, error: dbError } = await supabase.rpc('get_db_size');
        const { data: storageSizeMb, error: stError } = await supabase.rpc('get_storage_size');

        if (dbError || stError) {
            console.error('RPC Error:', dbError || stError);
        }

        // 2. 获取流量指标 (通过 Management API)
        let egressData = {
            egress: 0,
            cached_egress: 0
        };

        if (supabaseAccessToken && projectRef) {
            const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/usage`, {
                headers: {
                    'Authorization': `Bearer ${supabaseAccessToken}`,
                    'Content-Type': 'application/json',
                },
                next: { revalidate: 3600 } // 缓存 1 小时
            });

            if (response.ok) {
                const data = await response.json();
                // Supabase Management API 返回的数据结构中包含多种指标
                // 我们提取相关的流量数据
                egressData.egress = data.egress?.usage || 0;
                egressData.cached_egress = data.egress_cached?.usage || 0;
            } else {
                console.error('Management API Error:', response.statusText);
            }
        }

        return {
            success: true,
            data: {
                dbSize: dbSizeMb || 0,
                storageSize: storageSizeMb || 0,
                egress: egressData.egress,
                cachedEgress: egressData.cached_egress
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
