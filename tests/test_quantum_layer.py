import pytest
import torch
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from models.quantum_layer import QuantumLayer

def test_quantum_layer_output_shape():
    """Test if QuantumLayer produces the correct output dimensions."""
    batch_size = 4
    num_qubits = 4
    embed_dim = 2 ** num_qubits # 16 for amplitude encoding
    
    layer = QuantumLayer(num_qubits=num_qubits, num_layers=2, embedding_type="amplitude", ansatz_type="strongly_entangling")
    
    # Dummy input
    x = torch.rand((batch_size, embed_dim))
    # Must normalize for amplitude encoding
    x = torch.nn.functional.normalize(x, p=2, dim=1)
    
    out = layer(x)
    assert out.shape == (batch_size, num_qubits), f"Expected shape (4, {num_qubits}), got {out.shape}"

def test_quantum_layer_gradients():
    """Ensure gradients flow through the quantum layer."""
    batch_size = 2
    num_qubits = 2
    embed_dim = 4
    
    layer = QuantumLayer(num_qubits=num_qubits, num_layers=1, embedding_type="amplitude")
    
    x = torch.rand((batch_size, embed_dim), requires_grad=True)
    x_norm = torch.nn.functional.normalize(x, p=2, dim=1)
    
    out = layer(x_norm)
    loss = out.sum()
    loss.backward()
    
    # Check if the classical input received gradients
    assert x.grad is not None, "Gradients did not flow back to input."
    
    # Check if the quantum circuit parameters received gradients
    for param_name, param in layer.named_parameters():
        assert param.grad is not None, f"Gradient for {param_name} is None."
