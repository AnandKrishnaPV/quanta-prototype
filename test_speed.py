import time
from openai import OpenAI
import concurrent.futures

api_key = "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"
client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=api_key)
prompt = "write me a essay on india's quantum valley"

def generate():
    try:
        res = client.chat.completions.create(
            model="nvidia/ising-calibration-1.5-31b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.9
        )
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

print("Testing Sequential (Current App Behavior for 3 variations)...")
start = time.time()
for _ in range(3):
    generate()
seq_time = time.time() - start
print(f"Sequential 3 generations took {seq_time:.2f}s. Extrapolating to 50: {(seq_time/3)*50:.2f}s")

print("\nTesting Concurrent (Parallel) behavior for 50 variations...")
start = time.time()
successes = 0
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(generate) for _ in range(50)]
    for f in concurrent.futures.as_completed(futures):
        if f.result():
            successes += 1
con_time = time.time() - start
print(f"Concurrent 50 generations took {con_time:.2f}s. Successful requests: {successes}/50")
