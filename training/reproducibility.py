import platform
import torch
import pennylane as qml
import sys
import json
import subprocess
from datetime import datetime

def get_git_revision_hash() -> str:
    try:
        return subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode('ascii').strip()
    except Exception:
        return "unknown"

def generate_reproducibility_report(seed: int, output_path: str = "reproducibility.json"):
    """
    Generates a reproducibility report containing OS, Python, PyTorch, PennyLane versions,
    hardware specs, and the Git commit hash.
    """
    report = {
        "timestamp": datetime.utcnow().isoformat(),
        "random_seed": seed,
        "environment": {
            "os": platform.system(),
            "os_release": platform.release(),
            "python_version": sys.version,
            "pytorch_version": torch.__version__,
            "pennylane_version": qml.version(),
            "cuda_available": torch.cuda.is_available(),
            "cuda_version": torch.version.cuda if torch.cuda.is_available() else None,
            "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        },
        "version_control": {
            "git_commit": get_git_revision_hash()
        }
    }
    
    with open(output_path, 'w') as f:
        json.dump(report, f, indent=4)
    
    return report
