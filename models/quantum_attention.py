import torch
import torch.nn as nn
from models.quantum_layer import QuantumLayer

class QuantumAttention(nn.Module):
    """
    Experimental Quantum Attention Mechanism.
    Uses parameterized quantum circuits to compute attention scores between classical embeddings.
    """
    def __init__(self, embed_dim: int, num_qubits: int, num_layers: int = 2):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_qubits = num_qubits
        
        # Project inputs to a size compatible with the quantum circuit
        # e.g., 2^num_qubits for amplitude encoding
        target_dim = 2 ** num_qubits
        self.q_proj = nn.Linear(embed_dim, target_dim)
        self.k_proj = nn.Linear(embed_dim, target_dim)
        self.v_proj = nn.Linear(embed_dim, target_dim)
        
        # A small PQC to act on the concatenated Query and Key
        # We need double the qubits if we concatenate, or we can add them.
        # For simplicity in this prototype, we'll add Q and K representations.
        self.quantum_interaction = QuantumLayer(
            num_qubits=num_qubits,
            num_layers=num_layers,
            embedding_type="amplitude",
            ansatz_type="basic_entangler"
        )
        
        # Project the quantum expectation values back to attention weights
        self.score_proj = nn.Linear(num_qubits, 1)

    def forward(self, query, key, value):
        """
        query, key, value: (batch_size, seq_len, embed_dim)
        Note: For sentence-level interaction, seq_len is often 1 or a few pooled representations.
        """
        batch_size, seq_len, _ = query.size()
        
        q = self.q_proj(query) # (batch, seq, target_dim)
        k = self.k_proj(key)   # (batch, seq, target_dim)
        v = self.v_proj(value) # (batch, seq, target_dim)
        
        # Compute scores using quantum layer
        # For simplicity, we assume seq_len=1 (sentence level)
        if seq_len == 1:
            q_k_interact = q.squeeze(1) + k.squeeze(1) # Simple interaction
            
            # Normalize for amplitude embedding
            q_k_interact = torch.nn.functional.normalize(q_k_interact, p=2, dim=1)
            
            q_out = self.quantum_interaction(q_k_interact) # (batch, num_qubits)
            scores = self.score_proj(q_out) # (batch, 1)
            attn_weights = torch.sigmoid(scores) # (batch, 1)
            
            out = attn_weights.unsqueeze(2) * v # (batch, 1, target_dim)
            return out, attn_weights
        else:
            raise NotImplementedError("Quantum Attention for seq_len > 1 is a work in progress.")
