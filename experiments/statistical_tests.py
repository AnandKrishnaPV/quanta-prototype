import pandas as pd
from scipy.stats import ttest_rel, wilcoxon
import numpy as np

def cohens_d(group1, group2):
    """
    Computes Cohen's d effect size for two paired groups.
    """
    diff = np.array(group1) - np.array(group2)
    mean_diff = np.mean(diff)
    sd_diff = np.std(diff, ddof=1)
    
    if sd_diff == 0:
        return 0.0
    return mean_diff / sd_diff

def compute_significance(model_a_scores, model_b_scores):
    """
    Computes statistical significance between two models' predictions 
    across a benchmark dataset.
    Returns Paired t-test p-value, Wilcoxon p-value, and Cohen's d.
    """
    t_stat, t_pval = ttest_rel(model_a_scores, model_b_scores)
    w_stat, w_pval = wilcoxon(model_a_scores, model_b_scores)
    d = cohens_d(model_a_scores, model_b_scores)
    
    return {
        "paired_t_pvalue": t_pval,
        "wilcoxon_pvalue": w_pval,
        "cohens_d": d,
        "statistically_significant_05": t_pval < 0.05
    }
