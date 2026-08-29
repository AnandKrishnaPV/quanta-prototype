import pennylane as qml

def apply_embedding(features, wires, embedding_type="amplitude"):
    """
    Applies the specified embedding to encode classical features into quantum states.
    
    Args:
        features (tensor): Classical feature vector. Length must match the requirement 
                           for the chosen embedding (e.g., 2^n for amplitude).
        wires (list): Qubits to use.
        embedding_type (str): Type of embedding ('amplitude', 'angle').
    """
    if embedding_type == "amplitude":
        # AmplitudeEmbedding requires features to be normalized
        # PennyLane handles normalization internally if normalize=True
        qml.AmplitudeEmbedding(features=features, wires=wires, normalize=True, pad_with=0.0)
    elif embedding_type == "angle":
        # AngleEmbedding expects features equal to the number of wires
        qml.AngleEmbedding(features=features, wires=wires, rotation='Y')
    else:
        raise ValueError(f"Unknown embedding_type: {embedding_type}")
