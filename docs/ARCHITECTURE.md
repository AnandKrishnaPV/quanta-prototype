# QUANTA Architecture Guide

## Overview
QUANTA is a research framework designed to evaluate Hybrid Quantum-Classical Large Language Models.
It dynamically fuses classical transformer embeddings with Parameterized Quantum Circuits (PQCs) to measure structural sentence interactions.

## Core Modules

### `models/`
- **TransformerBackbone**: Loads HuggingFace models and pools representations.
- **QuantumLayer**: Uses PennyLane to execute a PQC.
- **FusionLayer**: Merges classical and quantum features via gating or attention.

### `experiments/`
- **orchestrator.py**: The central hub for launching runs. Handles MLflow tracking, Hydra config resolution, and calls `generate_reproducibility_report`.
- **benchmark.py / ablation.py**: Automated scripts that iteratively alter the config (e.g. classical vs hybrid, modifying fusion type) and aggregate the results into `results/`.

### `paper/`
- **figures.py**: Consumes CSV data from `results/` and outputs strict IEEE-formatted vector graphics (PDF/SVG) to `paper_results/`.
- **latex.py**: Auto-generates LaTeX `.tex` tables for direct inclusion in manuscripts.

## Configuration
All configuration is handled via Hydra in the `configs/` directory.
Modify `configs/model/hybrid.yaml` to change qubits, layers, and embeddings.
Modify `configs/quantum/lightning.yaml` to apply simulated noise via `default.mixed`.
