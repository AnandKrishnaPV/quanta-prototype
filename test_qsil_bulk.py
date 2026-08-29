import time
import math
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

def calculate_qsil_coherence(s1: str, s2: str) -> float:
    def extract_features(s: str):
        l_s = sum(1 for c in s if c.isalpha())
        w_s = len(s.split())
        d_s = sum(1 for c in s if c.isdigit())
        o_s = sum(1 for c in s if c in "+-*/=<>")
        if d_s + o_s > 0:
            v = [d_s, o_s + 1]
        else:
            v = [l_s + 1, w_s + 1]
        norm = math.sqrt(v[0]**2 + v[1]**2)
        return [v[0]/norm, v[1]/norm]

    v1 = extract_features(s1)
    v2 = extract_features(s2)
    
    qc = QuantumCircuit(2)
    qc.initialize(v1, 0)
    qc.initialize(v2, 1)
    qc.h(0)
    qc.cx(0, 1)
    
    sv = Statevector(qc)
    probs = sv.probabilities_dict()
    return probs.get('00', 0.0) + probs.get('11', 0.0)

# Generate 120 sentence pairs
sentences = [
    (f"This is test sentence number {i}.", f"Comparing to a slightly different variation {i}.") for i in range(120)
]

start = time.time()
for s1, s2 in sentences:
    c = calculate_qsil_coherence(s1, s2)
end = time.time()

print(f"Processed 120 sentence pairs in {(end-start)*1000:.2f} ms")
