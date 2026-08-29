import pennylane as qml
import matplotlib.pyplot as plt

def draw_circuit(qnode, inputs, weights):
    """
    Draws the quantum circuit using PennyLane's drawing tools.
    """
    fig, ax = qml.draw_mpl(qnode)(inputs, weights)
    plt.show()
    return fig

def plot_probabilities(probs, labels=None):
    """
    Plots the probability distribution of measurement outcomes.
    """
    if labels is None:
        labels = [f"{i:02b}" for i in range(len(probs))]
    
    plt.bar(labels, probs)
    plt.xlabel("Computational Basis State")
    plt.ylabel("Probability")
    plt.title("Measurement Outcome Distribution")
    plt.show()
