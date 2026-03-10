import json
import sys
import os

def bulk_update_translations(json_path, translations):
    """
    translations: dict of {word: translation}
    """
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return False
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        updated_count = 0
        for item in data:
            word = item.get('word')
            if word in translations:
                item['translation'] = translations[word]
                updated_count += 1
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully updated {updated_count} translations.")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python bulk_update.py <json_path> <translations_file_path>")
        sys.exit(1)
    
    path = sys.argv[1]
    trans_file = sys.argv[2]
    with open(trans_file, 'r', encoding='utf-8') as f:
        translations_data = json.load(f)
    bulk_update_translations(path, translations_data)
