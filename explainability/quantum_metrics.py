import pennylane as qml
import numpy as np

def calculate_entanglement_entropy(state_vector, partition_indices):
    """
    Calculates the von Neumann entanglement entropy for a given state vector
    across a specific bipartite cut (partition).
    """
    density_matrix = qml.math.reduced_dm(state_vector, indices=partition_indices)
    eigenvalues = np.linalg.eigvalsh(density_matrix)
    # Filter out near-zero eigenvalues to avoid log(0)
    eigenvalues = eigenvalues[eigenvalues > 1e-12]
    
    entropy = -np.sum(eigenvalues * np.log2(eigenvalues))
    return entropy

def get_circuit_depth_and_gates(qnode, inputs, weights):
    """
    Analyzes the PennyLane QNode to extract circuit depth, total gate count,
    and parameter count.
    """
    tape = qml.workflow.construct_tape(qnode)(inputs, weights)
    
    depth = tape.graph.get_depth()
    total_gates = len(tape.operations)
    num_params = tape.num_params
    
    # Count two-qubit gates (CNOT, CZ, etc.)
    two_qubit_gates = sum(1 for op in tape.operations if len(op.wires) == 2)
    
    return {
        "circuit_depth": depth,
        "total_gates": total_gates,
        "two_qubit_gates": two_qubit_gates,
        "trainable_parameters": num_params
    }
