import json
import os
from datetime import datetime

def try_parse_date(date_str):
    if not date_str or date_str in ["0", "#######", ""]:
        return None
    
    # Daftar format yang ditemukan di file JSON
    formats = ["%Y-%m-%d", "%d-%b-%y", "%d-%B-%y", "%d-%m-%Y"]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return date_str # Kembalikan apa adanya jika tidak cocok

def process_data(input_path):
    if not os.path.exists(input_path):
        print(f"File {input_path} tidak ditemukan.")
        return

    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    cleaned_data = []
    for entry in data:
        # 1. Bersihkan nilai "0" atau placeholder lainnya
        for key in entry:
            if entry[key] == "0" or "###" in str(entry[key]):
                entry[key] = ""
        
        # 2. Normalisasi Tanggal Lahir
        if "tanggal_lahir" in entry:
            entry["tanggal_lahir"] = try_parse_date(entry["tanggal_lahir"])
        
        # 3. Contoh penanganan data tertukar (seperti pada ID 1408)
        # Di ID 1408: nama="L", jenis_kelamin="Tangerang", tempat_lahir="04-03-1976"
        if entry.get("nama") == "L" or entry.get("nama") == "P":
             # Logika perbaikan manual bisa ditambahkan di sini berdasarkan pola data
             pass

        cleaned_data.append(entry)

    # Simpan hasil pembersihan
    output_path = input_path.replace(".json", "_cleaned.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(cleaned_data, f, indent=2)
    
    print(f"Selesai! Data bersih disimpan di: {output_path}")
    print(f"Total baris diproses: {len(cleaned_data)}")

if __name__ == "__main__":
    # Sesuaikan path jika berbeda di environment Anda
    target_file = r"d:\Sistem Informasi\src\data\generated\anak.json"
    process_data(target_file)