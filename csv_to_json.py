import csv
import json
import os

def convert_csv_to_json(input_file, output_file):
    words_data = []
    
    # 检查文件是否存在
    if not os.path.exists(input_file):
        print(f"错误: 找不到文件 {input_file}")
        return

    with open(input_file, mode='r', encoding='utf-8') as f:
        # 假设 csv 每行只有一个单词
        reader = csv.reader(f)
        for index, row in enumerate(reader):
            if not row: continue
            word = row[0].strip()
            
            words_data.append({
                "id": index + 1,
                "word": word,
                "translation": "",  # 预留位置
                "status": "unknown",
                "batch_id": (index // 500) + 1  # 自动批次计算
            })
            
    with open(output_file, mode='w', encoding='utf-8') as f:
        json.dump(words_data, f, ensure_ascii=False, indent=2)
    
    print(f"转换完成！已生成 {len(words_data)} 个单词到 {output_file}")

# 执行转换
convert_csv_to_json('combined.csv', 'words.json')
