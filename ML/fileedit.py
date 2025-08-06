import os
import pandas as pd

def create_balanced_200mb_csv(input_file, output_file, max_bytes=200 * 1024 * 1024, chunk_size=100000):
    total_bytes = 0
    header_written = False

    for chunk in pd.read_csv(input_file, chunksize=chunk_size):
        if 'Response' not in chunk.columns:
            raise ValueError("Missing 'Response' column")

        positives = chunk[chunk['Response'] == 1]
        negatives = chunk[chunk['Response'] == 0]

        min_len = min(len(positives), len(negatives))
        interleaved_rows = []

        for i in range(min_len):
            interleaved_rows.append(positives.iloc[i])
            interleaved_rows.append(negatives.iloc[i])

        balanced = pd.DataFrame(interleaved_rows)

        with open(output_file, 'a', encoding='utf-8') as f:
            if not header_written:
                f.write(','.join(balanced.columns) + '\n')
                header_written = True

            for _, row in balanced.iterrows():
                line = ','.join(map(str, row.values)) + '\n'
                line_bytes = len(line.encode('utf-8'))
                if total_bytes + line_bytes > max_bytes:
                    print(f"Reached 200MB limit. Written: {total_bytes / (1024 * 1024):.2f} MB")
                    return
                f.write(line)
                total_bytes += line_bytes

    print(f"Done. Written: {total_bytes / (1024 * 1024):.2f} MB")

# Usage
create_balanced_200mb_csv(
    "D:\\Studies\\ABB\\Projects\\ML\\bosch-production-line-performance\\train_numeric.csv\\train_numeric.csv",
    "balanced_trimmed.csv"
)