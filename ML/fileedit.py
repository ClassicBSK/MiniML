import os

def extract_first_200mb(input_file, output_file, max_bytes=200 * 1024 * 1024):
    total_bytes = 0
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', encoding='utf-8') as outfile:
        
        for line in infile:
            line_bytes = len(line.encode('utf-8'))
            if total_bytes + line_bytes > max_bytes:
                break
            outfile.write(line)
            total_bytes += line_bytes

    print(f"Written first {total_bytes / (1024 * 1024):.2f} MB to {output_file}")

extract_first_200mb("D:\\Studies\\ABB\\Projects\\ML\\bosch-production-line-performance\\train_numeric.csv\\train_numeric.csv",output_file="trimmed.csv")