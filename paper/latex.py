import pandas as pd
import os

def df_to_latex_table(df, caption="", label="", output_path=None):
    """
    Converts a pandas DataFrame into a publication-ready LaTeX table
    using IEEE formatting conventions.
    """
    # Use booktabs style which is standard in IEEE/ACM papers
    latex_str = df.to_latex(
        index=False, 
        escape=False, 
        column_format='l' + 'c' * (len(df.columns) - 1),
        float_format="%.4f"
    )
    
    # Wrap in table environment
    table_env = f"""\\begin{{table}}[htbp]
\\centering
\\caption{{{caption}}}
\\label{{{label}}}
{latex_str}
\\end{{table}}
"""

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w') as f:
            f.write(table_env)
            
    return table_env
