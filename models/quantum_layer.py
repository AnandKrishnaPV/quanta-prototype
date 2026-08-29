import pennylane as qml
import torch
import torch.nn as nn
from circuits.embeddings import apply_embedding
from circuits.ansatz import apply_ansatz, get_weight_shape
from circuits.measurements import measure

class QuantumLayer(nn.Module):
    def __init__(self, 
                 num_qubits: int, 
                 num_layers: int, 
                 embedding_type: str = "amplitude", 
                 ansatz_type: str = "strongly_entangling",
                 backend: str = "lightning.qubit"):
        super().__init__()
        self.num_qubits = num_qubits
        self.num_layers = num_layers
        self.embedding_type = embedding_type
        self.ansatz_type = ansatz_type
        
        self.dev = qml.device(backend, wires=self.num_qubits)
        
        # Determine weight shape based on ansatz
        self.weight_shape = get_weight_shape(self.ansatz_type, self.num_layers, self.num_qubits)
        
        # Initialize quantum weights
        weight_tensors = {"weights": self.weight_shape}
        
        # QNode creation
        @qml.qnode(self.dev, interface="torch")
        def qnode(inputs, weights):
            apply_embedding(inputs, wires=range(self.num_qubits), embedding_type=self.embedding_type)
            apply_ansatz(weights, wires=range(self.num_qubits), ansatz_type=self.ansatz_type)
            # Return expectation values (feature vector)
            return measure(wires=range(self.num_qubits), measurement_type="expectation")
            
        self.qnode = qml.qnn.TorchLayer(qnode, weight_tensors)
        
        self.output_dim = self.num_qubits

    def forward(self, x):
        """
        x: (batch_size, input_dim) - classical features reduced to the required size
        """
        return self.qnode(x)

    def design_circuit(self, sample_input=None):
        """
        Returns the quantum circuit diagram and its depth as a tuple (diagram, depth, num_gates).
        This makes the system 'uniew' and allows analysis of the underlying quantum circuit.
        """
        import numpy as np
        if sample_input is None:
            # Generate a random sample input if none is provided
            dim = 2 ** self.num_qubits if self.embedding_type == "amplitude" else self.num_qubits
            sample_input = np.random.random(dim)
            if self.embedding_type == "amplitude":
                sample_input = sample_input / np.linalg.norm(sample_input)
                
        # Get random weights of the correct shape to draw the circuit
        weights = np.random.random(self.weight_shape)
        
        # Access the underlying qnode from the TorchLayer
        actual_qnode = self.qnode.qnode
        
        # Draw the circuit
        diagram = qml.draw(actual_qnode)(sample_input, weights)
        
        # Calculate specs
        specs = qml.specs(actual_qnode)(sample_input, weights)
        depth = specs['resources'].depth
        
        # Count gates by summing values in gate_types dict
        gate_counts = sum(specs['resources'].gate_types.values())
        
        return diagram, depth, gate_counts
