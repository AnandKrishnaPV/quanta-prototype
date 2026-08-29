import torch
import torch.nn as nn
from models.transformer import TransformerBackbone, DimensionReduction
from models.quantum_layer import QuantumLayer
from models.fusion import FusionLayer
from models.classifier import PredictionHead
import math

class HybridQuantumLLM(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.config = config
        
        # 1. Classical Backbone
        self.backbone = TransformerBackbone(model_name_or_path=config.model.backbone)
        
        # 2. Dimension Reduction for Quantum Layer
        target_quantum_dim = 2 ** config.model.num_qubits if config.model.embedding_type == "amplitude" else config.model.num_qubits
        self.dim_reduction = DimensionReduction(input_dim=self.backbone.hidden_size, output_dim=target_quantum_dim)
        
        # 3. Quantum Interaction Layer
        self.quantum_layer = QuantumLayer(
            num_qubits=config.model.num_qubits,
            num_layers=config.model.quantum_layers,
            embedding_type=config.model.embedding_type,
            ansatz_type=config.model.ansatz_type,
            backend=config.quantum.backend
        )
        
        # 4. Fusion Layer
        self.fusion_layer = FusionLayer(
            classical_dim=self.backbone.hidden_size,
            quantum_dim=self.quantum_layer.output_dim,
            fusion_method=config.model.fusion_method
        )
        
        # 5. Prediction Head (Assuming regression for STS-B, change to 3 for NLI classification)
        self.classifier = PredictionHead(
            input_dim=self.fusion_layer.output_dim,
            num_classes=1, 
            task_type="regression"
        )

    def forward(self, input_ids, attention_mask):
        # Extract classical features
        classical_features = self.backbone(input_ids, attention_mask)
        
        # Reduce dimensions for quantum layer
        reduced_features = self.dim_reduction(classical_features)
        
        # Normalize if using amplitude embedding
        if self.config.model.embedding_type == "amplitude":
            reduced_features = torch.nn.functional.normalize(reduced_features, p=2, dim=1)
            
        # Extract quantum features
        quantum_features = self.quantum_layer(reduced_features)
        
        # Fuse classical and quantum features
        fused_features = self.fusion_layer(classical_features, quantum_features)
        
        # Prediction
        prediction = self.classifier(fused_features)
        return prediction

    def design_circuit(self):
        """
        Delegates circuit generation to the quantum layer.
        Returns (diagram, depth, gate_counts).
        """
        return self.quantum_layer.design_circuit()
