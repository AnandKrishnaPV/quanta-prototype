import pennylane as qml

def measure(wires, measurement_type="expectation"):
    """
    Applies measurement to the quantum circuit.
    
    Args:
        wires (list): Qubits to measure.
        measurement_type (str): Type of measurement to return.
                                Supports 'expectation', 'probabilities', 'state'.
    Returns:
        PennyLane measurement object.
    """
    if measurement_type == "expectation":
        # Return PauliZ expectation value for all wires
        return [qml.expval(qml.PauliZ(w)) for w in wires]
    elif measurement_type == "probabilities":
        # Return probability distribution over computational basis
        return qml.probs(wires=wires)
    elif measurement_type == "state":
        # Statevector/density matrix (not differentiable with some hardware, usually for simulation/explainability)
        return qml.state()
    else:
        raise ValueError(f"Unknown measurement_type: {measurement_type}")
