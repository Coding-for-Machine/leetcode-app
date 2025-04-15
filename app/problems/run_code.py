import subprocess
import time
import tracemalloc

def run(data, test_case):
    with open("solution.py", "w") as f:
        f.write(data)
    
    for i, test in enumerate(test_case):
        input_values = test["input_txt"].split()
        expected_output = test["output_txt"]
        is_correct = test["is_correct"]
        
        tracemalloc.start()
        start_time = time.time()
        
        process = subprocess.run(
            ["python", "solution.py", *input_values, expected_output],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # O'lchovlarni olish
        execution_time = (time.time() - start_time) * 1000  # millisekundlarda
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        actual_output = process.stdout.strip()
        passed = (actual_output == "True") == is_correct
        
        yield {
            f"test-{i+1}": {
                "input": " ".join(input_values),
                "expected": expected_output,
                "actual": actual_output,
                "passed": passed,
                "time_ms": round(execution_time, 3),
                "memory_kb": peak / 1024  # KB ga o'tkazamiz
            }
        }

# # Test holatlari
# data = """
# def add(a, b):
#     return a + b

# if __name__ == "__main__":
#     import sys 
#     a = int(sys.argv[1])
#     b = int(sys.argv[2])
#     result = int(sys.argv[3])
#     print(add(a, b) == result)
# """

# test_case = [
#     {"input_txt": "1 5", "output_txt": "6", "is_correct": True},
#     {"input_txt": "10 5", "output_txt": "15", "is_correct": True},
#     {"input_txt": "1 51", "output_txt": "6", "is_correct": False},
#     {"input_txt": "15 5", "output_txt": "20", "is_correct": True}
# ]

# # Testlarni ishga tushirish
# for result in run(data, test_case):
#     print(result)