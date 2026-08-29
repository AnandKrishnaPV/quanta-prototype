import sys
import os
import hydra
from omegaconf import OmegaConf

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from models.hybrid_llm import HybridQuantumLLM
from omegaconf import DictConfig

def main():
    cfg = OmegaConf.create({
        "model": {
            "backbone": "sentence-transformers/all-MiniLM-L6-v2",
            "num_qubits": 4,
            "embedding_type": "amplitude",
            "quantum_layers": 2,
            "ansatz_type": "strongly_entangling",
            "fusion_method": "gated"
        },
        "quantum": {
            "backend": "default.qubit"
        }
    })
    
    model = HybridQuantumLLM(cfg)
    
    diagram, depth, gate_counts = model.design_circuit()
    print("=== QUANTUM CIRCUIT DESIGN ===")
    print(diagram)
    print("==============================")
    print(f"Calculated Depth: {depth}")
    print(f"Total Gates: {gate_counts}")
    print("The system is now uniquely capable of explaining its own quantum logic.")

if __name__ == "__main__":
    main()
