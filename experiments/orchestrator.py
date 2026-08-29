import hydra
from omegaconf import DictConfig, OmegaConf
import mlflow
import os
import time
from datetime import datetime
from training.reproducibility import generate_reproducibility_report
# Ensure modules are imported properly for running
from train import main as train_model

def launch_experiment(cfg: DictConfig, experiment_type: str):
    """
    Core orchestrator that runs specific experiments (benchmark, ablation, noise, scaling).
    Handles MLflow tracking, reproducibility logging, and error recovery.
    """
    print(f"[{datetime.now()}] Launching {experiment_type} experiment...")
    
    # 1. Reproducibility
    report_path = os.path.join(os.getcwd(), f"reproducibility_{experiment_type}.json")
    generate_reproducibility_report(seed=cfg.seed, output_path=report_path)
    
    # 2. MLFlow Tracking
    mlflow.set_tracking_uri(cfg.get("tracking_uri", "http://localhost:5000"))
    mlflow.set_experiment(f"QUANTA_{experiment_type}")
    
    with mlflow.start_run():
        mlflow.log_params(OmegaConf.to_container(cfg, resolve=True))
        mlflow.log_artifact(report_path)
        
        start_time = time.time()
        
        try:
            # Execute actual training/evaluation based on experiment type
            print(f"Running configuration: {cfg.model.backbone} with {cfg.model.num_qubits} qubits.")
            
            # This calls PyTorch Lightning Trainer on the GPU
            real_metrics = train_model(cfg)
            
            metrics = {
                "val_pearson": float(real_metrics.get("val_pearson", 0.0)),
                "val_spearman": float(real_metrics.get("val_spearman", 0.0)),
                "training_time_seconds": time.time() - start_time,
            }
            
            mlflow.log_metrics(metrics)
            print(f"[{datetime.now()}] Experiment {experiment_type} completed successfully.")
            
        except Exception as e:
            print(f"[{datetime.now()}] Experiment failed: {e}")
            mlflow.log_param("status", "FAILED")
            raise e

@hydra.main(version_base="1.3", config_path="../configs", config_name="config")
def main(cfg: DictConfig):
    # Determine the run type from config
    exp_type = cfg.get("experiment_type", "benchmark")
    launch_experiment(cfg, exp_type)

if __name__ == "__main__":
    main()
