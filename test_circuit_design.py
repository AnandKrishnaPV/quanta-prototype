import pennylane as qml
from circuits.embeddings import apply_embedding
from circuits.ansatz import apply_ansatz
from circuits.measurements import measure
import numpy as np

num_qubits = 4
num_layers = 2
embedding_type = "amplitude"
ansatz_type = "strongly_entangling"

dev = qml.device("default.qubit", wires=num_qubits)

@qml.qnode(dev)
def qnode(inputs, weights):
    apply_embedding(inputs, wires=range(num_qubits), embedding_type=embedding_type)
    apply_ansatz(weights, wires=range(num_qubits), ansatz_type=ansatz_type)
    return measure(wires=range(num_qubits), measurement_type="expectation")

weights_shape = qml.StronglyEntanglingLayers.shape(n_layers=num_layers, n_wires=num_qubits)
weights = np.random.random(weights_shape)
inputs = np.random.random(2**num_qubits)
inputs = inputs / np.linalg.norm(inputs)

print("Circuit Diagram:")
print(qml.draw(qnode)(inputs, weights))

specs = qml.specs(qnode)(inputs, weights)
print("\nCircuit Specs:")
print(f"Depth: {specs['depth']}")
print(f"Gate count: {specs['gate_sizes']}")
