import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import os

# IEEE Standard Formatting
plt.rcParams.update({
    "font.family": "serif",
    "font.serif": ["Times New Roman"],
    "font.size": 10,
    "axes.labelsize": 10,
    "axes.titlesize": 10,
    "xtick.labelsize": 8,
    "ytick.labelsize": 8,
    "legend.fontsize": 8,
    "figure.dpi": 300
})

def configure_colorblind_palette():
    # Colorblind safe palette (e.g., colorbrewer)
    sns.set_palette("colorblind")

def plot_scaling_benchmark(results_csv: str, output_dir: str = "paper_results/"):
    """
    Generates an IEEE-style scaling plot showing the effect of qubit count on accuracy.
    """
    os.makedirs(output_dir, exist_ok=True)
    configure_colorblind_palette()
    
    # Dummy data for prototype
    if not os.path.exists(results_csv):
        df = pd.DataFrame({
            "Qubits": [2, 4, 6, 8, 12, 16],
            "Pearson": [0.81, 0.83, 0.85, 0.86, 0.865, 0.862]
        })
    else:
        df = pd.read_csv(results_csv)
        
    fig, ax = plt.subplots(figsize=(3.5, 2.5)) # IEEE single column width
    sns.lineplot(data=df, x="Qubits", y="Pearson", marker="o", ax=ax)
    
    ax.set_title("Scaling of Pearson Correlation with Qubit Count")
    ax.set_xlabel("Number of Qubits")
    ax.set_ylabel("Pearson Correlation")
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "scaling_plot.pdf"), format="pdf")
    plt.savefig(os.path.join(output_dir, "scaling_plot.svg"), format="svg")
    plt.savefig(os.path.join(output_dir, "scaling_plot.png"), format="png", dpi=300)
    plt.close()

if __name__ == "__main__":
    # Test generation
    plot_scaling_benchmark("dummy.csv")
    print("Generated IEEE-style plots in paper_results/")
