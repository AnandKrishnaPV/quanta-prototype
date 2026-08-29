import pennylane as qml

def apply_ansatz(weights, wires, ansatz_type="strongly_entangling"):
    """
    Applies the parameterized quantum circuit (ansatz) to the qubits.
    
    Args:
        weights (tensor): Trainable parameters for the ansatz.
        wires (list): Qubits to apply the operations on.
        ansatz_type (str): Type of ansatz ('strongly_entangling', 'basic_entangler').
    """
    if ansatz_type == "strongly_entangling":
        qml.StronglyEntanglingLayers(weights=weights, wires=wires)
    elif ansatz_type == "basic_entangler":
        qml.BasicEntanglerLayers(weights=weights, wires=wires)
    else:
        raise ValueError(f"Unknown ansatz_type: {ansatz_type}")
        
def get_weight_shape(ansatz_type, num_layers, num_qubits):
    """
    Returns the expected shape of the weights for a given ansatz.
    """
    if ansatz_type == "strongly_entangling":
        return qml.StronglyEntanglingLayers.shape(n_layers=num_layers, n_wires=num_qubits)
    elif ansatz_type == "basic_entangler":
        return qml.BasicEntanglerLayers.shape(n_layers=num_layers, n_wires=num_qubits)
    else:
        raise ValueError(f"Unknown ansatz_type: {ansatz_type}")
