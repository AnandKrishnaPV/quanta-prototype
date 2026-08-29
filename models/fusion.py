import torch
import torch.nn as nn

class FusionLayer(nn.Module):
    def __init__(self, classical_dim: int, quantum_dim: int, fusion_method: str = "gated"):
        super().__init__()
        self.fusion_method = fusion_method
        self.classical_dim = classical_dim
        self.quantum_dim = quantum_dim
        
        fused_dim = classical_dim + quantum_dim
        
        if self.fusion_method == "gated":
            self.gate = nn.Sequential(
                nn.Linear(classical_dim + quantum_dim, classical_dim),
                nn.Sigmoid()
            )
            # We map quantum dim to classical dim to allow gating
            self.q_proj = nn.Linear(quantum_dim, classical_dim)
            self.output_dim = classical_dim
            
        elif self.fusion_method == "cross_attention":
            self.attention = nn.MultiheadAttention(embed_dim=classical_dim, num_heads=1, batch_first=True)
            self.q_proj = nn.Linear(quantum_dim, classical_dim)
            self.output_dim = classical_dim
            
        elif self.fusion_method == "concat":
            self.output_dim = fused_dim
            
        elif self.fusion_method == "residual":
            self.q_proj = nn.Linear(quantum_dim, classical_dim)
            self.output_dim = classical_dim
            
        else:
            raise ValueError(f"Unknown fusion_method: {fusion_method}")

    def forward(self, classical_features, quantum_features):
        """
        classical_features: (batch_size, classical_dim)
        quantum_features: (batch_size, quantum_dim)
        """
        if self.fusion_method == "concat":
            return torch.cat([classical_features, quantum_features], dim=-1)
            
        elif self.fusion_method == "gated":
            q_proj = self.q_proj(quantum_features)
            gate_input = torch.cat([classical_features, quantum_features], dim=-1)
            g = self.gate(gate_input)
            return g * classical_features + (1 - g) * q_proj
            
        elif self.fusion_method == "cross_attention":
            # Treat classical as query, quantum as key/value
            # Add sequence dimension: (batch, 1, dim)
            q_proj = self.q_proj(quantum_features)
            q = classical_features.unsqueeze(1)
            k = q_proj.unsqueeze(1)
            v = q_proj.unsqueeze(1)
            
            attn_out, _ = self.attention(q, k, v)
            return attn_out.squeeze(1)
            
        elif self.fusion_method == "residual":
            q_proj = self.q_proj(quantum_features)
            return classical_features + q_proj
