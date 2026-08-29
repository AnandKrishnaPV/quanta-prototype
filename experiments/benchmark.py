import hydra
from omegaconf import DictConfig
import pandas as pd
from experiments.orchestrator import launch_experiment
import os

def run_benchmarks(cfg: DictConfig):
    """
    Automated benchmark runner comparing various classical models against QUANTA.
    """
    baselines = [
        "sentence-transformers/all-MiniLM-L6-v2",
        "bert-base-uncased",
        "roberta-base",
        "distilbert-base-uncased"
    ]
    
    results = []
    
    print("--- Running Classical Baselines ---")
    for model_name in baselines:
        # Override config for baseline
        cfg.model.backbone = model_name
        cfg.model.use_quantum_attention = False
        cfg.model.num_qubits = 0
        
        # Run classical baseline
        metrics = launch_experiment(cfg, "benchmark_classical")
        
        # Collect results
        results.append({"Model": model_name, "Pearson": metrics.get("val_pearson", 0.0), "Spearman": metrics.get("val_spearman", 0.0)})
        
    print("--- Running QUANTA Hybrid Configurations ---")
    qubit_configs = [2, 4, 8]
    for q in qubit_configs:
        cfg.model.backbone = "sentence-transformers/all-MiniLM-L6-v2"
        cfg.model.num_qubits = q
        
        # Run hybrid quantum model
        metrics = launch_experiment(cfg, "benchmark_hybrid")
        results.append({"Model": f"QUANTA ({q} Qubits)", "Pearson": metrics.get("val_pearson", 0.0), "Spearman": metrics.get("val_spearman", 0.0)})
        
    # Save to CSV
    df = pd.DataFrame(results)
    os.makedirs("results", exist_ok=True)
    df.to_csv("results/benchmark_results.csv", index=False)
    print("Benchmark complete. Results saved to results/benchmark_results.csv")

@hydra.main(version_base="1.3", config_path="../configs", config_name="config")
def main(cfg: DictConfig):
    run_benchmarks(cfg)

if __name__ == "__main__":
    main()
